import dbConnect from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import Notification from "@/app/api/models/Notification";
import Patient from "@/app/api/models/Patient";
import PatientComment from "@/app/api/models/PatientComment";
import User from "@/app/api/models/User";
import { sendEmail } from "@/app/api/utils/mailer";
import { NextResponse } from "next/server";
import Distributer from "@/app/api/models/Distributer";

export const GET = async (req) => {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: authResult.error }, { status: 401 });
    }
    const { user } = authResult;

    const commentId = req.nextUrl.searchParams.get("commentId");
    const patientCommentId = req.nextUrl.searchParams.get("patientCommentId");

    if (commentId && patientCommentId) {
      // Find the PatientComment document by patientCommentId
      const doc = await PatientComment.findById(patientCommentId).lean();
      if (!doc) {
        return NextResponse.json(
          { message: "PatientComment not found" },
          { status: 404 },
        );
      }
      // Find the specific comment
      const comment = doc.comments.find((c) => c._id.toString() === commentId);
      if (!comment) {
        return NextResponse.json(
          { message: "Comment not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        comment: { ...comment, patientName: doc.patientName },
      });
    }

    const patientId = req.nextUrl.searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { message: "Patient ID is required" },
        { status: 400 },
      );
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found" },
        { status: 404 },
      );
    }

    const caseId = patient.caseId;

    // Check if patient has userId and handle the authorization properly
    if (user.role !== "admin") {
      // For non-admin users, check if they own the patient
      if (!patient.userId) {
        return NextResponse.json(
          { message: "Patient record is invalid" },
          { status: 400 },
        );
      }

      // Convert both IDs to strings for comparison
      const patientUserId = patient.userId.toHexString();

      const currentUserId = user.id;

      if (patientUserId !== currentUserId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }
    }

    const patientComment = await PatientComment.findOne({ patientId });

    if (!patientComment) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(
      {
        comments: patientComment.comments,
        caseId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};

// POST - Add a new comment to a patient
export async function POST(request) {
  try {
    await dbConnect();

    const authResult = await verifyAuth(request);
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

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const { comment, modification } = await request.json();

    if (!patientId || !comment) {
      return NextResponse.json(
        { success: false, message: "Patient ID and comment are required" },
        { status: 400 },
      );
    }

    const patient = await Patient.findById(patientId)
      .populate("userId")
      .populate("plannerId");
    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 },
      );
    }

    const doctor = await User.findById(patient.userId).populate(
      "distributerId",
    );

    let commenter;

    if (doctor.distributerId._id.toString() === user.id) {
      commenter = await Distributer.findById(user.id);
    } else {
      commenter = await User.findById(user.id);
    }

    if (!commenter) {
      return NextResponse.json(
        { success: false, message: "Commentor not found" },
        { status: 404 },
      );
    }

    if (user.role !== "admin" && user.role !== "distributer") {
      // Check if patient has userId for email notifications
      if (!patient.userId) {
        console.warn(`Patient ${patientId} has no userId field`);
      }
      // Convert both IDs to strings for comparison
      const patientUserId = patient.userId._id.toHexString();

      const currentUserId = commenter._id.toHexString();

      if (patientUserId !== currentUserId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }
    }

    // Reverting to the original database logic
    let patientComment = await PatientComment.findOne({ patientId });

    if (!patientComment) {
      patientComment = new PatientComment({
        patientId,
        patientName: patient.patientName,
        comments: [],
      });
    }
    const commentedByName = commenter.name;
    const commentedByType =
      commenter.role === "distributer" ? "Distributer" : "User";

    const newComment = {
      comment,
      commentedBy: {
        user: commenter._id,
        userType: commentedByType,
        name: commentedByName,
      },
    };

    patientComment.comments.push(newComment);
    await patientComment.save();
    const savedComment =
      patientComment.comments[patientComment.comments.length - 1];

    if (modification) {
      patient.fileUploadCount.remianing = 1;
      patient.modification.commentSubmitted = true;

      await patient.save();
    }
    console.log(patient);
    // --- Email Notification Logic ---
    try {
      // Fetch admins only once
      const admins = await User.find({ role: "admin" });
      const adminEmails = admins.map((admin) => admin.email).filter(Boolean);

      // Prepare recipient list
      let recipients = [];
      let subjectPrefix = "";
      let greeting = "";
      let includeModificationNote = modification;

      recipients.push(patient?.plannerId?.email);

      // Set up based on commenter role
      if (commenter.role === "admin") {
        // Notify doctor and distributer
        if (patient?.userId?.email) recipients.push(patient?.userId.email);
        if (doctor?.distributerId?.email)
          recipients.push(doctor?.distributerId?.email);

        subjectPrefix = "An Admin has added a new comment";
        greeting = "Hello,";
      } else if (commenter.role === "doctor") {
        // Notify admins and distributer
        recipients = [...adminEmails];
        if (doctor?.distributerId?.email)
          recipients.push(doctor?.distributerId?.email);

        subjectPrefix = `Doctor has added a new ${includeModificationNote ? "modification" : "comment"}`;
        greeting = "Hello Admin/Distributer,";
      } else if (commenter.role === "distributer") {
        // Notify admins and doctor
        recipients = [...adminEmails];
        if (patient.userId?.email) recipients.push(patient.userId.email);

        subjectPrefix = `Distributer has added a new ${includeModificationNote ? "modification" : "comment"}`;
        greeting = "Hello Admin/Doctor,";
      }

      // Avoid sending to invalid addresses
      recipients = recipients.filter(Boolean);

      // Add modification note if needed
      const modificationNote = includeModificationNote
        ? `<p><strong>Note:</strong>Please find below the modifications details. </p>`
        : "";

      // Send email if there are valid recipients
      if (recipients.length > 0) {
        await sendEmail({
          to: recipients,
          subject: `${subjectPrefix} on Patient: ${patient.patientName}`,
          html: `
      <p>${greeting}</p>
      <p>A new comment has been added by ${commenter.role} to patient <strong>${patient.patientName}</strong> (Case ID: ${patient.caseId}).</p>
      ${modificationNote}
      <p><strong>Comment:</strong></p>
      <blockquote>${comment}</blockquote>
      <p>Please log in to the portal to review.</p>
    `,
        });
      }
    } catch (emailError) {
      // Log the error but don't fail the request
      console.error("Failed to send notification email:", emailError);
    }
    // --- End of Email Notification Logic ---

    // --- Notification Logic ---
    const notificationUsers = [];
    const commenterRole = commenter.role;

    if (patient?.plannerId?._id) {
      notificationUsers.push({
        user: patient?.plannerId?._id,
        role: "planner",
        read: false,
      });
    }

    // Fetch all admins
    const admins = await User.find({ role: "admin" });

    // Helper to add user only if they exist and not the commenter
    const addUserIfValid = (userObj, role) => {
      if (
        userObj &&
        userObj._id &&
        userObj._id.toString() !== commenter._id.toString()
      ) {
        notificationUsers.push({
          user: userObj._id,
          role,
          read: false,
        });
      }
    };

    if (commenterRole === "admin") {
      // Notify doctor
      addUserIfValid(patient?.userId, "doctor");

      // Notify distributor
      addUserIfValid(doctor?.distributerId, "distributor");
    } else if (commenterRole === "doctor") {
      // Notify all admins
      admins.forEach((admin) => {
        if (admin._id.toString() !== commenter._id.toString()) {
          notificationUsers.push({
            user: admin._id,
            role: "admin",
            read: false,
          });
        }
      });

      // Notify distributor
      addUserIfValid(doctor?.distributerId, "distributor");
    } else if (commenterRole === "distributor") {
      // Notify all admins
      admins.forEach((admin) => {
        if (admin._id.toString() !== commenter._id.toString()) {
          notificationUsers.push({
            user: admin._id,
            role: "admin",
            read: false,
          });
        }
      });

      // Notify doctor
      addUserIfValid(patient?.userId, "doctor");
    }

    // Create notification
    await Notification.create({
      title: modification
        ? `Modification comment added on patient ${patient.patientName} (Case ID: ${patient.caseId})`
        : `New comment added on patient ${patient.patientName} (Case ID: ${patient.caseId})`,
      type: "Comment Notification",
      commentedBy: {
        id: commenter._id,
        name: commentedByName,
        model: commenterRole === "distributer" ? "Distributer" : "User",
      },
      recipients: notificationUsers,
    });
    // --- End Notification Logic ---

    return NextResponse.json(savedComment, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add comment" },
      { status: 500 },
    );
  }
}
