import { NextResponse } from "next/server";
import { handleError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import Patient from "../../../models/Patient";
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

    // Get caseId from query params
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 },
      );
    }

    // Find patient by caseId and verify it belongs to this doctor
    const patient = await Patient.findOne({
      caseId,
      userId,
    }).select("_id patientName caseId");

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found or you don't have access to this patient" },
        { status: 404 },
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
