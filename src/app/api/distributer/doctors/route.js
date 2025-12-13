import { NextResponse } from "next/server";
import connectDB from "../../config/db";
import { verifyAuth } from "../../middleware/authMiddleware";
import User from "../../models/User";
import { handleError } from "../../utils/errorHandler";

export async function GET(req) {
  try {
    await connectDB();

    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const distributerId = authResult.user.id;

    // Get all doctors associated with this distributer
    const doctors = await User.find({
      role: "doctor",
      distributerId: distributerId,
    }).select("name city address");

    return NextResponse.json({
      success: true,
      doctors: doctors.map((doctor) => ({
        _id: doctor._id,
        name: doctor.name || "-",
        city: doctor.city || "-",
        address: doctor.address || "-",
      })),
    });
  } catch (error) {
    console.error("Error fetching distributer doctors:", error);
    return handleError(error);
  }
}
