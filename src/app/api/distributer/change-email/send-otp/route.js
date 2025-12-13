import { NextResponse } from "next/server";
import { handleError, AppError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import Distributer from "../../../models/Distributer";
import OTP from "../../../models/OTP";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../../utils/mailer";

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

    const { newEmail } = await req.json();

    if (!newEmail) {
      throw new AppError("New email is required", 400);
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(newEmail)) {
      throw new AppError("Please provide a valid email", 400);
    }

    // Check if new email is different from current email
    const currentUser = await Distributer.findById(decoded.id);
    if (!currentUser) {
      throw new AppError("User not found", 404);
    }

    if (currentUser.email.toLowerCase() === newEmail.toLowerCase()) {
      throw new AppError("New email must be different from current email", 400);
    }

    // Check if new email is already in use
    const existingUser = await Distributer.findOne({
      email: newEmail.toLowerCase(),
    });
    if (existingUser) {
      throw new AppError("This email is already in use", 400);
    }

    // Delete any existing OTPs for this email change
    await OTP.deleteMany({ email: newEmail.toLowerCase() });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpDoc = new OTP({
      email: newEmail.toLowerCase(),
      otp,
      userData: {
        userId: decoded.id,
        oldEmail: currentUser.email,
        newEmail: newEmail.toLowerCase(),
        userType: "distributer",
      },
    });

    await otpDoc.save();

    // Send OTP email
    const otpEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Change Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { margin-bottom: 30px; }
          .otp-container { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea; text-align: center; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
          .security-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .security-note p { margin: 0; color: #856404; }
          .info-box { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .info-box p { margin: 5px 0; color: #0c5460; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Email Change Verification</h1>
          </div>
          
          <div class="content">
            <p>Hello ${currentUser.name},</p>
            
            <p>You have requested to change your email address. To complete this change, please verify your new email address using the verification code below.</p>
            
            <div class="info-box">
              <p><strong>Current Email:</strong> ${currentUser.email}</p>
              <p><strong>New Email:</strong> ${newEmail}</p>
            </div>
            
            <div class="otp-container">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">Your Verification Code</h3>
              <div class="otp-code">${otpDoc.otp}</div>
              <p style="margin: 0; color: #666;">This code will expire in 10 minutes</p>
            </div>
            
            <div class="security-note">
              <p><strong>🔒 Security Note:</strong> This verification code is valid for 10 minutes only. If you didn't request this email change, please ignore this email and contact support immediately.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated verification email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: newEmail,
      subject: `Verify Your New Email - ${otpDoc.otp}`,
      html: otpEmailHtml,
    });

    return NextResponse.json(
      {
        message:
          "OTP sent successfully. Please check your new email to verify.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Send OTP for email change error:", error);
    return handleError(error);
  }
}
