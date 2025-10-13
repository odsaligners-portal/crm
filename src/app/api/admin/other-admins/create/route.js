import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import { NextResponse } from "next/server";
import connectDB from "../../../config/db";
import User from "../../../models/User";
import { AppError, handleError } from "../../../utils/errorHandler";
import { sendEmail } from "../../../utils/mailer";

export async function POST(req) {
  try {
    await connectDB();

    // Authenticate user
    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const role = body.role;

    // If role is planner, check if user has planner access
    if (role === "planner") {
      // Fetch user data to check permissions
      const userData = await User.findById(authResult.user.id);
      if (!userData) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 },
        );
      }

      if (!userData.plannerAccess) {
        return NextResponse.json(
          { message: "You don't have permission to create planners" },
          { status: 403 },
        );
      }
    } else {
      // For other roles (admin, distributer), check super admin access
      const superAdminId = process.env.SUPER_ADMIN_ID;
      if (authResult.user.id !== superAdminId) {
        return NextResponse.json(
          { message: "Only super admin can create admins" },
          { status: 403 },
        );
      }
    }
    const requiredFields = ["name", "email", "password"];
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new AppError(`${field} is required`, 400);
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Create new admin or planner user
    const allowedRoles = ["admin", "planner", "distributer"];
    const userRole = allowedRoles.includes(body.role) ? body.role : "admin";
    const newUser = new User({
      ...body,
      role: userRole,
    });
    await newUser.save();

    // Exclude password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    // Send welcome email notifications
    try {
      const adminUser = await User.findById(authResult.user.id)
        .select("name email")
        .lean();

      // Send welcome email to the newly created planner/distributer
      const roleDisplayName =
        userRole === "planner"
          ? "Planner"
          : userRole === "distributer"
            ? "Distributer"
            : "Admin";

      const welcomeEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Patient Management System</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { margin-bottom: 30px; }
            .welcome-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .welcome-box h3 { margin: 0 0 15px 0; color: #667eea; font-size: 18px; }
            .welcome-box p { margin: 5px 0; }
            .credentials { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credentials h3 { margin: 0 0 15px 0; color: #495057; font-size: 16px; }
            .credentials p { margin: 10px 0; }
            .credential-item { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: monospace; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
            .note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Patient Management System</h1>
            </div>
            
            <div class="content">
              <p>Dear ${newUser.name},</p>
              
              <p>Welcome to the Patient Management System! Your account has been created successfully as a <strong>${roleDisplayName}</strong>.</p>
              
              <div class="welcome-box">
                <h3>👤 Your Account Details</h3>
                <p><strong>Name:</strong> ${newUser.name}</p>
                <p><strong>Email:</strong> ${newUser.email}</p>
                <p><strong>Role:</strong> ${roleDisplayName}</p>
                <p><strong>Created Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="credentials">
                <h3>🔐 Login Credentials</h3>
                <p>You can use the following credentials to log in to the system:</p>
                <div class="credential-item">
                  <strong>Email:</strong> ${newUser.email}
                </div>
                <div class="credential-item">
                  <strong>Password:</strong> (The password you were provided)
                </div>
              </div>
              
              <div class="note">
                <strong>⚠️ Important:</strong> Please keep your login credentials secure. We recommend changing your password after your first login.
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact the administrator.</p>
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
        to: newUser.email,
        subject: `Welcome to Patient Management System - ${roleDisplayName} Account Created`,
        html: welcomeEmailHtml,
      });

      // Send notification email to all admins
      const allAdmins = await User.find({ role: "admin" }, "email name").lean();
      const adminEmails = allAdmins.map((admin) => admin.email).filter(Boolean);

      if (adminEmails.length > 0) {
        const adminNotificationHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New ${roleDisplayName} Created</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { margin-bottom: 30px; }
              .user-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
              .user-info h3 { margin: 0 0 15px 0; color: #28a745; font-size: 18px; }
              .user-info p { margin: 5px 0; }
              .creator-info { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .creator-info h3 { margin: 0 0 15px 0; color: #495057; font-size: 16px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>👥 New ${roleDisplayName} Created</h1>
              </div>
              
              <div class="content">
                <p>Hello Admin,</p>
                
                <p>A new ${roleDisplayName.toLowerCase()} has been added to the system.</p>
                
                <div class="user-info">
                  <h3>👤 ${roleDisplayName} Information</h3>
                  <p><strong>Name:</strong> ${newUser.name}</p>
                  <p><strong>Email:</strong> ${newUser.email}</p>
                  <p><strong>Role:</strong> ${roleDisplayName}</p>
                  <p><strong>Created Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="creator-info">
                  <h3>👨‍💼 Created By</h3>
                  <p><strong>Admin Name:</strong> ${adminUser?.name || "System Admin"}</p>
                  <p><strong>Admin Email:</strong> ${adminUser?.email || "N/A"}</p>
                </div>
                
                <p>The new ${roleDisplayName.toLowerCase()} has been sent a welcome email with their login credentials.</p>
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
          subject: `New ${roleDisplayName} Created: ${newUser.name}`,
          html: adminNotificationHtml,
        });
      }
    } catch (emailError) {
      console.error(
        "Error sending planner/distributer creation emails:",
        emailError,
      );
      // Don't fail the creation if email fails
    }

    return NextResponse.json(
      {
        message: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} created successfully`,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
