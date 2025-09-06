import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import Distributer from "@/app/api/models/Distributer";
import User from "@/app/api/models/User";
import { sendEmail } from "@/app/api/utils/mailer";

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

    const patient = await Patient.findById(id)
      .populate("userId")
      .populate("plannerId");

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const role = authResult.user.role;

    if (
      role === "doctor" &&
      patient.userId._id.toString() !== authResult.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const distributer = await Distributer.findById(
      patient.userId.distributerId,
    );

    if (
      role === "distributor" &&
      distributer._id.toString() !== authResult.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (role === "admin") {
      const admin = await User.findById(authResult.user.id);
      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }
    }

    await dbConnect();

    const body = await req.json();
    const { caseStatus } = body;

    // Prepare update object
    const updateData = { caseStatus };

    // If case is being approved, set canUpload to true for STL file
    if (caseStatus === "approved") {
      updateData["stlFile.canUpload"] = true;
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const doctorEmail = patient?.userId?.email;
    const distributerEmail = distributer?.email;

    // ---------------- Email Notification Logic ----------------

    let recipients = [];
    if (patient?.palnnerId?.email) {
      recipients.push(patient?.palnnerId?.email);
    }

    if (role === "admin") {
      // Notify doctor and distributor
      if (doctorEmail) recipients.push(doctorEmail);
      if (distributerEmail) recipients.push(distributerEmail);
    }

    if (role === "doctor") {
      // Notify admin and distributor
      const admins = await User.find({ role: "admin" }, "email").lean();
      admins.forEach((admin) => {
        if (admin.email) recipients.push(admin.email);
      });
      if (distributerEmail) recipients.push(distributerEmail);
    }

    if (role === "distributer") {
      // Notify admin and doctor
      const admins = await User.find({ role: "admin" }, "email").lean();
      admins.forEach((admin) => {
        if (admin.email) recipients.push(admin.email);
      });
      if (doctorEmail) recipients.push(doctorEmail);
    }

    // Send Email (deduplicate and only if valid emails exist)
    const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

    if (uniqueRecipients.length > 0) {
      await sendEmail({
        to: uniqueRecipients,
        subject: `Case Status Updated for Patient ${updatedPatient.patientName}`,
        html: `
          <p>Case status for <strong>${updatedPatient.patientName}</strong> (Case ID: ${updatedPatient.caseId}) has been updated to <strong>${caseStatus}.</strong>.</p>
        `,
      });
    }

    return NextResponse.json({ success: true, updatedPatient });
  } catch (error) {
    console.error("Error updating caseStatus:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
