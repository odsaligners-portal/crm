import { NextResponse } from "next/server";
import { handleError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import Patient from "../../../models/Patient";
import User from "../../../models/User";
import { verifyAuth } from "../../../middleware/authMiddleware";

export async function GET(req) {
  try {
    await connectDB();

    // Verify authentication
    const authResult = await verifyAuth(req);

    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authResult.user.id;

    // Get the distributor's details
    const distributor = await User.findById(userId);

    if (!distributor || distributor.role !== "distributer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get caseId from query params
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 },
      );
    }

    // Find patient by caseId
    // Distributor can only see patients from doctors associated with them
    const patient = await Patient.findOne({ caseId })
      .select("_id patientName caseId userId")
      .populate({
        path: "userId",
        select: "distributerId",
      });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if the patient's doctor is associated with this distributor
    if (patient.userId?.distributerId?.toString() !== userId) {
      return NextResponse.json(
        { error: "You don't have access to this patient" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      patientId: patient._id,
      patientName: patient.patientName,
      caseId: patient.caseId,
    });
  } catch (error) {
    console.error("Error finding patient by case ID:", error);
    return handleError(error);
  }
}
