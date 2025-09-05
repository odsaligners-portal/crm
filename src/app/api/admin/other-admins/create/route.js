import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import { NextResponse } from "next/server";
import connectDB from "../../../config/db";
import User from "../../../models/User";
import { AppError, handleError } from "../../../utils/errorHandler";

export async function POST(req) {
  try {
    await connectDB();

    // Authenticate and check super admin
    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const superAdminId = process.env.SUPER_ADMIN_ID;
    if (authResult.user.id !== superAdminId) {
      return NextResponse.json(
        { message: "Only super admin can create admins" },
        { status: 403 },
      );
    }

    const body = await req.json();
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
    const role = allowedRoles.includes(body.role) ? body.role : "admin";
    const newUser = new User({
      ...body,
      role,
    });
    await newUser.save();

    // Exclude password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json(
      {
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
