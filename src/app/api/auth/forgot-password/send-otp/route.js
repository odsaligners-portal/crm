import { NextResponse } from "next/server";
import { handleError, AppError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import User from "../../../models/User";
import Distributer from "../../../models/Distributer";
import OTP from "../../../models/OTP";
import { sendEmail } from "../../../utils/mailer";

export async function POST(req) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email", 400);
    }

    const emailLower = email.toLowerCase();

    // Check if user exists (check both User and Distributer models)
    const user = await User.findOne({ email: emailLower });
    const distributer = await Distributer.findOne({ email: emailLower });

    if (!user && !distributer) {
      // Don't reveal if email exists for security reasons
      return NextResponse.json({
        message: "If an account exists with this email, an OTP has been sent.",
      });
    }

    // Delete any existing password reset OTPs for this email
    await OTP.deleteMany({
      email: emailLower,
      "userData.type": "password-reset",
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpDoc = new OTP({
      email: emailLower,
      otp,
      userData: {
        type: "password-reset",
        userId: user?._id || distributer?._id,
        userType: user ? "user" : "distributer",
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
        <title>Password Reset Verification</title>
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
          .warning-box { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .warning-box p { margin: 0; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Verification</h1>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            
            <p>We received a request to reset your password. Use the verification code below to proceed with resetting your password:</p>
            
            <div class="otp-container">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">Your Verification Code</h3>
              <div class="otp-code">${otpDoc.otp}</div>
              <p style="margin: 0; color: #666;">This code will expire in 10 minutes</p>
            </div>
            
            <div class="security-note">
              <p><strong>🔒 Security Note:</strong> This verification code is valid for 10 minutes only. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            
            <div class="warning-box">
              <p><strong>⚠️ Important:</strong> If you didn't request this password reset, please contact support immediately.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated password reset email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: emailLower,
      subject: `Password Reset Verification - ${otpDoc.otp}`,
      html: otpEmailHtml,
    });

    return NextResponse.json({
      message: "If an account exists with this email, an OTP has been sent.",
      email: emailLower,
    });
  } catch (error) {
    console.error("Password reset OTP error:", error);
    return handleError(error);
  }
}
