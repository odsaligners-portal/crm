import { NextResponse } from "next/server";
import { handleError, AppError } from "../../utils/errorHandler";
import connectDB from "../../config/db";
import Distributer from "../../models/Distributer";
import { verifyAuth } from "../../middleware/authMiddleware";

// GET - Get or generate referral code
export async function GET(req) {
  try {
    await connectDB();

    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const distributerId = authResult.user.id;

    // Find distributer (include defaultOtp so distributor can see and share with doctors)
    const distributer = await Distributer.findById(distributerId).select(
      "referralCode name email defaultOtp",
    );

    if (!distributer) {
      throw new AppError("Distributer not found", 404);
    }

    // Generate referral code if it doesn't exist
    if (!distributer.referralCode) {
      let isUnique = false;
      let referralCode = "";
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        referralCode = "";
        for (let i = 0; i < 8; i++) {
          referralCode += chars.charAt(
            Math.floor(Math.random() * chars.length),
          );
        }

        const existing = await Distributer.findOne({
          referralCode: referralCode,
        });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (isUnique) {
        distributer.referralCode = referralCode;
        await distributer.save();
      } else {
        throw new AppError("Failed to generate referral code", 500);
      }
    }

    // Get referral link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const referralLink = `${baseUrl}/register?ref=${distributer.referralCode}`;

    return NextResponse.json({
      success: true,
      referralCode: distributer.referralCode,
      referralLink: referralLink,
      distributerName: distributer.name,
      defaultOtp: distributer.defaultOtp || null,
    });
  } catch (error) {
    console.error("Referral code error:", error);
    return handleError(error);
  }
}

// POST - Regenerate referral code
export async function POST(req) {
  try {
    await connectDB();

    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const distributerId = authResult.user.id;

    // Find distributer
    const distributer = await Distributer.findById(distributerId);

    if (!distributer) {
      throw new AppError("Distributer not found", 404);
    }

    // Generate new referral code
    let isUnique = false;
    let referralCode = "";
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      referralCode = "";
      for (let i = 0; i < 8; i++) {
        referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await Distributer.findOne({
        referralCode: referralCode,
        _id: { $ne: distributerId },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new AppError("Failed to generate unique referral code", 500);
    }

    distributer.referralCode = referralCode;
    await distributer.save();

    // Get referral link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const referralLink = `${baseUrl}/register?ref=${referralCode}`;

    return NextResponse.json({
      success: true,
      message: "Referral code regenerated successfully",
      referralCode: referralCode,
      referralLink: referralLink,
    });
  } catch (error) {
    console.error("Regenerate referral code error:", error);
    return handleError(error);
  }
}
