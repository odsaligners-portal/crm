import connectDB from "@/app/api/config/db";
import Distributer from "@/app/api/models/Distributer";
import User from "@/app/api/models/User";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import { sendEmail } from "@/app/api/utils/mailer";

// Access control helper
async function verifyAdminWithDistributerAccess(request) {
  const authResult = await verifyAuth(request);

  if (!authResult.success || authResult.user.role !== "admin") {
    return { success: false, message: "Unauthorized", status: 401 };
  }

  const user = await User.findById(authResult.user.id);

  if (!user || !user.distributerAccess) {
    return {
      success: false,
      message: "You do not have access to manage distributers",
      status: 403,
    };
  }

  return { success: true, user };
}

// GET all distributers with optional search, pagination OR get single by ID
export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  // If ID is provided, fetch single distributor
  if (id) {
    try {
      const distributer = await Distributer.findById(id).select("-password");

      if (!distributer) {
        return NextResponse.json(
          { error: "Distributor not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        distributer: {
          id: distributer._id,
          name: distributer.name,
          email: distributer.email,
          mobile: distributer.mobile,
          city: distributer.city,
          state: distributer.state,
          country: distributer.country,
          access: distributer.access,
          role: distributer.role,
          logo: distributer.logo || { url: "", fileKey: "", uploadedAt: null },
          createdAt: distributer.createdAt,
          updatedAt: distributer.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error fetching distributor:", error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch distributor" },
        { status: 500 },
      );
    }
  }

  // Otherwise, fetch list with pagination
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;
  const search = searchParams.get("search") || "";

  const query = search ? { name: { $regex: search, $options: "i" } } : {};

  const totalDistributers = await Distributer.countDocuments(query);

  const distributers = await Distributer.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  return NextResponse.json({
    distributers,
    pagination: {
      totalDistributers,
      totalPages: Math.ceil(totalDistributers / limit),
    },
  });
}

// Create a new distributer (Admin + Access Required)
export async function POST(req) {
  await connectDB();

  const auth = await verifyAdminWithDistributerAccess(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = await req.json();
  const distributer = new Distributer(body);
  await distributer.save();

  // Send welcome email notifications
  try {
    const adminUser = await User.findById(auth.user._id)
      .select("name email")
      .lean();

    // Send welcome email to the newly created distributer
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
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { margin-bottom: 30px; }
          .welcome-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b; }
          .welcome-box h3 { margin: 0 0 15px 0; color: #ff6b6b; font-size: 18px; }
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
            <p>Dear ${distributer.name},</p>
            
            <p>Welcome to the Patient Management System! Your distributer account has been created successfully.</p>
            
            <div class="welcome-box">
              <h3>👤 Your Account Details</h3>
              <p><strong>Name:</strong> ${distributer.name}</p>
              <p><strong>Email:</strong> ${distributer.email}</p>
              <p><strong>Mobile:</strong> ${distributer.mobile}</p>
              <p><strong>Role:</strong> Distributer</p>
              <p><strong>Access Level:</strong> ${distributer.access === "full" ? "Full Access" : "View Only"}</p>
              <p><strong>Location:</strong> ${distributer.city}, ${distributer.state}, ${distributer.country}</p>
              <p><strong>Created Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="credentials">
              <h3>🔐 Login Credentials</h3>
              <p>You can use the following credentials to log in to the system:</p>
              <div class="credential-item">
                <strong>Email:</strong> ${distributer.email}
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
      to: distributer.email,
      subject:
        "Welcome to Patient Management System - Distributer Account Created",
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
          <title>New Distributer Created</title>
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
              <h1>👥 New Distributer Created</h1>
            </div>
            
            <div class="content">
              <p>Hello Admin,</p>
              
              <p>A new distributer has been added to the system.</p>
              
              <div class="user-info">
                <h3>👤 Distributer Information</h3>
                <p><strong>Name:</strong> ${distributer.name}</p>
                <p><strong>Email:</strong> ${distributer.email}</p>
                <p><strong>Mobile:</strong> ${distributer.mobile}</p>
                <p><strong>Role:</strong> Distributer</p>
                <p><strong>Access Level:</strong> ${distributer.access === "full" ? "Full Access" : "View Only"}</p>
                <p><strong>Location:</strong> ${distributer.city}, ${distributer.state}, ${distributer.country}</p>
                <p><strong>Created Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="creator-info">
                <h3>👨‍💼 Created By</h3>
                <p><strong>Admin Name:</strong> ${adminUser?.name || "System Admin"}</p>
                <p><strong>Admin Email:</strong> ${adminUser?.email || "N/A"}</p>
              </div>
              
              <p>The new distributer has been sent a welcome email with their login credentials.</p>
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
        subject: `New Distributer Created: ${distributer.name}`,
        html: adminNotificationHtml,
      });
    }
  } catch (emailError) {
    console.error("Error sending distributer creation emails:", emailError);
    // Don't fail the creation if email fails
  }

  return NextResponse.json(
    { message: "Distributer created successfully" },
    { status: 201 },
  );
}

// Delete distributer (Admin + Access Required)
export async function DELETE(req) {
  await connectDB();

  const auth = await verifyAdminWithDistributerAccess(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await Distributer.findByIdAndDelete(body.id);

  return NextResponse.json({ message: "Distributer deleted successfully" });
}

// Update distributer (Admin + Access Required)
export async function PUT(req) {
  await connectDB();

  const auth = await verifyAdminWithDistributerAccess(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await Distributer.findByIdAndUpdate(body.id, body, { new: true });

  return NextResponse.json({ message: "Distributer updated successfully" });
}
