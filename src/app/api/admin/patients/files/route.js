import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import PatientFile from "@/app/api/models/PatientFile";
import Patient from "@/app/api/models/Patient";
import { admin } from "@/app/api/middleware/authMiddleware";
import { storage } from "@/utils/firebase";
import { ref, deleteObject } from "firebase/storage";

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

export async function DELETE(req) {
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

    // Check if user is superadmin (compare as strings; support both env vars)
    const superadminId =
      process.env.SUPER_ADMIN_ID ||
      process.env.NEXT_PUBLIC_SUPER_ADMIN_ID ||
      "";
    const userId = authResult.user?.id ?? authResult.user?._id ?? "";
    if (
      !superadminId ||
      String(userId).trim() !== String(superadminId).trim()
    ) {
      return NextResponse.json(
        { success: false, message: "Only superadmin can delete setup updates" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: "Missing fileId" },
        { status: 400 },
      );
    }

    // Find the file
    const file = await PatientFile.findById(fileId);
    if (!file) {
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 },
      );
    }

    // Delete file from Firebase Storage if fileKey exists
    if (file.fileKey) {
      try {
        const fileRef = ref(storage, file.fileKey);
        await deleteObject(fileRef);
      } catch (storageError) {
        console.error("Error deleting file from storage:", storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete file record from database
    await PatientFile.findByIdAndDelete(fileId);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting patient file:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
