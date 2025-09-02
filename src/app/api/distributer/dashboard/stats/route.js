import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import User from "@/app/api/models/User";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

export async function GET(req) {
  await dbConnect();

  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user || !authResult.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const distributerId = authResult.user.id;

  try {
    // First, get all doctors associated with this distributer
    const doctors = await User.find({
      role: "doctor",
      distributerId: distributerId,
    }).select("_id name email");

    const doctorIds = doctors.map((doctor) => doctor._id);

    if (doctorIds.length === 0) {
      // No doctors associated with this distributer
      return NextResponse.json({
        success: true,
        data: {
          totalPatients: 0,
          approvedCases: 0,
          approvalPending: 0,
          setupPending: 0,
          recentPatients: [],
          recentActivity: [],
        },
      });
    }

    // Get total patients for doctors associated with this distributer
    const totalPatients = await Patient.countDocuments({
      userId: { $in: doctorIds },
    });

    // Get patients with approved status
    const approvedCases = await Patient.countDocuments({
      userId: { $in: doctorIds },
      caseStatus: "approved",
    });

    // Get patients with approval pending
    const approvalPending = await Patient.countDocuments({
      userId: { $in: doctorIds },
      caseStatus: "approval pending",
    });

    // Get patients with setup pending
    const setupPending = await Patient.countDocuments({
      userId: { $in: doctorIds },
      caseStatus: "setup pending",
    });

    // Get recent patients for activity overview
    const recentPatients = await Patient.find({
      userId: { $in: doctorIds },
    })
      .populate("userId", "name email")
      .select("patientName caseStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // Create recent activity timeline
    const recentActivity = [
      {
        description: `New patient case added`,
        timestamp: new Date(),
      },
      {
        description: `Case status updated to approved`,
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        description: `Patient consultation scheduled`,
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        totalPatients,
        approvedCases,
        approvalPending,
        setupPending,
        recentPatients,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching distributer dashboard stats:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server Error" },
      { status: 500 },
    );
  }
}
