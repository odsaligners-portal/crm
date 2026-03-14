import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import connectDB from "../../config/db";
import User from "../../models/User";
import { handleError, AppError } from "../../utils/errorHandler";
import Distributer from "../../models/Distributer";

export async function POST(req) {
  try {
    await connectDB();

    const { email, password, distributer } = await req.json();

    if (!email || !password) {
      throw new AppError("Please provide email and password", 400);
    }
    let user;
    if (!distributer) {
      user = await User.findOne({ email }).select("+password");
    } else {
      user = await Distributer.findOne({ email }).select("+password");
    }

    // Find user with password field

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    // Check if account is suspended (only for doctors)
    if (!distributer && user.role === "doctor" && user.isSuspended) {
      // If both suspended and under maintenance, show the maintenance modal instead
      if (user.underMaintenance) {
        return NextResponse.json(
          {
            error:
              "The portal is currently under maintenance. Please try again later or contact the administrator.",
            isUnderMaintenance: true,
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          error:
            "Your account has been suspended. Please contact the administrator for assistance.",
          isSuspended: true,
        },
        { status: 403 },
      );
    }

    // Check if distributor account is inactive
    if (distributer && user.isActive === false) {
      return NextResponse.json(
        {
          error:
            "Your account is currently inactive. Please contact the administrator to reactivate your account.",
          isSuspended: true,
        },
        { status: 403 },
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "30d" },
    );

    // Return response without password
    const response = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
