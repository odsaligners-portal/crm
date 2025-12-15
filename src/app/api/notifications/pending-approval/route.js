import { NextResponse } from "next/server";
import connectDB from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import Patient from "@/app/api/models/Patient";
import User from "@/app/api/models/User";
import { sendEmail } from "@/app/api/utils/mailer";
import { getPendingApprovalEmailTemplate } from "@/app/api/utils/emailTemplates";

export async function POST(req) {
  try {
    await connectDB();

    // Verify authentication - only allow super-admin or system calls
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      // Allow system/cron calls with secret key
      const authHeader = req.headers.get("authorization");
      if (
        !authHeader ||
        authHeader !==
          `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET_KEY || "cron-secret-key"}`
      ) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    // Get all pending approval cases (not on hold or cancelled)
    // Note: Based on the Patient model, caseStatus enum doesn't include "on hold" or "cancelled"
    // So we just query for "approval pending" status
    const pendingCases = await Patient.find({
      caseStatus: "approval pending",
    })
      .populate("userId", "name email distributerId")
      .lean();

    if (pendingCases.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending cases found",
        emailsSent: 0,
      });
    }

    // Group cases by doctor
    const casesByDoctor = {};
    const allCases = [];

    pendingCases.forEach((patient) => {
      if (patient.userId) {
        const doctorId = patient.userId._id.toString();
        if (!casesByDoctor[doctorId]) {
          casesByDoctor[doctorId] = {
            doctor: patient.userId,
            cases: [],
          };
        }
        casesByDoctor[doctorId].cases.push({
          patientName: patient.patientName,
          caseId: patient.caseId,
          createdAt: patient.createdAt,
        });
      }
      allCases.push({
        patientName: patient.patientName,
        caseId: patient.caseId,
        createdAt: patient.createdAt,
      });
    });

    // Get all admins
    const admins = await User.find({ role: "admin" }).select("email name");

    // Get all distributers (unique) - distributers are associated with doctors, not patients directly
    const distributerIds = [
      ...new Set(
        pendingCases
          .map((p) => p.userId?.distributerId?.toString())
          .filter(Boolean),
      ),
    ];
    const distributers = await User.find({
      _id: { $in: distributerIds },
      role: "distributer",
    }).select("email name");

    let emailsSent = 0;

    // Send emails to doctors (only their cases)
    for (const [doctorId, data] of Object.entries(casesByDoctor)) {
      try {
        const emailHtml = getPendingApprovalEmailTemplate(
          data.cases.length,
          data.cases,
        );
        await sendEmail({
          to: data.doctor.email,
          subject: `Pending Approval Cases - ${data.cases.length} case(s) awaiting approval`,
          html: emailHtml,
        });
        emailsSent++;
      } catch (error) {
        console.error(
          `Error sending email to doctor ${data.doctor.email}:`,
          error,
        );
      }
    }

    // Send emails to admins (all pending cases)
    for (const admin of admins) {
      try {
        const emailHtml = getPendingApprovalEmailTemplate(
          allCases.length,
          allCases,
        );
        await sendEmail({
          to: admin.email,
          subject: `Pending Approval Cases - ${allCases.length} case(s) awaiting approval`,
          html: emailHtml,
        });
        emailsSent++;
      } catch (error) {
        console.error(`Error sending email to admin ${admin.email}:`, error);
      }
    }

    // Send emails to distributers (all pending cases)
    for (const distributer of distributers) {
      try {
        const emailHtml = getPendingApprovalEmailTemplate(
          allCases.length,
          allCases,
        );
        await sendEmail({
          to: distributer.email,
          subject: `Pending Approval Cases - ${allCases.length} case(s) awaiting approval`,
          html: emailHtml,
        });
        emailsSent++;
      } catch (error) {
        console.error(
          `Error sending email to distributer ${distributer.email}:`,
          error,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pending approval emails sent successfully`,
      emailsSent,
      totalCases: allCases.length,
    });
  } catch (error) {
    console.error("Error sending pending approval emails:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
