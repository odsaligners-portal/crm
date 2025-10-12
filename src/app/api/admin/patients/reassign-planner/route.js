import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import User from "@/app/api/models/User";
import DeadlineTime from "@/app/api/models/DeadlineTime";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { sendEmail } from "@/app/api/utils/mailer";

export async function PUT(req) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    if (authResult.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can reassign planners" },
        { status: 403 },
      );
    }

    await dbConnect();

    const { patientId, plannerId } = await req.json();

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }

    if (!plannerId || !mongoose.Types.ObjectId.isValid(plannerId)) {
      return NextResponse.json(
        { error: "Invalid planner ID" },
        { status: 400 },
      );
    }

    // Find the patient
    const patient = await Patient.findById(patientId).populate("plannerId");
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get the previous planner info for notification
    const previousPlanner = patient.plannerId;

    // Verify the new planner exists and is a planner
    const newPlanner = await User.findById(plannerId);
    if (!newPlanner || newPlanner.role !== "planner") {
      return NextResponse.json(
        { error: "Invalid planner selected" },
        { status: 400 },
      );
    }

    // Calculate new deadline
    const deadlineTime = await DeadlineTime.findOne();
    let plannerDeadline = null;
    const plannerAssignedAt = new Date();

    if (deadlineTime) {
      const deadlineDate = new Date(plannerAssignedAt);
      deadlineDate.setDate(deadlineDate.getDate() + (deadlineTime.days || 0));
      deadlineDate.setHours(
        deadlineDate.getHours() + (deadlineTime.hours || 0),
      );
      deadlineDate.setMinutes(
        deadlineDate.getMinutes() + (deadlineTime.minutes || 0),
      );
      plannerDeadline = deadlineDate;
    }

    // Update patient - using direct assignment and save for better date handling
    patient.plannerId = plannerId;
    patient.plannerAssignedAt = plannerAssignedAt;
    patient.plannerDeadline = plannerDeadline;
    patient.caseStatus = "setup pending";
    patient.fileUploadCount.remianing = 1;

    // Reset STL file upload status
    patient.stlFile.canUpload = false;
    patient.stlFile.uploaded = false;
    patient.stlFile.uploadedBy = null;
    patient.stlFile.uploadedAt = null;
    patient.stlFile.file.url = "";
    patient.stlFile.file.fileKey = "";
    patient.stlFile.file.uploadedAt = null;
    patient.stlFile.comment = "";

    const updatedPatient = await patient.save();


    // Populate the fields after save
    await updatedPatient.populate("plannerId userId");

    if (!updatedPatient) {
      return NextResponse.json(
        { error: "Failed to update patient record" },
        { status: 500 },
      );
    }

    // Send email notification to the new planner
    try {
      if (newPlanner.email) {
        const admin = await User.findById(authResult.user.id).select(
          "name email",
        );

        await sendEmail({
          to: newPlanner.email,
          subject: `New Patient Assignment - ${updatedPatient.patientName} (Case ID: ${updatedPatient.caseId})`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Patient Reassignment</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                .content { margin-bottom: 30px; }
                .patient-info { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
                .patient-info h3 { margin: 0 0 15px 0; color: #3b82f6; font-size: 18px; }
                .patient-info p { margin: 5px 0; }
                .deadline-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
                .deadline-box h4 { margin: 0 0 10px 0; color: #92400e; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .cta-button:hover { opacity: 0.9; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔄 Patient Reassigned</h1>
                </div>
                
                <div class="content">
                  <p>Hello ${newPlanner.name || "Planner"},</p>
                  
                  <p>You have been assigned to a patient case that needs your attention. The case has been reset to "Setup Pending" status.</p>
                  
                  <div class="patient-info">
                    <h3>👤 Patient Information</h3>
                    <p><strong>Patient Name:</strong> ${updatedPatient.patientName}</p>
                    <p><strong>Case ID:</strong> ${updatedPatient.caseId}</p>
                    <p><strong>Doctor:</strong> ${updatedPatient.userId?.name || "N/A"}</p>
                    <p><strong>Assigned By:</strong> ${admin?.name || "Admin"}</p>
                    <p><strong>Assignment Date:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>
                  
                  ${
                    plannerDeadline
                      ? `
                  <div class="deadline-box">
                    <h4>⏰ Deadline Information</h4>
                    <p><strong>Deadline:</strong> ${plannerDeadline.toLocaleString()}</p>
                    <p style="margin-top: 10px; font-size: 14px;">Please complete the setup before this deadline.</p>
                  </div>
                  `
                      : ""
                  }
                  
                  <p><strong>Status:</strong> Setup Pending</p>
                  <p><strong>File Upload Count:</strong> 1 remaining</p>
                  
                  <p>Please log in to your dashboard to start working on this case.</p>
                  
                  <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/planner/patients" class="cta-button">
                      🔗 Go to Dashboard
                    </a>
                  </div>
                </div>
                
                <div class="footer">
                  <p>This is an automated notification from the Patient Management System.</p>
                  <p>Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      }

      // If there was a previous planner, notify them as well
      if (
        previousPlanner &&
        previousPlanner.email &&
        previousPlanner._id.toString() !== plannerId
      ) {
        await sendEmail({
          to: previousPlanner.email,
          subject: `Patient Case Reassigned - ${updatedPatient.patientName} (Case ID: ${updatedPatient.caseId})`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Patient Reassignment</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                .content { margin-bottom: 30px; }
                .patient-info { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                .patient-info h3 { margin: 0 0 15px 0; color: #f59e0b; font-size: 18px; }
                .patient-info p { margin: 5px 0; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔄 Case Reassignment Notification</h1>
                </div>
                
                <div class="content">
                  <p>Hello ${previousPlanner.name || "Planner"},</p>
                  
                  <p>This is to inform you that a patient case previously assigned to you has been reassigned to another planner.</p>
                  
                  <div class="patient-info">
                    <h3>📋 Case Information</h3>
                    <p><strong>Patient Name:</strong> ${updatedPatient.patientName}</p>
                    <p><strong>Case ID:</strong> ${updatedPatient.caseId}</p>
                    <p><strong>New Planner:</strong> ${newPlanner.name}</p>
                    <p><strong>Reassignment Date:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <p>You no longer need to work on this case. If you have any questions, please contact the administrator.</p>
                </div>
                
                <div class="footer">
                  <p>This is an automated notification from the Patient Management System.</p>
                  <p>Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the reassignment
      console.error("Error sending email notification:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Planner reassigned successfully",
      data: {
        patientId: updatedPatient._id,
        patientName: updatedPatient.patientName,
        caseId: updatedPatient.caseId,
        plannerId: updatedPatient.plannerId,
        caseStatus: updatedPatient.caseStatus,
        fileUploadCount: updatedPatient.fileUploadCount,
      },
    });
  } catch (error) {
    console.error("Error reassigning planner:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
