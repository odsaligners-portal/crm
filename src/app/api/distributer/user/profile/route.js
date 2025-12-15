import connectDB from "@/app/api/config/db";
import Distributer from "@/app/api/models/Distributer";
import { AppError, handleError } from "@/app/api/utils/errorHandler";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    // Get token from authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Not authorized", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
    );

    // Get user data
    const user = await Distributer.findById(decoded.id).select("-password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        oldEmail: user.oldEmail || null,
        role: user.role,
        userDeleteAccess: user.userDeleteAccess,
        eventUpdateAccess: user.eventUpdateAccess,
        commentUpdateAccess: user.commentUpdateAccess,
        caseCategoryUpdateAccess: user.caseCategoryUpdateAccess,
        changeDoctorPasswordAccess: user.changeDoctorPasswordAccess,
        priceUpdateAccess: user.priceUpdateAccess,
        plannerAccess: user.plannerAccess,
        distributerAccess: user.distributerAccess,
        addSalesPersonAccess: user.addSalesPersonAccess,
        mobile: user.mobile,
        gender: user.gender,
        country: user.country,
        state: user.state,
        city: user.city,
        experience: user.experience,
        doctorType: user.doctorType,
        address: user.address,
        logo: user.logo || { url: "", fileKey: "", uploadedAt: null },
        profilePicture: user.profilePicture || {
          url: "",
          fileKey: "",
          uploadedAt: null,
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    // Get token from authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Not authorized", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
    );

    // Get request body
    const body = await req.json();

    // Allow updating all fields provided in the body, but exclude email and oldEmail
    // Email can only be changed through the OTP verification endpoint
    const updateData = { ...body };
    delete updateData.email;
    delete updateData.oldEmail;

    const updatedUser = await Distributer.findByIdAndUpdate(
      decoded.id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    return NextResponse.json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        oldEmail: updatedUser.oldEmail || null,
        role: updatedUser.role,
        mobile: updatedUser.mobile,
        country: updatedUser.country,
        state: updatedUser.state,
        city: updatedUser.city,
        logo: updatedUser.logo || { url: "", fileKey: "", uploadedAt: null },
        profilePicture: updatedUser.profilePicture || {
          url: "",
          fileKey: "",
          uploadedAt: null,
        },
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return handleError(error);
  }
}
