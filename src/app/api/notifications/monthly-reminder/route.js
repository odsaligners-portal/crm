import { NextResponse } from "next/server";
import connectDB from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import Patient from "@/app/api/models/Patient";
import User from "@/app/api/models/User";
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

    // Group cases by doctor
    const casesByDoctor = {};
    const doctorCasesMap = {};

    activeCases.forEach((patient) => {
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
    for (const [doctorId, data] of Object.entries(doctorCasesMap)) {
      if (data.doctor?.email) {
        try {
          // Sort patients by name for doctor emails
          const sortedCases = [...data.cases].sort((a, b) =>
            a.patientName.localeCompare(b.patientName),
          );
          const emailHtml = getMonthlyReminderEmailTemplate(
            sortedCases,
            false, // isAdmin = false
          );
          await sendEmail({
            to: data.doctor.email,
            subject: `Monthly Follow-Up Reminder - ${sortedCases.length} case(s)`,
            html: emailHtml,
          });
          emailsSent++;
        } catch (error) {
          console.error(
            `Error sending monthly reminder to ${data.doctor.email}:`,
            error,
          );
        }
      }
    }

    // Send emails to admins (grouped by doctor, sorted by doctor name)
    const admins = await User.find({ role: "admin" }).select("email name");
    for (const admin of admins) {
      try {
        const totalCases = activeCases.length;
        const emailHtml = getMonthlyReminderEmailTemplate(
          null, // cases array not needed, we'll pass casesByDoctor
          true, // isAdmin = true
          casesByDoctor, // pass grouped cases
        );
        await sendEmail({
          to: admin.email,
          subject: `Monthly Follow-Up Reminder - ${totalCases} case(s)`,
          html: emailHtml,
        });
        emailsSent++;
      } catch (error) {
        console.error(`Error sending email to admin ${admin.email}:`, error);
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
