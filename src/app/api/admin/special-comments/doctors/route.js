import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import User from "@/app/api/models/User";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

// GET - Fetch all doctors for dropdown
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
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit")) || 50;

    // Build search query
    let query = { role: "doctor" };
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Fetch doctors with search and limit
    const doctors = await User.find(query)
      .select("_id name email")
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      doctors: doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};
