import { NextResponse } from "next/server";
import connectDB from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import Patient from "@/app/api/models/Patient";
import { sendEmail } from "@/app/api/utils/mailer";
import { getMonthlyReminderEmailTemplate } from "@/app/api/utils/emailTemplates";

export async function POST(req) {
  try {
    await connectDB();

    // Verify cron secret or auth
    const authHeader = req.headers.get("authorization");
    if (
      !authHeader ||
      authHeader !==
        `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET_KEY || "cron-secret-key"}`
    ) {
      const authResult = await verifyAuth(req);
      if (!authResult.success) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    // Get all active and approved cases
    const activeCases = await Patient.find({
      caseStatus: "approved",
      caseStartDate: { $exists: true, $ne: null },
      caseEndDate: { $exists: true, $ne: null },
      // Only cases that haven't expired
      caseEndDate: { $gt: new Date() },
    })
      .populate("userId", "name email")
      .lean();

    if (activeCases.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active cases found",
        emailsSent: 0,
      });
    }

    let emailsSent = 0;

    // Send reminder email to each doctor for their cases
    for (const patient of activeCases) {
      if (patient.userId?.email) {
        try {
          const caseData = {
            patientName: patient.patientName,
            caseId: patient.caseId,
          };

          const emailHtml = getMonthlyReminderEmailTemplate(caseData);
          await sendEmail({
            to: patient.userId.email,
            subject: `Reminder: Case ${patient.patientName} (${patient.caseId}) Follow-Up Required`,
            html: emailHtml,
          });
          emailsSent++;
        } catch (error) {
          console.error(
            `Error sending monthly reminder to ${patient.userId.email}:`,
            error,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Monthly reminder emails sent successfully",
      emailsSent,
      totalCases: activeCases.length,
    });
  } catch (error) {
    console.error("Error sending monthly reminder emails:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
