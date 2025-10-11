import dbConnect from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import DeadlineTime from "@/app/api/models/DeadlineTime";
import { NextResponse } from "next/server";

// GET - Fetch the deadline time (only one record should exist)
export async function GET() {
  try {
    await dbConnect();

    // Fetch the single deadline time record
    const deadlineTime = await DeadlineTime.findOne()
      .populate("lastUpdatedBy", "name email")
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      data: deadlineTime,
    });
  } catch (error) {
    console.error("Error fetching deadline time:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch deadline time" },
      { status: 500 },
    );
  }
}

// PUT - Update or create the deadline time
export async function PUT(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || "Invalid token" },
        { status: 401 },
      );
    }
    const decodedUser = authResult.user;

    await dbConnect();

    // Fetch full user from database to check permissions and get _id
    const User = (await import("@/app/api/models/User")).default;
    const user = await User.findById(decodedUser.id).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // Check if user has plannerAccess
    if (user.role !== "admin" || !user.plannerAccess) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to update deadline time.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { days, hours, minutes } = body;

    // Validate that at least one field is provided
    if (days === undefined && hours === undefined && minutes === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one of days, hours, or minutes is required",
        },
        { status: 400 },
      );
    }

    // Set defaults if not provided
    const finalDays = days !== undefined ? Number(days) : 0;
    const finalHours = hours !== undefined ? Number(hours) : 0;
    const finalMinutes = minutes !== undefined ? Number(minutes) : 0;

    // Validate ranges
    if (finalDays < 0) {
      return NextResponse.json(
        { success: false, message: "Days cannot be negative" },
        { status: 400 },
      );
    }
    if (finalHours < 0 || finalHours > 23) {
      return NextResponse.json(
        { success: false, message: "Hours must be between 0 and 23" },
        { status: 400 },
      );
    }
    if (finalMinutes < 0 || finalMinutes > 59) {
      return NextResponse.json(
        { success: false, message: "Minutes must be between 0 and 59" },
        { status: 400 },
      );
    }

    // Check that at least some time is set
    if (finalDays === 0 && finalHours === 0 && finalMinutes === 0) {
      return NextResponse.json(
        { success: false, message: "Deadline must be greater than 0" },
        { status: 400 },
      );
    }

    // Find existing deadline time or create new one
    let deadlineTime = await DeadlineTime.findOne();

    if (deadlineTime) {
      // Update existing
      deadlineTime.days = finalDays;
      deadlineTime.hours = finalHours;
      deadlineTime.minutes = finalMinutes;
      deadlineTime.lastUpdatedBy = user._id;
      await deadlineTime.save();
    } else {
      // Create new
      deadlineTime = new DeadlineTime({
        days: finalDays,
        hours: finalHours,
        minutes: finalMinutes,
        lastUpdatedBy: user._id,
      });
      await deadlineTime.save();
    }

    // Populate before returning
    await deadlineTime.populate("lastUpdatedBy", "name email");

    return NextResponse.json({
      success: true,
      message: "Deadline time updated successfully",
      data: deadlineTime,
    });
  } catch (error) {
    console.error("Error updating deadline time:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update deadline time" },
      { status: 500 },
    );
  }
}
