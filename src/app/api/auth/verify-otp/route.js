import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import connectDB from "../../config/db";
import User from "../../models/User";
import Distributer from "../../models/Distributer";
import OTP from "../../models/OTP";
import { AppError, handleError } from "../../utils/errorHandler";
import { sendEmail } from "../../utils/mailer";

export async function POST(req) {
  try {
    await connectDB();

    const { email, otp } = await req.json();

    if (!email || !otp) {
      throw new AppError("Email and OTP are required", 400);
    }

    // Check OTP in order: 1) project default (master), 2) distributor default, 3) email OTP
    const masterOTP = process.env.NEXT_PUBLIC_OTP;
    let verificationResult;
    let finalOtpDoc;

    const otpDocForUserData = await OTP.findOne({
      email: email,
    }).sort({ createdAt: -1 });

    if (!otpDocForUserData) {
      throw new AppError("No registration found for this email", 400);
    }

    if (masterOTP && otp === masterOTP) {
      // Project default (master) OTP matched
      verificationResult = { success: true };
      finalOtpDoc = otpDocForUserData;
    } else if (otpDocForUserData.userData?.distributerId) {
      // Check distributor default OTP (only when user signed up with a referral)
      const distributer = await Distributer.findById(
        otpDocForUserData.userData.distributerId,
      ).select("defaultOtp");
      if (distributer?.defaultOtp && otp === distributer.defaultOtp) {
        verificationResult = { success: true };
        finalOtpDoc = otpDocForUserData;
      } else {
        // Distributor default didn't match - verify against email OTP
        const otpDoc = await OTP.findOne({
          email: email,
          expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!otpDoc) {
          throw new AppError("Invalid or expired OTP", 400);
        }
        verificationResult = otpDoc.verifyOTP(otp);
        if (!verificationResult.success) {
          throw new AppError(verificationResult.message, 400);
        }
        finalOtpDoc = otpDoc;
      }
    } else {
      // No distributor referral - verify against email OTP only (or master already checked above)
      const otpDoc = await OTP.findOne({
        email: email,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpDoc) {
        throw new AppError("Invalid or expired OTP", 400);
      }
      verificationResult = otpDoc.verifyOTP(otp);
      if (!verificationResult.success) {
        throw new AppError(verificationResult.message, 400);
      }
      finalOtpDoc = otpDoc;
    }

    // Create the user with stored data
    const userData = finalOtpDoc.userData;

    if (!userData) {
      throw new AppError("User data not found", 400);
    }

    let user;
    try {
      user = await User.create(userData);
    } catch {
      throw new AppError("Failed to create user account", 500);
    }

    // Delete the OTP after successful user creation
    await OTP.findByIdAndDelete(finalOtpDoc._id);

    // Generate JWT (but don't set cookies since we're showing a modal)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "30d" },
    );

    // Send welcome email to doctor
    if (user.role === "doctor") {
      try {
        const welcomeEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Our Platform</title>
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
              .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .cta-button:hover { opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to Our Platform!</h1>
              </div>
              
              <div class="content">
                <p>Dear Dr. ${user.name},</p>
                
                <p>Welcome to our comprehensive patient management system! We're thrilled to have you join our community of healthcare professionals.</p>
                
                <div class="welcome-info">
                  <h3>👤 Your Account Details</h3>
                  <p><strong>Name:</strong> ${user.name}</p>
                  <p><strong>Email:</strong> ${user.email}</p>
                  <p><strong>Specialization:</strong> ${user.doctorType || "Not specified"}</p>
                  <p><strong>Experience:</strong> ${user.experience || "Not specified"}</p>
                  <p><strong>Location:</strong> ${user.city ? `${user.city}, ${user.state}` : "Not specified"}</p>
                </div>
                
                <div class="features">
                  <h3>🚀 What You Can Do</h3>
                  <div class="feature-item">
                    <strong>Patient Management:</strong> Create and manage patient records with ease
                  </div>
                  <div class="feature-item">
                    <strong>Case Tracking:</strong> Monitor treatment progress and case status
                  </div>
                  <div class="feature-item">
                    <strong>File Management:</strong> Upload and organize patient documents securely
                  </div>
                  <div class="feature-item">
                    <strong>Communication:</strong> Stay connected with your team and patients
                  </div>
                </div>
                
                <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #0c5460;"><strong>⏰ Account Activation:</strong> Thank you for your registration! Your account will be activated within 24 hours. You will receive another email once your account is ready to use.</p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;"><strong>🔒 Security Note:</strong> For your security, we recommend changing your password after your first login.</p>
                </div>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              </div>
              
              <div class="footer">
                <p>Thank you for choosing our platform!</p>
                <p>This is an automated welcome message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: user.email,
          subject: `Welcome to Our Platform, Dr. ${user.name}!`,
          html: welcomeEmailHtml,
        });
      } catch {
        // Don't fail the verification if email fails
      }
    }

    // Send notification email to distributor if user registered with referral code
    if (user.distributerId || user.referralCode) {
      try {
        let distributer = null;

        // First try to find by distributerId
        if (user.distributerId) {
          distributer = await Distributer.findById(user.distributerId).select(
            "name email referralCode",
          );
        }

        // If not found by ID but referralCode exists, try to find by referral code
        if (!distributer && user.referralCode) {
          distributer = await Distributer.findOne({
            referralCode: user.referralCode.toUpperCase(),
          }).select("name email referralCode");
        }

        if (distributer && distributer.email) {
          const distributerNotificationHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New User Joined via Referral</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                .content { margin-bottom: 30px; }
                .user-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .user-info h3 { margin: 0 0 15px 0; color: #667eea; font-size: 18px; }
                .user-info p { margin: 5px 0; }
                .success-box { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 20px 0; }
                .success-box p { margin: 0; color: #155724; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 New User Joined via Your Referral!</h1>
                </div>
                
                <div class="content">
                  <p>Hello ${distributer.name},</p>
                  
                  <p>Great news! A new user has successfully registered using your referral code and is now associated with your account.</p>
                  
                  <div class="success-box">
                    <p><strong>✅ Success:</strong> This user will now appear in your doctors list and you can manage them from your dashboard.</p>
                  </div>
                  
                  <div class="user-info">
                    <h3>👤 New User Information</h3>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                    ${user.doctorType ? `<p><strong>Specialization:</strong> ${user.doctorType}</p>` : ""}
                    ${user.experience ? `<p><strong>Experience:</strong> ${user.experience}</p>` : ""}
                    <p><strong>Location:</strong> ${user.city ? `${user.city}, ${user.state || ""}` : "Not specified"}</p>
                    <p><strong>Mobile:</strong> ${user.mobile || "Not provided"}</p>
                    <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <p>You can view and manage this user from your dashboard under the "Doctors" section.</p>
                </div>
                
                <div class="footer">
                  <p>This is an automated notification from the Patient Management System.</p>
                  <p>Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail({
            to: distributer.email,
            subject: `New User Joined via Your Referral: ${user.name}`,
            html: distributerNotificationHtml,
          });
        }
      } catch (error) {
        console.error("Failed to send email to distributor:", error);
        // Don't fail the verification if distributor email fails
      }
    }

    // Send notification email to all admins (always, for all user registrations)
    try {
      const admins = await User.find(
        { role: { $in: ["admin", "super-admin"] } },
        "email name",
      ).lean();
      const adminEmails = admins.map((admin) => admin.email).filter(Boolean);

      if (adminEmails.length > 0) {
        const adminNotificationHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New User Registration</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { margin-bottom: 30px; }
              .user-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
              .user-info h3 { margin: 0 0 15px 0; color: #28a745; font-size: 18px; }
              .user-info p { margin: 5px 0; }
              .referral-info { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0; }
              .referral-info p { margin: 5px 0; color: #0c5460; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>👤 New User Registration</h1>
              </div>
              
              <div class="content">
                <p>Hello Admin,</p>
                
                <p>A new user has successfully registered on the platform and requires your attention.</p>
                
                <div class="user-info">
                  <h3>👤 User Information</h3>
                  <p><strong>Name:</strong> ${user.name}</p>
                  <p><strong>Email:</strong> ${user.email}</p>
                  <p><strong>Role:</strong> ${user.role}</p>
                  ${user.doctorType ? `<p><strong>Specialization:</strong> ${user.doctorType}</p>` : ""}
                  ${user.experience ? `<p><strong>Experience:</strong> ${user.experience}</p>` : ""}
                  <p><strong>Location:</strong> ${user.city ? `${user.city}, ${user.state || ""}` : "Not specified"}</p>
                  <p><strong>Mobile:</strong> ${user.mobile || "Not provided"}</p>
                  <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                ${
                  user.distributerId
                    ? `
                <div class="referral-info">
                  <p><strong>📋 Referral Information:</strong></p>
                  <p>This user registered using a referral code and is associated with a distributor.</p>
                </div>
                `
                    : ""
                }
                
                <p>Please review the user's profile and take any necessary administrative actions.</p>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from the Patient Management System.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: adminEmails,
          subject: `New User Registration: ${user.name} (${user.role})`,
          html: adminNotificationHtml,
        });
      }
    } catch (error) {
      console.error("Failed to send email to admins:", error);
      // Don't fail the verification if admin email fails
    }

    // Note: OTP document already deleted after user creation (line 74)

    // Return response without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
      country: user.country,
      state: user.state,
      city: user.city,
      experience: user.experience,
      doctorType: user.doctorType,
      address: user.address,
      role: user.role,
      profilePicture: user.profilePicture,
    };

    return NextResponse.json(
      {
        message: "Email verified successfully! Welcome to our platform.",
        user: userResponse,
        token,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleError(error);
  }
}

// Resend OTP endpoint
export async function PUT(req) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError("User already exists", 400);
    }

    // Generate new OTP
    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpDoc = new OTP({
      email,
      otp,
    });

    await otpDoc.save();

    // Send OTP email
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
          .otp-container { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea; text-align: center; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
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
            <p>Hello,</p>
            
            <p>Here's your new verification code to complete your registration:</p>
            
            <div class="otp-container">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">Your Verification Code</h3>
              <div class="otp-code">${otpDoc.otp}</div>
              <p style="margin: 0; color: #666;">This code will expire in 10 minutes</p>
            </div>
            
            <div class="security-note">
              <p><strong>🔒 Security Note:</strong> This verification code is valid for 10 minutes only. If you didn't request this code, please ignore this email.</p>
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
      to: email,
      subject: `Verify Your Email - ${otpDoc.otp}`,
      html: otpEmailHtml,
    });

    return NextResponse.json(
      {
        message: "OTP sent successfully. Please check your email.",
      },
      { status: 200 },
    );
  } catch (error) {
    return handleError(error);
  }
}
