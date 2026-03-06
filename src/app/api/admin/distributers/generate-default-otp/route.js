import connectDB from "@/app/api/config/db";
import Distributer from "@/app/api/models/Distributer";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

/**
 * POST - Generate default OTP for a distributor (Super Admin only).
 * The generated OTP can be used by doctors during signup when they use this distributor's referral code.
 */
export async function POST(req) {
  try {
    await connectDB();

    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const superAdminId = process.env.SUPER_ADMIN_ID;
    if (!superAdminId || authResult.user.id !== superAdminId) {
      return NextResponse.json(
        { message: "Only Super Admin can generate default OTP for distributors" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { id: distributerId } = body;

    if (!distributerId) {
      return NextResponse.json(
        { message: "Distributor ID is required" },
        { status: 400 },
      );
    }

    const distributer = await Distributer.findById(distributerId);
    if (!distributer) {
      return NextResponse.json(
        { message: "Distributor not found" },
        { status: 404 },
      );
    }

    const defaultOtp = Math.floor(100000 + Math.random() * 900000).toString();
    distributer.defaultOtp = defaultOtp;
    await distributer.save();

    return NextResponse.json({
      success: true,
      message:
        "Default OTP generated. The distributor can see it in their dashboard.",
      defaultOtpGenerated: true,
    });
  } catch (error) {
    console.error("Generate default OTP error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate default OTP" },
      { status: 500 },
    );
  }
}
