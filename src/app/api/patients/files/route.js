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
    }).populate("userId");

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
          uploadedBy: user.name,
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
      const fileListHtml = files
        .map(
          (file) => `
          <li><strong>${file.fileName}</strong> :- <a href="${file.fileUrl}" target="_blank">${file.fileUrl}</a></li>`,
        )
        .join("");

      await sendEmail({
        to: notifyEmail,
        subject: `New Files Uploaded for Patient: ${updatedPatient.patientName} `,
        html: `
          <p>Hello,</p>
          <p>The following files were uploaded for patient <strong>${updatedPatient.patientName}</strong> (Case ID: ${updatedPatient.caseId}) by <strong>${planner?.name}</strong>:</p>
          <ul>${fileListHtml}</ul>
          <p>Please log in to the portal to review them.</p>
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
