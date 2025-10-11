import { NextResponse } from "next/server";
import { handleError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import User from "../../../models/User";
import { verifyAuth } from "../../../middleware/authMiddleware";

export async function PATCH(req) {
  try {
    await connectDB();

    // Verify authentication and admin role
    const authResult = await verifyAuth(req, ["admin"]);

    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full admin user from database to check permissions
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
        { error: "You don't have permission to suspend/unsuspend accounts" },
        { status: 403 },
      );
    }

    // Get doctorId and action from query params
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const action = searchParams.get("action");

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 },
      );
    }

    if (!action || !["suspend", "unsuspend"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action (suspend/unsuspend) is required" },
        { status: 400 },
      );
    }

    // Find the doctor
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Verify the user is actually a doctor (admins cannot be suspended)
    if (doctor.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctor accounts can be suspended" },
        { status: 400 },
      );
    }

    // Update suspension status using findByIdAndUpdate to avoid validation issues
    const isSuspended = action === "suspend";

    await User.findByIdAndUpdate(
      doctorId,
      { $set: { isSuspended } },
      { new: true, runValidators: false },
    );

    return NextResponse.json({
      success: true,
      message: `Doctor account ${isSuspended ? "suspended" : "reactivated"} successfully`,
      doctorId,
      doctorName: doctor.name,
      isSuspended,
    });
  } catch (error) {
    console.error("Error updating account suspension:", error);
    return handleError(error);
  }
}
