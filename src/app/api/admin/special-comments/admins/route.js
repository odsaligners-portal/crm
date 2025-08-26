import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import User from "@/app/api/models/User";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

// GET - Fetch all admin users for dropdown
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

    // Fetch all admin users (excluding super-admin)
    const adminUsers = await User.find({
      role: "admin",
      isActive: { $ne: false }, // Only active users
    })
      .select("_id name email")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      admins: adminUsers,
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};
