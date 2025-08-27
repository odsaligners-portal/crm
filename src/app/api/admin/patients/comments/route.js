import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import PatientComment from "@/app/api/models/PatientComment";
import { admin } from "@/app/api/middleware/authMiddleware";

export async function GET(req) {
  try {
    await dbConnect();

    // Verify admin authentication
    const authResult = await admin(req);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { success: false, message: "Missing patientId" },
        { status: 400 },
      );
    }

    // Fetch patient to verify it exists (admin can access any patient)
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 },
      );
    }

    // Fetch comments for the patient
    const patientComment = await PatientComment.findOne({ patientId });
    if (!patientComment) {
      return NextResponse.json(
        { success: true, comments: [] },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        comments: patientComment.comments,
        caseId: patient.caseId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching patient comments:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
