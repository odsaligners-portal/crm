import { NextResponse } from "next/server";
import { handleError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import Patient from "../../../models/Patient";
import { verifyAuth } from "../../../middleware/authMiddleware";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectDB();

    // Verify authentication and admin role
    const authResult = await verifyAuth(req, ["admin"]);

    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full admin user from database to check permissions
    const User = (await import("../../../models/User")).default;
    const adminUser = await User.findById(authResult.user.id);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 },
      );
    }

    // Check if admin has changeDoctorPasswordAccess permission
    if (!adminUser.changeDoctorPasswordAccess) {
      return NextResponse.json(
        { error: "You don't have permission to access this data" },
        { status: 403 },
      );
    }

    // Get doctorId from query params
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 },
      );
    }

    // Count patients for this doctor
    // Convert doctorId to ObjectId for proper MongoDB comparison
    const count = await Patient.countDocuments({
      userId: new mongoose.Types.ObjectId(doctorId),
    });

    return NextResponse.json({
      success: true,
      doctorId,
      count,
    });
  } catch (error) {
    console.error("Error fetching patient count:", error);
    return handleError(error);
  }
}
