import dbConnect from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import Patient from "@/app/api/models/Patient";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const decodedUser = authResult.user;

    // Fetch full user from database to check permissions
    const User = (await import("@/app/api/models/User")).default;
    const user = await User.findById(decodedUser.id).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // Check if user has plannerAccess
    if (user.role !== "admin" || !user.plannerAccess) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to access planner reports.",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search") || "";

    // Query: Only patients with planner assigned
    const query = {
      plannerId: { $ne: null, $exists: true },
    };

    // Search functionality
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: "i" } },
        { caseId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Fetch patients with planner data
    const patients = await Patient.find(query)
      .populate("plannerId", "name email")
      .populate("userId", "name email")
      .select(
        "caseId patientName plannerId plannerAssignedAt plannerDeadline stlFile createdAt city country caseStatus",
      )
      .sort({ plannerAssignedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Patient.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      patients,
      pagination: {
        currentPage: page,
        totalPages,
        totalPatients: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching planner report:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch planner report" },
      { status: 500 },
    );
  }
}
