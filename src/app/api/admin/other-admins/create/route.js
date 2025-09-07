import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import { NextResponse } from "next/server";
import connectDB from "../../../config/db";
import User from "../../../models/User";
import { AppError, handleError } from "../../../utils/errorHandler";

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
