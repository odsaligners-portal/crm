import { NextResponse } from "next/server";
import connectDB from "../../config/db";
import User from "../../models/User";
import OTP from "../../models/OTP";
import { AppError, handleError } from "../../utils/errorHandler";
import { sendEmail } from "../../utils/mailer";

export async function POST(req) {
  try {
    await connectDB();

    const {
      name,
      email,
      password,
      mobile,
      gender,
      country,
      state,
      city,
      experience,
      doctorType,
      address,
      alternateAddresses,
      profilePicture,
    } = await req.json();

    if (!name || !email || !password) {
      throw new AppError("Please provide all required fields", 400);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(
        "Email id is already in use. Please login to continue",
        400,
      );
    }

    await OTP.deleteMany({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store user data directly in OTP document
    const userData = {
      name,
      email,
      password,
      mobile,
      gender,
      country,
      state,
      city,
      experience,
      doctorType,
      address,
      alternateAddresses: alternateAddresses || [],
      ...(profilePicture ? { profilePicture } : {}),
    };

    const otpDoc = new OTP({
      email,
      otp,
      userData,
    });

    await otpDoc.save();

    // Send OTP verification email
    try {
      const otpEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { margin-bottom: 30px; }
              .welcome-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .welcome-info h3 { margin: 0 0 15px 0; color: #667eea; font-size: 18px; }
              .welcome-info p { margin: 5px 0; }
              .features { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .features h3 { margin: 0 0 15px 0; color: #495057; font-size: 16px; }
              .feature-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #28a745; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
              .otp-container { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea; text-align: center; }
              .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 20px 0; }
              .security-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
              .security-note p { margin: 0; color: #856404; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Email Verification</h1>
              </div>
              
              <div class="content">
                <p>Dear ${name},</p>
                
                <p>Thank you for registering with our platform! To complete your registration, please verify your email address using the verification code below.</p>
                
                <div class="otp-container">
                  <h3 style="margin: 0 0 15px 0; color: #667eea;">Your Verification Code</h3>
                  <div class="otp-code">${otpDoc.otp}</div>
                  <p style="margin: 0; color: #666;">This code will expire in 10 minutes</p>
                </div>
                
                <div class="security-note">
                  <p><strong>🔒 Security Note:</strong> This verification code is valid for 10 minutes only. If you didn't request this code, please ignore this email.</p>
                </div>
                
                <p>Once verified, you'll be able to access all features of our platform and start managing your patients.</p>
              </div>
              
              <div class="footer">
                <p>This is an automated verification email. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;

      await sendEmail({
        to: email,
        subject: `Verify Your Email - ${otpDoc.otp}`,
        html: otpEmailHtml,
      });
    } catch {
      throw new AppError("Failed to send verification email", 500);
    }

    // Return OTP verification response
    return NextResponse.json(
      {
        message:
          "OTP sent successfully. Please check your email to verify your account.",
        email: email,
        requiresVerification: true,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleError(error);
  }
}
