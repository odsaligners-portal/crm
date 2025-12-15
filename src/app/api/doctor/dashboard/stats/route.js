import connectDB from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import Patient from "@/app/api/models/Patient";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectDB();

  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const doctorId = authResult.user.id;

  try {
    const myPatients = await Patient.countDocuments({ userId: doctorId });

    // Assuming 'pending' status exists. If not, this will be 0.
    const pendingCases = await Patient.countDocuments({
      userId: doctorId,
      progressStatus: "in-progress",
    });

    // Get cases with end dates for countdown timer
    const casesWithEndDates = await Patient.find({
      userId: doctorId,
      caseEndDate: { $ne: null, $gt: new Date() },
    })
      .select("_id patientName caseId caseStartDate caseEndDate")
      .sort({ caseEndDate: 1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        myPatients,
        pendingCases,
        casesWithEndDates,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Server Error" },
      { status: 500 },
    );
  }
}
