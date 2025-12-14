import { NextResponse } from "next/server";
import dbConnect from "../../../config/db";
import Patient from "../../../models/Patient";
import Distributer from "../../../models/Distributer";
import User from "../../../models/User";
import { admin } from "../../../middleware/authMiddleware";
import { sendEmail } from "../../../utils/mailer";

// GET - Get all patients with case dates
export async function GET(req) {
  try {
    await dbConnect();

    const authResult = await admin(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const search = searchParams.get("search") || "";
    const hasEndDate = searchParams.get("hasEndDate");

    // Build query - only show approved cases
    const query = { caseStatus: "approved" };
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: "i" } },
        { caseId: { $regex: search, $options: "i" } },
      ];
    }
    if (hasEndDate === "false") {
      query.caseEndDate = null;
    } else if (hasEndDate === "true") {
      query.caseEndDate = { $ne: null };
    }

    const skip = (page - 1) * limit;

    const patients = await Patient.find(query)
      .populate("userId", "name email")
      .populate("createdBy", "name email role")
      .select(
        "patientName caseId caseStartDate caseEndDate caseStatus userId createdBy createdAt",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Patient.countDocuments(query);

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching case dates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update case end date
export async function PUT(req) {
  try {
    await dbConnect();

    const authResult = await admin(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId, caseStartDate, caseEndDate } = await req.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 },
      );
    }

    // Validate dates if provided
    let startDate = null;
    if (caseStartDate) {
      startDate = new Date(caseStartDate);
      // Set to start of day (midnight) to store only date, not time
      startDate.setHours(0, 0, 0, 0);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date format" },
          { status: 400 },
        );
      }
    }

    let endDate = null;
    if (caseEndDate) {
      endDate = new Date(caseEndDate);
      // Set to start of day (midnight) to store only date, not time
      endDate.setHours(0, 0, 0, 0);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date format" },
          { status: 400 },
        );
      }
    }

    // If both dates are provided, validate that end date is after start date
    if (startDate && endDate && endDate < startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

    // Get patient to check case status
    const patient = await Patient.findById(patientId).select(
      "caseStartDate caseEndDate patientName caseId caseStatus",
    );

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if case is approved - deadline can only be assigned if case is approved
    if (endDate && patient.caseStatus !== "approved") {
      return NextResponse.json(
        { error: "Case deadline can only be assigned if the case is approved" },
        { status: 400 },
      );
    }

    // Validate that end date is after start date (use provided startDate or existing)
    const effectiveStartDate = startDate || patient.caseStartDate;
    if (effectiveStartDate && endDate && endDate < effectiveStartDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

    // Store old end date for email notification
    const oldEndDate = patient.caseEndDate;

    // Get full patient data with doctor info
    const patientBeforeUpdate = await Patient.findById(patientId)
      .populate("userId", "name email distributerId")
      .lean();

    if (!patientBeforeUpdate) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Prepare update object
    const updateData = {};
    if (startDate !== null) {
      updateData.caseStartDate = startDate;
    }
    if (endDate !== null) {
      updateData.caseEndDate = endDate;
    }

    // Update dates
    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      updateData,
      { new: true },
    )
      .populate("userId", "name email")
      .select("patientName caseId caseStartDate caseEndDate userId");

    // Send email notifications to doctor and distributor
    try {
      const doctor = patientBeforeUpdate.userId;
      let distributor = null;

      // Get distributor through doctor's distributerId
      if (doctor && doctor.distributerId) {
        distributor = await Distributer.findById(doctor.distributerId)
          .select("name email")
          .lean();
      }

      // Email template for doctor (only send if end date is being set or updated)
      if (doctor && doctor.email && endDate) {
        // Determine if this is a new assignment or an update
        const isNewAssignment = !oldEndDate;
        const isUpdate =
          oldEndDate && oldEndDate.getTime() !== endDate.getTime();

        const emailTitle = isNewAssignment
          ? "Case End Date Assigned"
          : isUpdate
            ? "Case End Date Updated"
            : "Case End Date Assigned";

        const emailSubject = isNewAssignment
          ? `Case End Date Assigned: ${updatedPatient.patientName} (${updatedPatient.caseId})`
          : isUpdate
            ? `Case End Date Updated: ${updatedPatient.patientName} (${updatedPatient.caseId})`
            : `Case End Date Assigned: ${updatedPatient.patientName} (${updatedPatient.caseId})`;

        const dateChangeSection = isUpdate
          ? `
                <div class="date-change-box">
                  <h3>📅 Date Change Details</h3>
                  <div style="display: flex; justify-content: space-around; margin: 20px 0;">
                    <div style="flex: 1; padding: 15px; background: #fff3cd; border-radius: 8px; margin-right: 10px; border: 2px solid #ffc107;">
                      <p style="margin: 0; font-size: 12px; color: #856404; font-weight: bold;">Previous Expiry</p>
                      <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #856404;">${new Date(oldEndDate).toLocaleDateString()}</p>
                    </div>
                    <div style="flex: 1; padding: 15px; background: #d4edda; border-radius: 8px; margin-left: 10px; border: 2px solid #28a745;">
                      <p style="margin: 0; font-size: 12px; color: #155724; font-weight: bold;">New Expiry</p>
                      <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #155724;">${new Date(endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              `
          : `
                <div class="date-box">
                  <h3>⏰ Case End Date</h3>
                  <div class="date-value">${new Date(endDate).toLocaleDateString()}</div>
                </div>
              `;

        const emailMessage = isNewAssignment
          ? `<p>An end date has been assigned to one of your patient cases by the admin.</p>
             <p><strong>Your new case expiry is: ${new Date(endDate).toLocaleDateString()}</strong></p>`
          : isUpdate
            ? `<p>The end date for one of your patient cases has been updated by the admin.</p>
             <p><strong>Your case expiry has been changed from ${new Date(oldEndDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</strong></p>`
            : `<p>An end date has been assigned to one of your patient cases by the admin.</p>`;

        const doctorEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${emailTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { margin-bottom: 30px; }
              .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .info-box h3 { margin: 0 0 15px 0; color: #667eea; font-size: 18px; }
              .info-box p { margin: 5px 0; }
              .date-box { background: #e9f7ef; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #28a745; text-align: center; }
              .date-box h3 { margin: 0 0 10px 0; color: #28a745; font-size: 18px; }
              .date-value { font-size: 24px; font-weight: bold; color: #28a745; }
              .date-change-box { margin: 20px 0; }
              .date-change-box h3 { margin: 0 0 15px 0; color: #667eea; font-size: 18px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📅 ${emailTitle}</h1>
              </div>
              
              <div class="content">
                <p>Dear Dr. ${doctor.name},</p>
                
                ${emailMessage}
                
                <div class="info-box">
                  <h3>📋 Patient Information</h3>
                  <p><strong>Patient Name:</strong> ${updatedPatient.patientName}</p>
                  <p><strong>Case ID:</strong> ${updatedPatient.caseId}</p>
                </div>
                
                ${dateChangeSection}
                
                <p>Please ensure all necessary work is completed before the end date. You can track the countdown timer on your dashboard and patient details page.</p>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from the Patient Management System.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: doctor.email,
          subject: emailSubject,
          html: doctorEmailHtml,
        });
        console.log("Doctor email sent successfully to:", doctor.email);
      }

      // Email template for distributor
      if (distributor && distributor.email) {
        const distributorEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Case End Date Assigned</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { margin-bottom: 30px; }
              .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
              .info-box h3 { margin: 0 0 15px 0; color: #007bff; font-size: 18px; }
              .info-box p { margin: 5px 0; }
              .date-box { background: #e9f7ef; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #28a745; text-align: center; }
              .date-box h3 { margin: 0 0 10px 0; color: #28a745; font-size: 18px; }
              .date-value { font-size: 24px; font-weight: bold; color: #28a745; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📅 Case End Date Assigned</h1>
              </div>
              
              <div class="content">
                <p>Hello ${distributor.name},</p>
                
                <p>An end date has been assigned to a patient case associated with your account by the admin.</p>
                
                <div class="info-box">
                  <h3>📋 Patient Information</h3>
                  <p><strong>Patient Name:</strong> ${updatedPatient.patientName}</p>
                  <p><strong>Case ID:</strong> ${updatedPatient.caseId}</p>
                  ${updatedPatient.caseStartDate ? `<p><strong>Start Date:</strong> ${new Date(updatedPatient.caseStartDate).toLocaleDateString()}</p>` : ""}
                  ${doctor ? `<p><strong>Doctor:</strong> Dr. ${doctor.name}</p>` : ""}
                </div>
                
                <div class="date-box">
                  <h3>⏰ Case End Date</h3>
                  <div class="date-value">${new Date(endDate).toLocaleDateString()}</div>
                </div>
                
                <p>Please note this end date for your records. The doctor assigned to this case has also been notified.</p>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from the Patient Management System.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: distributor.email,
          subject: `Case End Date Assigned: ${updatedPatient.patientName} (${updatedPatient.caseId})`,
          html: distributorEmailHtml,
        });
        console.log(
          "Distributor email sent successfully to:",
          distributor.email,
        );
      }

      // Send email to all admins with both start and end dates
      if (startDate || endDate) {
        const allAdmins = await User.find({ role: "admin" })
          .select("email name")
          .lean();

        const adminEmails = allAdmins
          .map((admin) => admin.email)
          .filter(Boolean);

        if (adminEmails.length > 0) {
          const adminEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Case Dates Updated</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                .content { margin-bottom: 30px; }
                .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .info-box h3 { margin: 0 0 15px 0; color: #667eea; font-size: 18px; }
                .info-box p { margin: 5px 0; }
                .dates-box { display: flex; gap: 15px; margin: 20px 0; }
                .date-card { flex: 1; padding: 20px; border-radius: 8px; text-align: center; }
                .start-date-card { background: #e3f2fd; border: 2px solid #2196f3; }
                .end-date-card { background: #e9f7ef; border: 2px solid #28a745; }
                .date-card h3 { margin: 0 0 10px 0; font-size: 16px; }
                .start-date-card h3 { color: #1976d2; }
                .end-date-card h3 { color: #28a745; }
                .date-value { font-size: 20px; font-weight: bold; margin-top: 10px; }
                .start-date-value { color: #1976d2; }
                .end-date-value { color: #28a745; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📅 Case Dates Updated</h1>
                </div>
                
                <div class="content">
                  <p>Dear Admin,</p>
                  
                  <p>Case dates have been ${startDate && endDate ? "set" : startDate ? "updated (start date)" : "updated (end date)"} for a patient case.</p>
                  
                  <div class="info-box">
                    <h3>📋 Patient Information</h3>
                    <p><strong>Patient Name:</strong> ${updatedPatient.patientName}</p>
                    <p><strong>Case ID:</strong> ${updatedPatient.caseId}</p>
                    ${doctor ? `<p><strong>Doctor:</strong> Dr. ${doctor.name}</p>` : ""}
                  </div>
                  
                  <div class="dates-box">
                    ${
                      startDate
                        ? `
                      <div class="date-card start-date-card">
                        <h3>📅 Case Start Date</h3>
                        <div class="date-value start-date-value">${new Date(startDate).toLocaleDateString()}</div>
                      </div>
                    `
                        : ""
                    }
                    ${
                      endDate
                        ? `
                      <div class="date-card end-date-card">
                        <h3>⏰ Case End Date</h3>
                        <div class="date-value end-date-value">${new Date(endDate).toLocaleDateString()}</div>
                      </div>
                    `
                        : ""
                    }
                  </div>
                  
                  <p>Please note these dates for your records.</p>
                </div>
                
                <div class="footer">
                  <p>This is an automated notification from the Patient Management System.</p>
                  <p>Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail({
            to: adminEmails,
            subject: `Case Dates Updated: ${updatedPatient.patientName} (${updatedPatient.caseId})`,
            html: adminEmailHtml,
          });
          console.log(
            "Admin emails sent successfully to:",
            adminEmails.join(", "),
          );
        }
      }
    } catch (emailError) {
      console.error("Error sending end date notification emails:", emailError);
      // Don't fail the update if emails fail
    }

    return NextResponse.json({
      message: "Case end date updated successfully",
      patient: updatedPatient,
    });
  } catch (error) {
    console.error("Error updating case end date:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
