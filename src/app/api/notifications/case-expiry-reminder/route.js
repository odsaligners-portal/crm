import { NextResponse } from "next/server";
import connectDB from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import Patient from "@/app/api/models/Patient";
import User from "@/app/api/models/User";
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

    // Group cases by doctor
    const casesByDoctor = {};
    const doctorCasesMap = {};

    expiringCases.forEach((patient) => {
      if (patient.userId) {
        const doctorId = patient.userId._id.toString();
        const doctorName = patient.userId.name || "Unknown Doctor";

        // For admin emails - group by doctor
        if (!casesByDoctor[doctorName]) {
          casesByDoctor[doctorName] = {
            doctorName: doctorName,
            cases: [],
          };
        }
        casesByDoctor[doctorName].cases.push({
          patientName: patient.patientName,
          caseId: patient.caseId,
          expiryDate: patient.caseEndDate,
        });

        // For doctor emails - group by doctor
        if (!doctorCasesMap[doctorId]) {
          doctorCasesMap[doctorId] = {
            doctor: patient.userId,
            cases: [],
          };
        }
        doctorCasesMap[doctorId].cases.push({
          patientName: patient.patientName,
          caseId: patient.caseId,
          expiryDate: patient.caseEndDate,
        });
      }
    });

    // Sort doctors by name for admin emails
    const sortedDoctors = Object.keys(casesByDoctor).sort();
    sortedDoctors.forEach((doctorName) => {
      // Sort patients by name within each doctor's cases
      casesByDoctor[doctorName].cases.sort((a, b) =>
        a.patientName.localeCompare(b.patientName),
      );
    });

    let emailsSent = 0;

    // Send reminder emails to doctors (all their cases in one email, sorted by patient name)
    for (const [, data] of Object.entries(doctorCasesMap)) {
      if (data.doctor?.email) {
        try {
          // Sort patients by name for doctor emails
          const sortedCases = [...data.cases].sort((a, b) =>
            a.patientName.localeCompare(b.patientName),
          );
          const emailHtml =
            daysBefore === 0
              ? getCaseExpiredEmailTemplate(sortedCases, false)
              : getCaseExpiryReminderEmailTemplate(
                  sortedCases,
                  daysBefore,
                  false,
                );

          const subject =
            daysBefore === 0
              ? `Case Expiry Notification - ${sortedCases.length} case(s) expired`
              : `Case Expiry Reminder - ${sortedCases.length} case(s) expiring in ${daysBefore} days`;

          await sendEmail({
            to: data.doctor.email,
            subject,
            html: emailHtml,
          });
          emailsSent++;
        } catch (error) {
          console.error(
            `Error sending expiry reminder to ${data.doctor.email}:`,
            error,
          );
        }
      }
    }

    // Send emails to admins (grouped by doctor, sorted by doctor name)
    const admins = await User.find({ role: "admin" }).select("email name");
    for (const admin of admins) {
      try {
        const totalCases = expiringCases.length;
        const emailHtml =
          daysBefore === 0
            ? getCaseExpiredEmailTemplate(null, true, casesByDoctor)
            : getCaseExpiryReminderEmailTemplate(
                null,
                daysBefore,
                true,
                casesByDoctor,
              );

        const subject =
          daysBefore === 0
            ? `Case Expiry Notification - ${totalCases} case(s) expired`
            : `Case Expiry Reminder - ${totalCases} case(s) expiring in ${daysBefore} days`;

        await sendEmail({
          to: admin.email,
          subject,
          html: emailHtml,
        });
        emailsSent++;
      } catch (error) {
        console.error(`Error sending email to admin ${admin.email}:`, error);
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
