import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import PatientFile from "@/app/api/models/PatientFile";
import Patient from "@/app/api/models/Patient";
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

    // Fetch all files for the patient
    const files = await PatientFile.find({ patientId }).sort({
      uploadedAt: -1,
    });

    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error("Error fetching patient files:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
