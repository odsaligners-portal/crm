import { NextResponse } from "next/server";
import { handleError, AppError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import User from "../../../models/User";
import Distributer from "../../../models/Distributer";
import OTP from "../../../models/OTP";
import bcrypt from "bcryptjs";
import { sendEmail } from "../../../utils/mailer";

export async function POST(req) {
  try {
    await connectDB();

    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      throw new AppError("Email, OTP, and new password are required", 400);
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email", 400);
    }

    // Validate password
    if (newPassword.length < 8) {
      throw new AppError("Password must be at least 8 characters long", 400);
    }

    if (!/(?=.*[a-z])/.test(newPassword)) {
      throw new AppError(
        "Password must contain at least one lowercase letter",
        400,
      );
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      throw new AppError(
        "Password must contain at least one uppercase letter",
        400,
      );
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      throw new AppError("Password must contain at least one number", 400);
    }

    if (!/(?=.*[@$!%*?&#])/.test(newPassword)) {
      throw new AppError(
        "Password must contain at least one special character (@$!%*?&#)",
        400,
      );
    }

    const emailLower = email.toLowerCase();

    // Find and verify OTP
    const otpDoc = await OTP.findOne({
      email: emailLower,
      "userData.type": "password-reset",
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    // Verify the OTP
    const verificationResult = otpDoc.verifyOTP(otp);
    if (!verificationResult.success) {
      throw new AppError(verificationResult.message, 400);
    }

    // Get user data from OTP
    const { userId, userType } = otpDoc.userData;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Get user information before updating password
    let userName = "";
    let userEmail = emailLower;
    let userRole = "";

    // Update password based on user type
    // Use findByIdAndUpdate to only update password field and avoid validation issues
    if (userType === "user") {
      const user = await User.findById(userId).select("name email role");
      if (!user) {
        throw new AppError("User not found", 404);
      }
      userName = user.name || "User";
      userEmail = user.email || emailLower;
      userRole = user.role || "user";

      await User.findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        { new: true, runValidators: false },
      );
    } else if (userType === "distributer") {
      const distributer =
        await Distributer.findById(userId).select("name email role");
      if (!distributer) {
        throw new AppError("Distributer not found", 404);
      }
      userName = distributer.name || "Distributer";
      userEmail = distributer.email || emailLower;
      userRole = distributer.role || "distributer";

      await Distributer.findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        { new: true, runValidators: false },
      );
    } else {
      throw new AppError("Invalid user type", 400);
    }

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpDoc._id });

    // Get all admins (admin and super-admin)
    const admins = await User.find({
      role: { $in: ["admin", "super-admin"] },
    }).select("email name");

    const adminEmails = admins.map((admin) => admin.email).filter(Boolean);

    // Email template for user
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { margin-bottom: 30px; }
          .password-container { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea; text-align: center; }
          .password-code { font-size: 28px; font-weight: bold; color: #667eea; letter-spacing: 4px; margin: 20px 0; font-family: monospace; }
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
            <h1>✅ Password Reset Successful</h1>
          </div>
          
          <div class="content">
            <p>Hello ${userName},</p>
            
            <p>Your password has been successfully reset. Below is your new password:</p>
            
            <div class="password-container">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">Your New Password</h3>
              <div class="password-code">${newPassword}</div>
              <p style="margin: 0; color: #666;">Please keep this password secure</p>
            </div>
            
            <div class="info-box">
              <p><strong>📧 Email:</strong> ${userEmail}</p>
              <p><strong>🕐 Reset Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="security-note">
              <p><strong>🔒 Security Note:</strong> Please change your password after logging in for better security. Do not share this password with anyone.</p>
            </div>
            
            <p>You can now login to your account using this new password.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated password reset notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email template for admins
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { margin-bottom: 30px; }
          .password-container { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea; text-align: center; }
          .password-code { font-size: 28px; font-weight: bold; color: #667eea; letter-spacing: 4px; margin: 20px 0; font-family: monospace; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
          .info-box { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .info-box p { margin: 5px 0; color: #0c5460; }
          .warning-box { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .warning-box p { margin: 0; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Password Reset Notification</h1>
          </div>
          
          <div class="content">
            <p>Hello Admin,</p>
            
            <p>A password reset has been completed for the following account:</p>
            
            <div class="info-box">
              <p><strong>👤 User Name:</strong> ${userName}</p>
              <p><strong>📧 Email:</strong> ${userEmail}</p>
              <p><strong>👥 Role:</strong> ${userRole}</p>
              <p><strong>🕐 Reset Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="password-container">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">New Password</h3>
              <div class="password-code">${newPassword}</div>
            </div>
            
            <div class="warning-box">
              <p><strong>⚠️ Important:</strong> This password has been set by the user through the password reset process. Please keep this information secure and confidential.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated notification email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to user
    try {
      await sendEmail({
        to: userEmail,
        subject: "Password Reset Successful",
        html: userEmailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send email to user:", emailError);
      // Don't fail the request if email fails
    }

    // Send email to all admins
    if (adminEmails.length > 0) {
      try {
        await sendEmail({
          to: adminEmails,
          subject: `Password Reset Notification - ${userName}`,
          html: adminEmailHtml,
        });
      } catch (emailError) {
        console.error("Failed to send email to admins:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return handleError(error);
  }
}
