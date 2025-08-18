import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
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
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    let patient;
    // Find patient and check if it belongs to the logged-in user
    if (authResult.user.role === "planner") {
      patient = await Patient.findOne({
        _id: id,
        plannerId: authResult.user.id, // Use id from decoded token
      }).lean();
    } else if (authResult.user.role === "doctor") {
      patient = await Patient.findOne({
        _id: id,
        userId: authResult.user.id, // Use id from decoded token
      }).lean();
    }

    if (!patient) {
      return NextResponse.json(
        {
          error: "You do not have permission to view Patient Record",
        },
        { status: 404 },
      );
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
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();

    // If only caseStatus is being updated, allow admin or doctor
    if (
      Object.keys(body).length === 1 &&
      Object.prototype.hasOwnProperty.call(body, "caseStatus") &&
      typeof body.caseStatus === "string"
    ) {
      // Allow admin or doctor
      if (["admin", "doctor"].includes(authResult.user.role)) {
        const updatedPatient = await Patient.findByIdAndUpdate(
          id,
          { $set: { caseStatus: body.caseStatus } },
          { new: true, runValidators: true },
        );
        if (!updatedPatient) {
          return NextResponse.json(
            { error: "Patient not found" },
            { status: 404 },
          );
        }
        return NextResponse.json(updatedPatient);
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // If modification comment is being submitted
    if (
      Object.prototype.hasOwnProperty.call(body, "modification") &&
      typeof body.modification === "object"
    ) {
      if (["admin", "doctor", "distributer"].includes(authResult.user.role)) {
        const updatedPatient = await Patient.findByIdAndUpdate(
          id,
          {
            $set: {
              "modification.commentSubmitted":
                body.modification.commentSubmitted,
              caseStatus: body.caseStatus || "setup pending",
            },
          },
          { new: true, runValidators: true },
        );
        if (!updatedPatient) {
          return NextResponse.json(
            { error: "Patient not found" },
            { status: 404 },
          );
        }
        return NextResponse.json(updatedPatient);
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Otherwise, update only if user owns the patient
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
        // Step-4 field
        scanFiles: body.scanFiles,
        // Dental Examination fields
        dentalExamination: body.dentalExamination,
        dentalExaminationFiles: body.dentalExaminationFiles,
      }).filter(([v]) => v !== undefined),
    );

    const updatedPatient = await Patient.findOneAndUpdate(
      {
        _id: id,
        userId: authResult.user.id,
      },
      { $set: fieldsToUpdate },
      { new: true, runValidators: true },
    );

    if (!updatedPatient) {
      return NextResponse.json(
        {
          error:
            "Patient not found or you do not have permission to modify this record",
        },
        { status: 404 },
      );
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
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Delete patient only if it belongs to the logged-in user
    const patient = await Patient.findOneAndDelete({
      _id: id,
      userId: authResult.user.id, // Use id from decoded token
    });

    if (!patient) {
      return NextResponse.json(
        {
          error:
            "Patient not found or you do not have permission to delete this record",
        },
        { status: 404 },
      );
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
