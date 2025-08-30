import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import SpecialComment from "@/app/api/models/SpecialComment";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

// GET - Fetch Production Comments for a specific patient
export const GET = async (req) => {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);

    // Ensure the user is an admin or super-admin
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!["admin", "super-admin"].includes(authResult.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { message: "Patient ID is required" },
        { status: 400 },
      );
    }

    // Fetch Production Comments for the specific patient
    const specialComments = await SpecialComment.find({
      patientId: patientId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .populate("patientId", "caseId patientName")
      .populate("doctorId", "name email")
      .lean();

    // Check if current user has read each comment
    const userId = authResult.user.id;
    const commentsWithReadStatus = specialComments.map((comment) => ({
      ...comment,
      isRead: comment.readBy.some(
        (reader) =>
          reader.adminId.toString() === userId && reader.readAt !== null,
      ),
      readCount: comment.readBy.length,
    }));

    return NextResponse.json({
      success: true,
      specialComments: commentsWithReadStatus,
      totalCount: commentsWithReadStatus.length,
    });
  } catch (error) {
    console.error("Error fetching patient Production Comments:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};
