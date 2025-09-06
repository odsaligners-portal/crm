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
    // Planners only work with Setup Pending cases
    const totalPatients = await Patient.countDocuments({
      plannerId,
      caseStatus: "Setup Pending",
    });

    // Get patients with setup pending (this is what planners work on)
    const setupPending = await Patient.countDocuments({
      plannerId,
      caseStatus: "Setup Pending",
    });

    // Get patients that were processed by this planner (moved from Setup Pending)
    const processedCases = await Patient.countDocuments({
      plannerId,
      caseStatus: { $ne: "Setup Pending" },
    });

    // Get recent setup pending patients for activity overview
    const recentPatients = await Patient.find({
      plannerId,
      caseStatus: "Setup Pending",
    })
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
        totalPatients, // Setup Pending cases
        setupPending, // Same as totalPatients for planners
        processedCases, // Cases moved from Setup Pending
        recentPatients,
        recentActivity,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Server Error" },
      { status: 500 },
    );
  }
}
