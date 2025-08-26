import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import SpecialComment from "@/app/api/models/SpecialComment";
import User from "@/app/api/models/User";
import Patient from "@/app/api/models/Patient";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

// PUT - Update special comment
export const PUT = async (req) => {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);

    const userData = await User.findById(authResult.user.id);

    // Ensure the user is an admin or super-admin
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // For PUT (update), check if user has special comment access
    if (userData.role === "admin" && !userData.specialCommentAccess) {
      return NextResponse.json(
        {
          message:
            "Forbidden: You don't have permission to edit special comments",
        },
        { status: 403 },
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const body = await req.json();
    const { title, comment, patientId } = body;

    if (!title || !comment) {
      return NextResponse.json(
        {
          message: "Title and comment are required",
        },
        { status: 400 },
      );
    }

    // Find the comment to update
    const existingComment = await SpecialComment.findById(id);
    if (!existingComment) {
      return NextResponse.json(
        {
          message: "Special comment not found",
        },
        { status: 404 },
      );
    }

    // Validate patient if provided and get doctor info
    let patientName = null;
    let doctorId = null;
    let doctorName = null;

    if (patientId) {
      const patient = await Patient.findById(patientId)
        .select("patientName userId")
        .populate("userId", "name")
        .lean();
      if (!patient) {
        return NextResponse.json(
          {
            message: "Patient not found",
          },
          { status: 404 },
        );
      }
      patientName = patient.patientName;
      doctorId = patient.userId?._id;
      doctorName = patient.userId?.name;
    }

    // Update the special comment
    const updatedComment = await SpecialComment.findByIdAndUpdate(
      id,
      {
        title,
        comment,
        patientId: patientId || null,
        patientName: patientName || null,
        doctorId: doctorId || null,
        doctorName: doctorName || null,
        updatedAt: new Date(),
      },
      { new: true },
    )
      .populate("createdBy", "name email")
      .populate("patientId", "caseId patientName")
      .populate("doctorId", "name email")
      .lean();

    return NextResponse.json({
      message: "Special comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Error updating special comment:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};

// DELETE - Delete special comment
export const DELETE = async (req) => {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);

    const userData = await User.findById(authResult.user.id);

    // Ensure the user is an admin or super-admin
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // For DELETE, check if user has special comment access
    if (userData.role === "admin" && !userData.specialCommentAccess) {
      return NextResponse.json(
        {
          message:
            "Forbidden: You don't have permission to delete special comments",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Find the comment to delete
    const existingComment = await SpecialComment.findById(id);
    if (!existingComment) {
      return NextResponse.json(
        {
          message: "Special comment not found",
        },
        { status: 404 },
      );
    }

    // Soft delete by setting isActive to false
    await SpecialComment.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({
      message: "Special comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting special comment:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};
