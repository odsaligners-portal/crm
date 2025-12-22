import { admin } from "@/app/api/middleware/authMiddleware";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import DeadlineTime from "@/app/api/models/DeadlineTime";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const authResult = await admin(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { patientId, plannerId } = body || {};

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }

    if (!plannerId || !mongoose.Types.ObjectId.isValid(plannerId)) {
      return NextResponse.json(
        { error: "Invalid planner ID" },
        { status: 400 },
      );
    }

    await dbConnect();

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Compute planner deadline if deadline settings exist
    const deadlineTime = await DeadlineTime.findOne();
    const now = new Date();
    let deadlineDate = null;

    if (deadlineTime) {
      deadlineDate = new Date(now);
      deadlineDate.setDate(deadlineDate.getDate() + (deadlineTime.days || 0));
      deadlineDate.setHours(
        deadlineDate.getHours() + (deadlineTime.hours || 0),
      );
      deadlineDate.setMinutes(
        deadlineDate.getMinutes() + (deadlineTime.minutes || 0),
      );
    }

    const fieldsToUpdate = {
      plannerId,
      plannerAssignedAt: now,
      plannerDeadline: deadlineDate,
      "fileUploadCount.remianing": 1,
      // reset STL subtree and allow planner to upload fresh
      stlFile: {
        canUpload: true,
        uploaded: false,
        uploadedBy: null,
        uploadedAt: null,
        file: {
          url: "",
          fileKey: "",
          uploadedAt: null,
        },
        comment: "",
      },
    };

    const updated = await Patient.findByIdAndUpdate(
      patientId,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true },
    );

    return NextResponse.json({ success: true, patient: updated });
  } catch (error) {
    console.error("Error in STL reassign:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
