import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import SpecialComment from "@/app/api/models/SpecialComment";
import User from "@/app/api/models/User";
import Patient from "@/app/api/models/Patient";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

// GET - Fetch all special comments
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
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const skip = (page - 1) * limit;

    // Fetch special comments with pagination
    const comments = await SpecialComment.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email")
      .populate("patientId", "caseId patientName")
      .populate("doctorId", "name email")
      .lean();

    // Get total count for pagination
    const total = await SpecialComment.countDocuments({ isActive: true });

    // Check if current user has read each comment
    const userId = authResult.user.id;
    const commentsWithReadStatus = comments.map((comment) => ({
      ...comment,
      isRead: comment.readBy.some(
        (reader) =>
          reader.adminId.toString() === userId && reader.readAt !== null,
      ),
      readCount: comment.readBy.length,
    }));

    return NextResponse.json({
      comments: commentsWithReadStatus,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching special comments:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};

// POST - Create new special comment
export const POST = async (req) => {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);

    const userData = await User.findById(authResult.user.id);

    // Ensure the user is an admin or super-admin
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // For POST (create), check if user has special comment access
    if (userData.role === "admin" && userData.specialCommentAccess) {
      // Admin with special comment access can create
    } else {
      return NextResponse.json(
        {
          message:
            "Forbidden: You don't have permission to create special comments",
        },
        { status: 403 },
      );
    }

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

    // Get all admin users (excluding super-admin) for readBy tracking
    const adminUsers = await User.find({
      role: "admin",
    })
      .select("_id name")
      .lean();

    // Create the special comment
    const newComment = new SpecialComment({
      title,
      comment,
      createdBy: userData.id,
      createdByName: userData.name,
      patientId: patientId,
      patientName: patientName,
      doctorId: doctorId,
      doctorName: doctorName,
      readBy: adminUsers.map((admin) => ({
        adminId: admin._id,
        adminName: admin.name,
        readAt: null, // Will be set when they actually read it
      })),
    });

    await newComment.save();

    // Populate the created comment for response
    const populatedComment = await SpecialComment.findById(newComment._id)
      .populate("createdBy", "name email")
      .populate("patientId", "caseId patientName")
      .populate("doctorId", "name email")
      .lean();

    return NextResponse.json(
      {
        message: "Special comment created successfully",
        comment: populatedComment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating special comment:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};

// PUT - Mark comment as read by current admin
export const PUT = async (req) => {
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

    const body = await req.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json(
        {
          message: "Comment ID is required",
        },
        { status: 400 },
      );
    }

    // Find the comment and update readBy array
    const result = await SpecialComment.findOneAndUpdate(
      {
        _id: commentId,
        "readBy.adminId": authResult.user.id,
      },
      {
        $set: {
          "readBy.$.readAt": new Date(),
        },
      },
      { new: true },
    );

    if (!result) {
      return NextResponse.json(
        {
          message: "Comment not found or already marked as read",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Comment marked as read successfully",
    });
  } catch (error) {
    console.error("Error marking comment as read:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};
