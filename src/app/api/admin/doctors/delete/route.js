import { NextResponse } from "next/server";
import { handleError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import User from "../../../models/User";
import Patient from "../../../models/Patient";
import { verifyAuth } from "../../../middleware/authMiddleware";
import mongoose from "mongoose";

export async function DELETE(req) {
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
        { error: "You don't have permission to delete doctors" },
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

    // Find the doctor
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Verify the user is actually a doctor
    if (doctor.role !== "doctor") {
      return NextResponse.json(
        { error: "The specified user is not a doctor" },
        { status: 400 },
      );
    }

    // Prevent deleting super admin
    const superAdminId = process.env.SUPER_ADMIN_ID;
    if (doctorId === superAdminId) {
      return NextResponse.json(
        { error: "Cannot delete super admin" },
        { status: 403 },
      );
    }

    // Find all patients associated with this doctor
    // Convert doctorId to ObjectId for proper MongoDB comparison
    const doctorObjectId = new mongoose.Types.ObjectId(doctorId);
    const patients = await Patient.find({ userId: doctorObjectId });
    const deletedPatientsCount = patients.length;

    // Delete all associated patients
    await Patient.deleteMany({ userId: doctorObjectId });

    // Delete the doctor
    await User.findByIdAndDelete(doctorId);

    return NextResponse.json({
      success: true,
      message: `Doctor and ${deletedPatientsCount} associated patient(s) deleted successfully`,
      deletedDoctorId: doctorId,
      deletedDoctorName: doctor.name,
      deletedPatientsCount,
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return handleError(error);
  }
}
