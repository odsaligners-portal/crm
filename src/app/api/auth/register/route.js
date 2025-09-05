import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import connectDB from "../../config/db";
import User from "../../models/User";
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
      profilePicture,
    } = await req.json();

    if (!name || !email || !password) {
      throw new AppError("Please provide all required fields", 400);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("User already exists", 400);
    }

    // Create user with all fields
    const user = await User.create({
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
      ...(profilePicture ? { profilePicture } : {}),
    });

    // Generate JWT
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
                  <p><strong>Password:</strong> ${password}</p>
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
                
                <p>Your account has been successfully created and is ready to use. You can now log in and start managing your patients right away.</p>
                
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

        // Send notification email to all admins
        try {
          const admins = await User.find(
            { role: "admin" },
            "email name",
          ).lean();
          const adminEmails = admins
            .map((admin) => admin.email)
            .filter(Boolean);

          if (adminEmails.length > 0) {
            const adminNotificationHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Doctor Registration</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
                  .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                  .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
                  .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                  .content { margin-bottom: 30px; }
                  .doctor-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
                  .doctor-info h3 { margin: 0 0 15px 0; color: #28a745; font-size: 18px; }
                  .doctor-info p { margin: 5px 0; }
                  .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
                  .cta-button { display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                  .cta-button:hover { opacity: 0.9; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>👨‍⚕️ New Doctor Registration</h1>
                  </div>
                  
                  <div class="content">
                    <p>Hello Admin,</p>
                    
                    <p>A new doctor has successfully registered on the platform and requires your attention.</p>
                    
                    <div class="doctor-info">
                      <h3>👤 Doctor Information</h3>
                      <p><strong>Name:</strong> Dr. ${user.name}</p>
                      <p><strong>Email:</strong> ${user.email}</p>
                      <p><strong>Specialization:</strong> ${user.doctorType || "Not specified"}</p>
                      <p><strong>Experience:</strong> ${user.experience || "Not specified"}</p>
                      <p><strong>Location:</strong> ${user.city ? `${user.city}, ${user.state}` : "Not specified"}</p>
                      <p><strong>Mobile:</strong> ${user.mobile || "Not provided"}</p>
                      <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <p>Please review the doctor's profile and take any necessary administrative actions.</p>
                    
                   
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
              subject: `New Doctor Registration: Dr. ${user.name}`,
              html: adminNotificationHtml,
            });
          }
        } catch (adminEmailError) {
          console.error(
            "Error sending admin notification email:",
            adminEmailError,
          );
          // Don't fail the registration if admin email fails
        }
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail the registration if email fails
      }
    }

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
        user: userResponse,
        token,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
