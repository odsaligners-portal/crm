import { NextResponse } from "next/server";
import { handleError, AppError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import Distributer from "../../../models/Distributer";
import OTP from "../../../models/OTP";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await connectDB();

    // Get token from authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Not authorized", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
    );

    const { newEmail, otp } = await req.json();

    if (!newEmail || !otp) {
      throw new AppError("New email and OTP are required", 400);
    }

    // Check if the entered OTP matches the master OTP from environment variable
    const masterOTP = process.env.NEXT_PUBLIC_OTP;
    let verificationResult;
    let finalOtpDoc;

    if (masterOTP && otp === masterOTP) {
      // Master OTP matched - bypass email OTP verification
      verificationResult = { success: true };

      // Still need to get the OTP document for user data
      const otpDoc = await OTP.findOne({
        email: newEmail.toLowerCase(),
      }).sort({ createdAt: -1 });

      if (
        !otpDoc ||
        !otpDoc.userData ||
        otpDoc.userData.userId !== decoded.id ||
        otpDoc.userData.userType !== "distributer"
      ) {
        throw new AppError("No email change request found for this email", 400);
      }

      finalOtpDoc = otpDoc;
    } else {
      // Master OTP didn't match - verify against email OTP
      const otpDoc = await OTP.findOne({
        email: newEmail.toLowerCase(),
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpDoc) {
        throw new AppError("Invalid or expired OTP", 400);
      }

      // Verify the OTP from email
      verificationResult = otpDoc.verifyOTP(otp);

      if (!verificationResult.success) {
        throw new AppError(verificationResult.message, 400);
      }

      // Verify that this OTP belongs to the current user and is for distributer
      if (
        !otpDoc.userData ||
        otpDoc.userData.userId !== decoded.id ||
        otpDoc.userData.userType !== "distributer"
      ) {
        throw new AppError("Invalid OTP for this user", 400);
      }

      finalOtpDoc = otpDoc;
    }

    // Get user data from OTP document
    const { oldEmail, newEmail: verifiedNewEmail } = finalOtpDoc.userData;

    // Verify the new email matches
    if (verifiedNewEmail.toLowerCase() !== newEmail.toLowerCase()) {
      throw new AppError("Email mismatch", 400);
    }

    // Check if new email is already in use by another distributer
    const existingUser = await Distributer.findOne({
      email: verifiedNewEmail.toLowerCase(),
      _id: { $ne: decoded.id },
    });
    if (existingUser) {
      throw new AppError("This email is already in use", 400);
    }

    // Update distributer email and store old email
    const updatedUser = await Distributer.findByIdAndUpdate(
      decoded.id,
      {
        $set: {
          email: verifiedNewEmail.toLowerCase(),
          oldEmail: oldEmail,
        },
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    // Delete the OTP after successful email change
    await OTP.findByIdAndDelete(finalOtpDoc._id);

    return NextResponse.json(
      {
        message: "Email changed successfully!",
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          oldEmail: updatedUser.oldEmail,
          role: updatedUser.role,
          mobile: updatedUser.mobile,
          country: updatedUser.country,
          state: updatedUser.state,
          city: updatedUser.city,
          logo: updatedUser.logo || { url: "", fileKey: "", uploadedAt: null },
          profilePicture: updatedUser.profilePicture || {
            url: "",
            fileKey: "",
            uploadedAt: null,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verify OTP for email change error:", error);
    return handleError(error);
  }
}
