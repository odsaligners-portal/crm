import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import User from "@/app/api/models/User";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import AccountsTeam from "@/app/api/models/AccountsTeam";
import { sendEmail } from "@/app/api/utils/mailer";

export async function PUT(req) {
  await dbConnect();
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userFromDb = await User.findById(
    authResult.user.id || authResult.user._id,
  );
  if (
    !userFromDb ||
    !(userFromDb.role === "admin" && userFromDb.priceUpdateAccess)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
  }

  const body = await req.json();
  const { totalAmount, receivedAmount } = body;

  // Fetch patient to get current amounts
  const patient = await Patient.findById(id).populate("userId");
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const currentTotal = patient.amount?.total ?? 0;

  // Prepare updated amount fields
  let updatedTotal = currentTotal;
  let updatedReceived = patient.amount?.received ?? 0;

  if (totalAmount !== undefined) {
    updatedTotal = totalAmount;
    updatedReceived = 0; // Reset received if new total comes in
  }

  if (receivedAmount !== undefined) {
    updatedReceived = receivedAmount;
  }

  const updatedPending = updatedTotal - updatedReceived;

  const update = {
    amount: {
      total: updatedTotal,
      received: updatedReceived,
      pending: updatedPending,
    },
  };

  // Update patient
  const updatedPatient = await Patient.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true },
  ).populate("userId");

  try {
    const accounts = await AccountsTeam.find({}, "email");
    const emails = accounts.map((a) => a.email).filter(Boolean);
    if (emails.length > 0) {
      const doctorName = updatedPatient.userId?.name || "Unknown";
      const subject = `Price Updated for Patient ${updatedPatient.patientName} (Case ID: ${updatedPatient.caseId})`;
      const html = `
        <p>The price for patient <strong>${updatedPatient.patientName}</strong> (case ID: <strong>${updatedPatient.caseId}</strong>) of doctor <strong>${doctorName}</strong> has been updated.</p>
        <ul>
          <li>Total Amount: <strong>${updatedPatient.amount.total ?? "N/A"}</strong></li>
          <li>Received Amount: <strong>${updatedPatient.amount.received ?? "N/A"}</strong></li>
        </ul>
        <p><strong>Please update at your end.</strong></p>
      `;
      await sendEmail({ to: emails, subject, html });
    }
  } catch (err) {
    console.error("Failed to send accounts team email:", err);
  }

  return NextResponse.json({ patient: updatedPatient });
}
