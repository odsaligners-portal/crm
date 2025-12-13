import { NextResponse } from "next/server";
import { handleError, AppError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import User from "../../../models/User";
import OTP from "../../../models/OTP";
import { verifyAuth } from "../../../middleware/authMiddleware";

export async function POST(req) {
  try {
    await connectDB();

    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user = authResult.user;

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

      if (!otpDoc || !otpDoc.userData || otpDoc.userData.userId !== user.id) {
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

      // Verify that this OTP belongs to the current user
      if (!otpDoc.userData || otpDoc.userData.userId !== user.id) {
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

    // Check if new email is already in use by another user
    const existingUser = await User.findOne({
      email: verifiedNewEmail.toLowerCase(),
      _id: { $ne: user.id },
    });
    if (existingUser) {
      throw new AppError("This email is already in use", 400);
    }

    // Update user email and store old email
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
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
          gender: updatedUser.gender,
          country: updatedUser.country,
          state: updatedUser.state,
          city: updatedUser.city,
          experience: updatedUser.experience,
          doctorType: updatedUser.doctorType,
          address: updatedUser.address,
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
