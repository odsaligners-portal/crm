import { NextResponse } from "next/server";
import connectDB from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import Patient from "@/app/api/models/Patient";
import { sendEmail } from "@/app/api/utils/mailer";
import {
  getCaseExpiryReminderEmailTemplate,
  getCaseExpiredEmailTemplate,
} from "@/app/api/utils/emailTemplates";

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

    const { daysBefore = 30 } = await req.json().catch(() => ({}));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate target date
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysBefore);
    targetDate.setHours(23, 59, 59, 999);

    // Get cases expiring on target date
    const expiringCases = await Patient.find({
      caseStatus: "approved",
      caseEndDate: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999)),
      },
    })
      .populate("userId", "name email")
      .lean();

    if (expiringCases.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No cases expiring in ${daysBefore} days found`,
        emailsSent: 0,
      });
    }

    let emailsSent = 0;

    // Send reminder emails
    for (const patient of expiringCases) {
      if (patient.userId?.email) {
        try {
          const caseData = {
            patientName: patient.patientName,
            caseId: patient.caseId,
            expiryDate: patient.caseEndDate,
          };

          const emailHtml =
            daysBefore === 0
              ? getCaseExpiredEmailTemplate(caseData)
              : getCaseExpiryReminderEmailTemplate(caseData, daysBefore);

          const subject =
            daysBefore === 0
              ? `Case ${patient.patientName} (${patient.caseId}) Expired and Closed`
              : `Reminder: Case ${patient.patientName} (${patient.caseId}) Expiry in ${daysBefore} Days`;

          await sendEmail({
            to: patient.userId.email,
            subject,
            html: emailHtml,
          });
          emailsSent++;
        } catch (error) {
          console.error(
            `Error sending expiry reminder to ${patient.userId.email}:`,
            error,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Case expiry reminder emails sent successfully`,
      emailsSent,
      totalCases: expiringCases.length,
      daysBefore,
    });
  } catch (error) {
    console.error("Error sending case expiry reminder emails:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
