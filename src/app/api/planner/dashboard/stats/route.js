import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

export async function GET(req) {
  await dbConnect();

  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user || !authResult.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const plannerId = authResult.user.id;

  try {
    // Get total patients for this planner
    const totalPatients = await Patient.countDocuments({ plannerId });

    // Get patients with approved status
    const approvedCases = await Patient.countDocuments({
      plannerId,
      caseStatus: "approved",
    });

    // Get patients with approval pending
    const approvalPending = await Patient.countDocuments({
      plannerId,
      caseStatus: "approval pending",
    });

    // Get patients with setup pending
    const setupPending = await Patient.countDocuments({
      plannerId,
      caseStatus: "setup pending",
    });

    // Get recent patients for activity overview
    const recentPatients = await Patient.find({ plannerId })
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
    console.error("Error fetching planner dashboard stats:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server Error" },
      { status: 500 },
    );
  }
}
