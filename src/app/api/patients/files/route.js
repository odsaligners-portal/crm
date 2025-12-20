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
    const { patientId, files, entries } = body;

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

    // Support both old format (files) and new format (entries)
    let entriesToProcess = [];
    if (entries && Array.isArray(entries) && entries.length > 0) {
      // Ensure each entry has the required structure
      entriesToProcess = entries?.map((entry) => ({
        ...entry,
        entryId:
          entry.entryId ||
          `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        heading: entry.heading || "",
        comment: entry.comment || "",
        files: Array.isArray(entry.files) ? entry.files : [],
      }));
    } else if (files && Array.isArray(files) && files.length > 0) {
      // Legacy format: convert to entries format
      const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      entriesToProcess = [
        {
          entryId,
          comment: "",
          files:
            files?.length > 0 ? files?.map((f) => ({ ...f, entryId })) : [],
        },
      ];
    } else {
      return NextResponse.json(
        { success: false, message: "Missing patient ID, files, or entries" },
        { status: 400 },
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { success: false, message: "Missing patient ID" },
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

    // Save all files from all entries
    const savedFiles = [];
    for (const entry of entriesToProcess) {
      // Ensure entry has an entryId
      if (!entry.entryId) {
        entry.entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Handle entries with files
      if (
        entry?.files &&
        Array.isArray(entry?.files) &&
        entry.files.length > 0
      ) {
        for (const file of entry.files) {
          // Skip comment-only entries that don't have actual files
          if (file.commentOnly && !file.fileUrl) {
            // Create a file record for comment-only entries with placeholder values
            const commentFile = await new PatientFile({
              patientId,
              fileName: entry.comment || file.fileName || "Comment",
              fileType: "text",
              fileUrl: "comment-only-entry", // Placeholder value for comment-only entries
              fileKey: `comment-only-${entry.entryId}`, // Placeholder value for comment-only entries
              uploadedBy: user.id,
              entryId: entry.entryId,
              heading: entry.heading || null,
              approvalStatus: "pending",
            }).save();
            savedFiles.push(commentFile);
          } else if (file.fileUrl && file.fileUrl !== "comment-only-entry") {
            const savedFile = await new PatientFile({
              patientId,
              fileName: file.fileName,
              fileType: file.fileType,
              fileUrl: file.fileUrl,
              fileKey: file.fileKey,
              uploadedBy: user.id,
              entryId: entry.entryId,
              heading: entry.heading || null,
              approvalStatus: "pending",
            }).save();
            savedFiles.push(savedFile);
          }
        }
      }

      // Handle entries with only comments (no files)
      if (
        entry.comment &&
        entry.comment.trim() &&
        (!entry.files || entry.files.length === 0)
      ) {
        const commentFile = await new PatientFile({
          patientId,
          fileName: entry.comment.trim(),
          fileType: "text",
          fileUrl: "comment-only-entry", // Placeholder value for comment-only entries
          fileKey: `comment-only-${entry.entryId}`, // Placeholder value for comment-only entries
          uploadedBy: user.id,
          entryId: entry.entryId,
          heading: entry.heading || null,
          approvalStatus: "pending",
        }).save();
        savedFiles.push(commentFile);
      }
    }

    const updatedCount =
      patientData.fileUploadCount.count + entriesToProcess.length;

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
    )
      .populate("userId")
      .populate("plannerId");

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
      // Build entries HTML
      let entriesHtml = "";
      if (entriesToProcess && entriesToProcess.length > 0) {
        entriesHtml = entriesToProcess
          .map((entry, index) => {
            const entryNumber = index + 1;
            const entryHeading =
              entry.heading?.trim() || `Setup ${entryNumber}`;
            let filesHtml = "";

            // Build comment section (strip HTML tags for plain text preview, but keep for display)
            const commentText = entry.comment
              ? entry.comment.replace(/<[^>]*>/g, "").trim()
              : "";
            const hasComment = commentText.length > 0;

            // Build files list for this entry
            if (entry.files && entry.files.length > 0) {
              filesHtml = entry.files
                .map((file) => {
                  if (file.fileUrl && file.fileUrl !== "comment-only-entry") {
                    // Check if file name matches the comment to avoid duplication
                    const fileDisplayName = file.fileName || "File";
                    const strippedFileName = fileDisplayName
                      .replace(/<[^>]*>/g, "")
                      .trim();
                    // If file name matches comment, try to extract original name from fileKey or use generic name
                    let displayFileName = fileDisplayName;
                    if (hasComment && strippedFileName === commentText) {
                      // Try to extract original file name from fileKey
                      if (file.fileKey) {
                        const keyParts = file.fileKey.split("/");
                        const originalName = keyParts[keyParts.length - 1];
                        if (originalName && originalName !== fileDisplayName) {
                          displayFileName = originalName;
                        } else {
                          // Use generic name based on file type
                          displayFileName = `Uploaded ${file.fileType || "File"}`;
                          console.log(displayFileName);
                        }
                      }
                    }

                    return `
                      <div class="file-item">
                      
                        <div class="file-meta">
                          <span class="file-type">Type: ${file.fileType || "Unknown"}</span>
                        </div>
                        <a href="${file.fileUrl}" class="file-url" target="_blank">View File →</a>
                      </div>
                    `;
                  }
                  return "";
                })
                .join("");
            }

            const hasFiles = filesHtml.length > 0;

            return `
              <div class="entry-section">
                <div class="entry-header">
                  <span class="entry-number">${entryHeading}</span>
                </div>
                ${
                  hasComment
                    ? `
                  <div class="comment-section">
                    <h4 class="comment-label">📝 Description / Set-Up Remark / Rx Remarks:</h4>
                    <div class="comment-content">${entry.comment}</div>
                  </div>
                `
                    : `
                  <div class="comment-section">
                    <h4 class="comment-label">📝 Description / Set-Up Remark / Rx Remarks:</h4>
                    <div class="comment-content" style="color: #6c757d; font-style: italic;">No description provided</div>
                  </div>
                `
                }
                ${
                  hasFiles
                    ? `
                  <div class="files-section">
                    <h4 class="files-label">📎 Uploaded Files (${entry.files.filter((f) => f.fileUrl && f.fileUrl !== "comment-only-entry").length}):</h4>
                    ${filesHtml}
                  </div>
                `
                    : `
                  <div class="files-section">
                    <h4 class="files-label">📎 Uploaded Files:</h4>
                    <div style="color: #6c757d; font-style: italic; padding: 10px;">No files uploaded for this setup</div>
                  </div>
                `
                }
              </div>
            `;
          })
          .join("");
      } else {
        entriesHtml = `
          <div class="entry-section">
            <p>No entries found.</p>
          </div>
        `;
      }

      await sendEmail({
        to: notifyEmail,
        subject: `New Setups Uploaded - Patient: ${updatedPatient.patientName} (Case ID: ${updatedPatient.caseId})`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Setups Uploaded</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
              .container { max-width: 700px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { margin-bottom: 30px; }
              .patient-info { background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .patient-info h3 { margin: 0 0 20px 0; color: #667eea; font-size: 18px; font-weight: 600; }
              .patient-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 25px; }
              .detail-row { display: flex; flex-direction: column; }
              .detail-label { font-weight: 600; color: #495057; font-size: 14px; margin-bottom: 5px; }
              .detail-value { color: #212529; font-size: 15px; }
              @media (max-width: 600px) {
                .patient-details-grid { grid-template-columns: 1fr; }
              }
              .entries-container { margin: 20px 0; }
              .entry-section { background: #fff; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #667eea; }
              .entry-header { margin-bottom: 15px; }
              .entry-number { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; }
              .comment-section { background: #f0f4ff; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 3px solid #667eea; }
              .comment-label { margin: 0 0 10px 0; color: #667eea; font-size: 14px; font-weight: 600; }
              .comment-content { color: #495057; line-height: 1.8; }
              .files-section { margin: 15px 0; }
              .files-label { margin: 0 0 12px 0; color: #495057; font-size: 14px; font-weight: 600; }
              .file-item { background: #f8f9fa; padding: 12px 15px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #28a745; }
              .file-name { font-weight: 600; color: #28a745; margin-bottom: 5px; font-size: 14px; }
              .file-meta { font-size: 12px; color: #6c757d; margin-bottom: 8px; }
              .file-type { background: #e9ecef; padding: 2px 8px; border-radius: 4px; }
              .file-url { color: #007bff; text-decoration: none; font-size: 13px; font-weight: 500; }
              .file-url:hover { text-decoration: underline; }
              .empty-entry { color: #6c757d; font-style: italic; padding: 10px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .cta-button:hover { opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📁 New Setups Uploaded</h1>
              </div>
              
              <div class="content">
                <p>Hello,</p>
                
                <p>A planner has uploaded new setup entry/entries to the patient portal that require your attention.</p>
                
                <div class="patient-info">
                  <h3>👤 Patient Information</h3>
                  <div class="patient-details-grid">
                    <div class="detail-row">
                      <span class="detail-label">Patient Name:</span>
                      <span class="detail-value">${updatedPatient.patientName || "N/A"}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Case ID:</span>
                      <span class="detail-value">${updatedPatient.caseId || "N/A"}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Upload Date:</span>
                      <span class="detail-value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Total Setups:</span>
                      <span class="detail-value">${entriesToProcess?.length || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div class="entries-container">
                  <h3 style="color: #667eea; font-size: 20px; margin-bottom: 20px; font-weight: 600;">📋 Setup Details</h3>
                  ${entriesHtml}
                </div>
                
                <p style="margin-top: 20px;">Please review these setups and take appropriate action as required.</p>
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

    // Group files by entryId for setup entries
    const entriesMap = new Map();
    const ungroupedFiles = [];

    files.forEach((file) => {
      if (file.entryId) {
        if (!entriesMap.has(file.entryId)) {
          entriesMap.set(file.entryId, {
            entryId: file.entryId,
            heading: file.heading || null,
            files: [],
            comment: "",
            approvalStatus: file.approvalStatus || "pending",
            uploadedAt: file.uploadedAt,
          });
        }
        const entry = entriesMap.get(file.entryId);
        entry.files.push(file);
        // Get heading from first file if available
        if (file.heading && !entry.heading) {
          entry.heading = file.heading;
        }
        // Get comment from first file if it's a comment-only entry
        if (
          file.fileType === "text" &&
          file.fileUrl === "comment-only-entry" &&
          file.fileName
        ) {
          entry.comment = file.fileName;
        }
        // Update approval status if any file has a different status
        if (file.approvalStatus && file.approvalStatus !== "pending") {
          entry.approvalStatus = file.approvalStatus;
        }
      } else {
        ungroupedFiles.push(file);
      }
    });

    const entries = Array.from(entriesMap.values());

    return NextResponse.json({
      success: true,
      files: ungroupedFiles,
      entries: entries,
    });
  } catch (error) {
    console.error("Error fetching patient files:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
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

    // Only doctors can approve entries
    if (user.role !== "doctor") {
      return NextResponse.json(
        {
          success: false,
          message: "Only doctors can approve planner entries",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { patientId, entryId } = body;

    if (!patientId || !entryId) {
      return NextResponse.json(
        { success: false, message: "Missing patientId or entryId" },
        { status: 400 },
      );
    }

    // Verify doctor has access to this patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 },
      );
    }

    if (patient.userId?.toString() !== user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to approve entries for this patient",
        },
        { status: 403 },
      );
    }

    // Approve the selected entry
    await PatientFile.updateMany(
      { patientId, entryId },
      {
        $set: {
          approvalStatus: "approved",
          approvedBy: user.id,
          approvedAt: new Date(),
        },
      },
    );

    // Reject all other entries for this patient
    await PatientFile.updateMany(
      {
        patientId,
        entryId: { $ne: entryId },
        approvalStatus: "pending",
      },
      {
        $set: {
          approvalStatus: "rejected",
          approvedBy: user.id,
          approvedAt: new Date(),
        },
      },
    );

    // Update patient case status to approved if it was approval pending
    let caseWasApproved = false;
    if (patient.caseStatus === "approval pending") {
      await Patient.findByIdAndUpdate(patientId, {
        $set: {
          caseStatus: "approved",
          "stlFile.canUpload": true,
        },
      });
      caseWasApproved = true;
    }

    // Send notifications to admins and distributors when case is approved
    if (caseWasApproved) {
      try {
        // Fetch updated patient with populated fields
        const updatedPatient = await Patient.findById(patientId)
          .populate("userId")
          .populate("plannerId");

        if (updatedPatient) {
          const recipients = [];

          // Get all admins
          const admins = await User.find({ role: "admin" }, "email").lean();
          admins.forEach((admin) => {
            if (admin.email) recipients.push(admin.email);
          });

          // Get distributor email
          if (updatedPatient.userId?.distributerId) {
            const distributer = await Distributer.findById(
              updatedPatient.userId.distributerId,
            ).select("email");
            if (distributer?.email) {
              recipients.push(distributer.email);
            }
          }

          // Send email notification (deduplicate recipients)
          const uniqueRecipients = [...new Set(recipients.filter(Boolean))];
          if (uniqueRecipients.length > 0) {
            await sendEmail({
              to: uniqueRecipients,
              subject: `Case Approved - Patient: ${updatedPatient.patientName} (Case ID: ${updatedPatient.caseId})`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Case Approved</title>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .content { margin-bottom: 30px; }
                    .patient-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
                    .patient-info h3 { margin: 0 0 15px 0; color: #28a745; font-size: 18px; }
                    .detail-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e0e0e0; }
                    .detail-label { font-weight: 600; color: #495057; }
                    .detail-value { color: #6c757d; text-align: right; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>✅ Case Approved</h1>
                    </div>
                    
                    <div class="content">
                      <p>Hello,</p>
                      
                      <p>A doctor has approved a case that requires your attention.</p>
                      
                      <div class="patient-info">
                        <h3>👤 Patient Information</h3>
                        <div class="detail-row">
                          <span class="detail-label">Patient Name:</span>
                          <span class="detail-value">${updatedPatient.patientName || "N/A"}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">Case ID:</span>
                          <span class="detail-value">${updatedPatient.caseId || "N/A"}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">Status:</span>
                          <span class="detail-value" style="color: #28a745; font-weight: 600;">Approved</span>
                        </div>
                      </div>
                      
                      <p style="margin-top: 20px;">The case has been approved and is now ready for the next steps in the workflow.</p>
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
      } catch (error) {
        console.error("Error sending approval notifications:", error);
        // Don't fail the approval if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Entry approved successfully",
    });
  } catch (error) {
    console.error("Error approving entry:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
