import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import User from "@/app/api/models/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { storage } from "@/utils/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { sendEmail } from "@/app/api/utils/mailer";

export async function POST(req) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    if (authResult.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can upload STL files via this endpoint" },
        { status: 403 },
      );
    }

    await dbConnect();

    const formData = await req.formData();
    const patientId = formData.get("patientId");
    const file = formData.get("stlFile");
    const comment = formData.get("comment") || "";

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Validate file type - accept any file type
    // Basic validation to ensure it's a file
    if (!file.name || file.size === 0) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    // Check file size (limit to 25MB to match frontend validation)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 25MB" },
        { status: 400 },
      );
    }

    // Find the patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if patient can upload files
    if (!patient.stlFile?.canUpload) {
      return NextResponse.json(
        { error: "File upload is not available for this patient" },
        { status: 403 },
      );
    }

    // Admin can re-upload if needed, so we don't check if file is already uploaded

    // Upload file to Firebase Storage
    const fileBuffer = await file.arrayBuffer();
    const uniqueFileName = `${patientId}-${Date.now()}-${file.name}`;
    const storagePath = `patient-files/${patientId}/${uniqueFileName}`;
    const storageRef = ref(storage, storagePath);

    // Convert ArrayBuffer to Blob
    const blob = new Blob([fileBuffer], { type: file.type });
    const uploadTask = uploadBytesResumable(storageRef, blob);

    // Wait for upload to complete
    await new Promise((resolve, reject) => {
      uploadTask.on("state_changed", null, reject, resolve);
    });

    // Get download URL
    const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);

    // Prepare update object - DO NOT modify stlFile.uploadedAt as it's used for planner deadline monitoring
    const updateData = {
      "stlFile.uploaded": true,
      "stlFile.uploadedBy": authResult.user.id,
      "stlFile.file.url": fileUrl,
      "stlFile.file.fileKey": storagePath,
      "stlFile.file.uploadedAt": new Date(),
      "stlFile.comment": comment,
    };

    // Only set stlFile.uploadedAt if it doesn't exist (first upload)
    if (!patient.stlFile?.uploadedAt) {
      updateData["stlFile.uploadedAt"] = new Date();
    }

    // Update patient with file information and comment
    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      {
        $set: updateData,
      },
      { new: true, runValidators: true },
    );

    if (!updatedPatient) {
      return NextResponse.json(
        { error: "Failed to update patient record" },
        { status: 500 },
      );
    }

    // Send email notification to planner if exists
    try {
      if (updatedPatient.plannerId) {
        // Get planner information
        const planner = await User.findById(updatedPatient.plannerId).select(
          "name email",
        );

        if (planner && planner.email) {
          // Get admin information
          const admin = await User.findById(authResult.user.id).select(
            "name email",
          );

          await sendEmail({
            to: planner.email,
            subject: `STL File Updated by Admin - Patient: ${updatedPatient.patientName} (Case ID: ${updatedPatient.caseId})`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>STL File Updated</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
                  .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                  .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
                  .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                  .content { margin-bottom: 30px; }
                  .patient-info { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
                  .patient-info h3 { margin: 0 0 15px 0; color: #3b82f6; font-size: 18px; }
                  .patient-info p { margin: 5px 0; }
                  .file-info { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
                  .file-info h3 { margin: 0 0 15px 0; color: #374151; font-size: 16px; }
                  .file-item { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #3b82f6; }
                  .file-name { font-weight: 600; color: #3b82f6; margin-bottom: 5px; }
                  .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
                  .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                  .cta-button:hover { opacity: 0.9; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📁 STL File Updated by Admin</h1>
                  </div>
                  
                  <div class="content">
                    <p>Hello ${planner.name || "Planner"},</p>
                    
                    <p>An admin has uploaded/updated the STL file for one of your assigned patients.</p>
                    
                    <div class="patient-info">
                      <h3>👤 Patient Information</h3>
                      <p><strong>Patient Name:</strong> ${updatedPatient.patientName}</p>
                      <p><strong>Case ID:</strong> ${updatedPatient.caseId}</p>
                      <p><strong>Updated By:</strong> ${admin?.name || "Admin"}</p>
                      <p><strong>Update Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="file-info">
                      <h3>📋 File Details</h3>
                      <div class="file-item">
                        <div class="file-name">STL File</div>
                        <p>File has been successfully uploaded and is ready for review.</p>
                        ${comment ? `<p><strong>Comments:</strong> ${comment.replace(/<[^>]*>/g, "")}</p>` : ""}
                      </div>
                    </div>
                    
                    <p>Please review the updated STL file and continue with your work as needed.</p>
                    
                    <div style="text-align: center;">
                      <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/planner/patients" class="cta-button">
                        🔗 View in Planner Dashboard
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
      }
    } catch (emailError) {
      // Log email error but don't fail the upload
      console.error("Error sending email notification:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        patientId: updatedPatient._id,
        stlFile: updatedPatient.stlFile,
        comment: comment,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    if (authResult.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can access this endpoint" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }

    await dbConnect();

    const patient = await Patient.findById(patientId).select("stlFile");
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      stlFile: patient.stlFile,
      comment: patient.stlFile?.comment || "",
    });
  } catch (error) {
    console.error("Error fetching file info:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
