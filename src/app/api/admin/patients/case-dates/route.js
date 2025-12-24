import { NextResponse } from "next/server";
import dbConnect from "../../../config/db";
import Patient from "../../../models/Patient";
import Distributer from "../../../models/Distributer";
import User from "../../../models/User";
import { admin } from "../../../middleware/authMiddleware";
import { sendEmail } from "../../../utils/mailer";
import { getCaseDetailsEmailTemplate } from "../../../utils/emailTemplates";

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

      // Send email to doctor whenever dates are updated
      if (doctor && doctor.email && (startDate !== null || endDate !== null)) {
        // Check if this is the first time both dates are set
        const wasBothDatesSet =
          patientBeforeUpdate.caseStartDate && patientBeforeUpdate.caseEndDate;
        const isFirstTimeBothSet =
          !wasBothDatesSet &&
          updatedPatient.caseStartDate &&
          updatedPatient.caseEndDate;

        // If both dates are set for the first time, send case details email
        if (isFirstTimeBothSet) {
          // Get full patient data for case details email
          const fullPatient = await Patient.findById(patientId)
            .populate("userId", "name email")
            .lean();

          const caseData = {
            doctorName: fullPatient.userId?.name || "Doctor",
            patientName: fullPatient.patientName,
            caseId: fullPatient.caseId,
            caseCategory: fullPatient.caseCategory,
            registeredDate: fullPatient.createdAt,
            approvalDate: fullPatient.updatedAt,
            startDate: fullPatient.caseStartDate,
            expiryDate: fullPatient.caseEndDate,
          };

          const emailHtml = getCaseDetailsEmailTemplate(caseData);
          await sendEmail({
            to: doctor.email,
            subject: `Case ${fullPatient.patientName} (${fullPatient.caseId}) Details Confirmed`,
            html: emailHtml,
          });
          console.log("Case details email sent successfully to:", doctor.email);
        } else {
          // Send notification email for date updates
          const oldStartDate = patientBeforeUpdate.caseStartDate;
          const startDateChanged =
            startDate !== null &&
            (!oldStartDate ||
              new Date(oldStartDate).getTime() !==
                new Date(startDate).getTime());
          const endDateChanged =
            endDate !== null &&
            (!oldEndDate ||
              new Date(oldEndDate).getTime() !== new Date(endDate).getTime());

          if (startDateChanged || endDateChanged) {
            let emailSubject = "";
            let emailTitle = "";
            let emailMessage = "";

            if (startDateChanged && endDateChanged) {
              emailSubject = `Case Dates Updated: ${updatedPatient.patientName} (${updatedPatient.caseId})`;
              emailTitle = "📅 Case Dates Updated";
              emailMessage =
                "The start and end dates for one of your patient cases have been updated by the admin.";
            } else if (startDateChanged) {
              emailSubject = `Case Start Date ${oldStartDate ? "Updated" : "Assigned"}: ${updatedPatient.patientName} (${updatedPatient.caseId})`;
              emailTitle =
                "📅 Case Start Date " + (oldStartDate ? "Updated" : "Assigned");
              emailMessage = `The start date for one of your patient cases has been ${oldStartDate ? "updated" : "assigned"} by the admin.`;
            } else if (endDateChanged) {
              emailSubject = `Case End Date ${oldEndDate ? "Updated" : "Assigned"}: ${updatedPatient.patientName} (${updatedPatient.caseId})`;
              emailTitle =
                "📅 Case End Date " + (oldEndDate ? "Updated" : "Assigned");
              emailMessage = `The end date for one of your patient cases has been ${oldEndDate ? "updated" : "assigned"} by the admin.`;
            }

            const emailHtml = `
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
                  .info-box p { margin: 8px 0; }
                  .date-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e0e0e0; }
                  .date-label { font-weight: 600; color: #495057; }
                  .date-value { color: #6c757d; }
                  .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>${emailTitle}</h1>
                  </div>
                  <div class="content">
                    <p>Dear Dr. ${doctor.name},</p>
                    <p>${emailMessage}</p>
                    <div class="info-box">
                      <p><strong>Patient Name:</strong> ${updatedPatient.patientName}</p>
                      <p><strong>Case ID:</strong> ${updatedPatient.caseId}</p>
                      ${
                        startDateChanged
                          ? `
                        <div class="date-row">
                          <span class="date-label">${oldStartDate ? "Previous Start Date:" : "Start Date:"}</span>
                          <span class="date-value">${oldStartDate ? new Date(oldStartDate).toLocaleDateString() : "Not set"}</span>
                        </div>
                        <div class="date-row">
                          <span class="date-label">New Start Date:</span>
                          <span class="date-value">${new Date(startDate).toLocaleDateString()}</span>
                        </div>
                      `
                          : updatedPatient.caseStartDate
                            ? `
                        <div class="date-row">
                          <span class="date-label">Start Date:</span>
                          <span class="date-value">${new Date(updatedPatient.caseStartDate).toLocaleDateString()}</span>
                        </div>
                      `
                            : ""
                      }
                      ${
                        endDateChanged
                          ? `
                        <div class="date-row">
                          <span class="date-label">${oldEndDate ? "Previous End Date:" : "End Date:"}</span>
                          <span class="date-value">${oldEndDate ? new Date(oldEndDate).toLocaleDateString() : "Not set"}</span>
                        </div>
                        <div class="date-row">
                          <span class="date-label">New End Date:</span>
                          <span class="date-value">${new Date(endDate).toLocaleDateString()}</span>
                        </div>
                      `
                          : updatedPatient.caseEndDate
                            ? `
                        <div class="date-row">
                          <span class="date-label">End Date:</span>
                          <span class="date-value">${new Date(updatedPatient.caseEndDate).toLocaleDateString()}</span>
                        </div>
                      `
                            : ""
                      }
                    </div>
                  </div>
                  <div class="footer">
                    <p>This is an automated notification from the Patient Management System.</p>
                  </div>
                </div>
              </body>
              </html>
            `;

            await sendEmail({
              to: doctor.email,
              subject: emailSubject,
              html: emailHtml,
            });
            console.log("Case dates update email sent to:", doctor.email);
          }
        }
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
