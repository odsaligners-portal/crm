import { NextResponse } from "next/server";
import { handleError, AppError } from "../../utils/errorHandler";
import connectDB from "../../config/db";
import User from "../../models/User";
import jwt from "jsonwebtoken";
import { verifyAuth } from "../../middleware/authMiddleware";

export async function GET(req) {
  try {
    await connectDB();

    // If query param role=doctor, return all doctors
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const id = searchParams.get("id");
    const otherAdmins = searchParams.get("otherAdmins");
    if (role === "doctor" || role === "planner") {
      const search = searchParams.get("search");
      let query = { role: role };
      if (search) {
        query = {
          ...query,
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        };
      }
      const users = await User.find(query);

      if (role === "doctor") {
        return NextResponse.json({ doctors: users });
      } else if (role === "planner") {
        return NextResponse.json({ planners: users });
      }
    }
    if (otherAdmins === "true") {
      const superAdminId = process.env.SUPER_ADMIN_ID;
      const admins = await User.find({
        role: "admin",
        _id: { $ne: superAdminId },
      }).select(
        "id name email userDeleteAccess eventUpdateAccess commentUpdateAccess caseCategoryUpdateAccess changeDoctorPasswordAccess priceUpdateAccess addSalesPersonAccess distributerAccess plannerAccess specialCommentAccess",
      );
      return NextResponse.json({ admins });
    }
    if (id) {
      const user = await User.findById(id).select("name role");
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({
        user: { id: user._id, name: user.name, role: user.role },
      });
    }

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
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if account is suspended (only for doctors, not admins)
    if (user.role === "doctor" && user.isSuspended) {
      return NextResponse.json(
        {
          error:
            "Your account has been suspended. Please contact the administrator for assistance.",
          isSuspended: true,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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
        specialCommentAccess: user.specialCommentAccess,
        mobile: user.mobile,
        gender: user.gender,
        country: user.country,
        state: user.state,
        city: user.city,
        experience: user.experience,
        doctorType: user.doctorType,
        address: user.address,
        distributerId: user.distributerId,
        isSuspended: user.isSuspended,
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

    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user = authResult.user;

    // Get request body
    const body = await req.json();

    // Allow updating all fields provided in the body
    const updateData = { ...body };

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
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
        role: updatedUser.role,
        mobile: updatedUser.mobile,
        gender: updatedUser.gender,
        country: updatedUser.country,
        state: updatedUser.state,
        city: updatedUser.city,
        experience: updatedUser.experience,
        doctorType: updatedUser.doctorType,
        address: updatedUser.address,
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
