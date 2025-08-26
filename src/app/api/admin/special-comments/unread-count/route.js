import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import SpecialComment from "@/app/api/models/SpecialComment";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

// GET - Get total unread count for current user
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

    const userId = authResult.user.id;

    // Count comments that are not read by current user
    const totalUnread = await SpecialComment.countDocuments({
      isActive: true,
      readBy: {
        $elemMatch: {
          adminId: userId,
          readAt: null,
        },
      },
    });


    return NextResponse.json({
      totalUnread,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};
