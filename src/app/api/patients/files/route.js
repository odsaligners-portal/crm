import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import PatientFile from "@/app/api/models/PatientFile";
import Patient from "@/app/api/models/Patient";
import User from "@/app/api/models/User";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import { sendEmail } from "@/app/api/utils/mailer";
import Distributer from "@/app/api/models/Distributer";
import Notification from "@/app/api/models/Notification";

export async function POST(req) {
  try {
    await dbConnect();

    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.error || "Authentication required",
        },
        { status: 401 },
      );
    }

    const { user } = authResult;

    const body = await req.json();
    const { patientId, files } = body;

    const verifyPlannerForPatient = await Patient.findOne({
      _id: patientId,
      plannerId: user.id,
    })
      .populate("userId")
      .populate("plannerId");

    if (!verifyPlannerForPatient) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to upload files for this patient",
        },
        { status: 403 },
      );
    }


    if (!patientId || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "Missing patient ID or files" },
        { status: 400 },
      );
    }

    const patientData = await Patient.findById(patientId);

    if (patientData?.fileUploadCount.remianing === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have access to upload the files.",
        },
        { status: 400 },
      );
    }

    const planner = await User.findById(user.id);

    // Save all files
    const savedFiles = await Promise.all(
      files.map((file) =>
        new PatientFile({
          patientId,
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          fileKey: file.fileKey,
          uploadedBy: user.id,
        }).save(),
      ),
    );

    const updatedCount = patientData.fileUploadCount.count + 1;

    // Update patient case status
    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      {
        $set: {
          caseStatus: "approval pending",
          fileUploadCount: { count: updatedCount, remianing: 0 },
        },
      },
      { new: true, runValidators: true },
    ).populate("userId");

    if (!updatedPatient) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 },
      );
    }

    const distributer = await Distributer.findById(
      updatedPatient.userId.distributerId,
    );
    const admins = await User.find({ role: "admin" });

    const recipients = [];

    // Admins
    admins.forEach((admin) => {
      recipients.push({
        user: admin._id,
        role: "admin",
        read: false,
      });
    });

    // Doctor
    if (verifyPlannerForPatient?.userId?._id) {
      recipients.push({
        user: verifyPlannerForPatient?.userId?._id,
        role: "doctor",
        read: false,
      });
    }

    // Distributer
    if (distributer) {
      recipients.push({
        user: distributer._id,
        role: "distributor",
        read: false,
      });
    }

    // Create notification
    await Notification.create({
      title: `New files uploaded for patient ${updatedPatient.patientName} (Case ID: ${updatedPatient.caseId})`,
      type: "File Upload Notification",
      commentedBy: {
        id: planner._id,
        name: planner.name,
        model: "User",
      },
      recipients,
    });

    // Determine notification target
    let notifyEmail = null;

    if (planner) {
      const adminEmails = admins.map((admin) => admin.email).filter(Boolean);
      const doctorEmail = verifyPlannerForPatient?.userId?.email;
      const distributerEmail = distributer?.email;
      const allMails = [doctorEmail, distributerEmail, ...adminEmails];
      notifyEmail = allMails.join(",");
    }
    // Send email
    if (notifyEmail) {
      await sendEmail({
        to: notifyEmail,
        subject: `New Files Uploaded for Patient: ${updatedPatient.patientName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Files Uploaded</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { margin-bottom: 30px; }
              .patient-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .patient-info h3 { margin: 0 0 15px 0; color: #667eea; font-size: 18px; }
              .patient-info p { margin: 5px 0; }
              .file-list { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .file-list h3 { margin: 0 0 15px 0; color: #495057; font-size: 16px; }
              .file-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #28a745; }
              .file-name { font-weight: 600; color: #28a745; margin-bottom: 5px; }
              .file-url { color: #007bff; text-decoration: none; word-break: break-all; }
              .file-url:hover { text-decoration: underline; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .cta-button:hover { opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📁 New Files Uploaded</h1>
              </div>
              
              <div class="content">
                <p>Hello,</p>
                
                <p>New files have been uploaded to the patient portal that require your attention.</p>
                
                <div class="patient-info">
                  <h3>👤 Patient Information</h3>
                  <p><strong>Patient Name:</strong> ${updatedPatient.patientName}</p>
                  <p><strong>Case ID:</strong> ${updatedPatient.caseId}</p>
                  <p><strong>Uploaded By:</strong> ${planner?.name}</p>
                  <p><strong>Upload Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                                  <div class="file-list">
                    <h3>📋 Uploaded Files</h3>
                    ${files
                      .map(
                        (file, index) => `
                        <div class="file-name" style="margin-bottom: 10px;">${index === 0 && file.fileName}</div>
                          <div class="file-item">
                        <a href="${file.fileUrl}" class="file-url" target="_blank">View File</a>
                      </div>
                    `,
                      )
                      .join("")}
                  </div>
                
                <p>Please review these files and take appropriate action as required.</p>
                
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" class="cta-button">
                    🔗 Access Patient Portal
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

    return NextResponse.json({ success: true, files: savedFiles });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { success: false, message: "Server error! Please contact to admin" },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.error || "Authentication required",
        },
        { status: 401 },
      );
    }
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { success: false, message: "Missing patientId" },
        { status: 400 },
      );
    }
    // Fetch patient to check access
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 },
      );
    }
    const files = await PatientFile.find({ patientId }).sort({
      uploadedAt: -1,
    });
    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error("Error fetching patient files:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
