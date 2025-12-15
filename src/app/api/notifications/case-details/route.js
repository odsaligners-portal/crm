import { NextResponse } from "next/server";
import connectDB from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import Patient from "@/app/api/models/Patient";
import { sendEmail } from "@/app/api/utils/mailer";
import { getCaseDetailsEmailTemplate } from "@/app/api/utils/emailTemplates";

export async function POST(req) {
  try {
    await connectDB();

    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { patientId } = await req.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 },
      );
    }

    // Get patient with populated doctor info
    const patient = await Patient.findById(patientId)
      .populate("userId", "name email")
      .lean();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if start date and expiry date are set
    if (!patient.caseStartDate || !patient.caseEndDate) {
      return NextResponse.json(
        {
          error:
            "Case start date and expiry date must be set before sending case details email",
        },
        { status: 400 },
      );
    }

    // Prepare case data
    const caseData = {
      doctorName: patient.userId?.name || "Doctor",
      patientName: patient.patientName,
      caseId: patient.caseId,
      caseCategory: patient.caseCategory,
      registeredDate: patient.createdAt,
      approvalDate: patient.updatedAt, // You may want to track actual approval date
      startDate: patient.caseStartDate,
      expiryDate: patient.caseEndDate,
    };

    // Send email to doctor
    const emailHtml = getCaseDetailsEmailTemplate(caseData);
    await sendEmail({
      to: patient.userId?.email,
      subject: `Case ${patient.patientName} (${patient.caseId}) Details Confirmed`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: "Case details email sent successfully",
    });
  } catch (error) {
    console.error("Error sending case details email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
