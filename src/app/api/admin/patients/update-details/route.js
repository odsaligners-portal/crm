import { admin } from "@/app/api/middleware/authMiddleware";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import DeadlineTime from "@/app/api/models/DeadlineTime";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }
    // Verify admin authentication
    const authResult = await admin(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find patient (no userId restriction for admin)
    const patient = await Patient.findOne({ _id: id })
      .populate("userId", "name email")
      .populate("plannerId", "name email")
      .lean();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error in GET patient:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }
    const authResult = await admin(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();

    // Get current patient to check if planner is being changed
    const currentPatient = await Patient.findById(id);
    if (!currentPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const fieldsToUpdate = Object.fromEntries(
      Object.entries({
        // Step-1 fields
        patientName: body.patientName,
        age: body.age,
        gender: body.gender,
        pastMedicalHistory: body.pastMedicalHistory,
        pastDentalHistory: body.pastDentalHistory,
        treatmentFor: body.treatmentFor,
        country: body.country,
        state: body.state,
        city: body.city,
        primaryAddress: body.primaryAddress,
        shippingAddress: body.shippingAddress,
        shippingAddressType: body.shippingAddressType,
        billingAddress: body.billingAddress,
        privacyAccepted: body.privacyAccepted,
        declarationAccepted: body.declarationAccepted,
        // Step-2/3 fields
        chiefComplaint: body.chiefComplaint,
        caseType: body.caseType,
        singleArchType: body.singleArchType,
        caseCategory: body.caseCategory,
        selectedPrice: body.selectedPrice,
        extraction: body.extraction,
        interproximalReduction: body.interproximalReduction,
        measureOfIPR: body.measureOfIPR,
        caseCategoryDetails: body.caseCategoryDetails,
        treatmentPlan: body.treatmentPlan,
        midline: body.midline,
        midlineComments: body.midlineComments,
        archExpansion: body.archExpansion,
        archExpansionComments: body.archExpansionComments,
        additionalComments: body.additionalComments,
        plannerId: body.plannerId,
        // Step-4 field
        scanFiles: body.scanFiles,
        // Dental Examination fields
        dentalExamination: body.dentalExamination,
        dentalExaminationFiles: body.dentalExaminationFiles,
        // Clinic Images fields
        middleClinicImages: body.middleClinicImages,
        postClinicImages: body.postClinicImages,
        userId: body.userId,
      }).filter(([v]) => v !== undefined),
    );

    // If plannerId is being assigned or changed, calculate and set deadline
    if (
      body.plannerId !== undefined &&
      body.plannerId !== null &&
      String(currentPatient.plannerId) !== String(body.plannerId)
    ) {
      // Fetch deadline time from database
      const deadlineTime = await DeadlineTime.findOne();

      if (deadlineTime) {
        // Calculate deadline: current time + deadline duration
        const now = new Date();
        const deadlineDate = new Date(now);

        // Add days, hours, and minutes
        deadlineDate.setDate(deadlineDate.getDate() + (deadlineTime.days || 0));
        deadlineDate.setHours(
          deadlineDate.getHours() + (deadlineTime.hours || 0),
        );
        deadlineDate.setMinutes(
          deadlineDate.getMinutes() + (deadlineTime.minutes || 0),
        );

        // Add deadline fields
        fieldsToUpdate.plannerAssignedAt = now;
        fieldsToUpdate.plannerDeadline = deadlineDate;
      } else {
        // If no deadline time is set, still record the assignment time
        fieldsToUpdate.plannerAssignedAt = new Date();
        fieldsToUpdate.plannerDeadline = null;
      }
    }

    const updatedPatient = await Patient.findOneAndUpdate(
      {
        _id: id,
      },
      { $set: fieldsToUpdate },
      { new: true, runValidators: true },
    );

    if (!updatedPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error("Error in PUT patient:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }
    // Verify admin authentication
    const authResult = await admin(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!authResult.user.userDeleteAccess) {
      return NextResponse.json(
        { error: "You do not have permission to delete patients." },
        { status: 403 },
      );
    }

    await dbConnect();

    // Delete patient
    const patient = await Patient.findOneAndDelete({ _id: id });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE patient:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
