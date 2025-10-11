import dbConnect from "@/app/api/config/db";
import { admin, verifyAuth } from "@/app/api/middleware/authMiddleware";
import PrivacyPolicy from "@/app/api/models/PrivacyPolicy";
import { NextResponse } from "next/server";

// GET - Fetch all privacy policies or fetch one by ID or distributerId
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const distributerId = searchParams.get("distributerId");
    const active = searchParams.get("active");

    let query = {};

    if (id) {
      query._id = id;
    } else if (distributerId) {
      query.distributerId = distributerId;
    }

    if (active !== null && active !== undefined) {
      query.active = active === "true";
    }

    const policies = await PrivacyPolicy.find(query)
      .populate("distributerId", "name email")
      .populate("lastUpdatedBy", "name email")
      .sort({ createdAt: -1 });

    // If fetching by ID or distributerId, return single object, otherwise return array
    const data = id || distributerId ? policies[0] || null : policies;

    return NextResponse.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : data ? 1 : 0,
    });
  } catch (error) {
    console.error("Error fetching privacy policies:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch privacy policies" },
      { status: 500 },
    );
  }
}

// POST - Create a new privacy policy
export async function POST(request) {
  try {
    // Use admin middleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.error || "Authentication required",
        },
        { status: 401 },
      );
    }
    const user = authResult.user;

    // Check if user has distributerUpdateAccess
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You do not have permission to create privacy policies.",
        },
        { status: 403 },
      );
    }

    await dbConnect();

    const body = await request.json();

    // Validate required fields
    if (!body.distributerId || !body.content) {
      return NextResponse.json(
        {
          success: false,
          message: "Distributor ID and content are required",
        },
        { status: 400 },
      );
    }

    // Check if privacy policy already exists for this distributor
    const existingPolicy = await PrivacyPolicy.findOne({
      distributerId: body.distributerId,
    });

    if (existingPolicy) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Privacy policy already exists for this distributor. Please update the existing one.",
        },
        { status: 409 },
      );
    }

    // Add lastUpdatedBy field
    const policyData = {
      ...body,
      lastUpdatedBy: user._id,
    };

    const policy = new PrivacyPolicy(policyData);
    await policy.save();

    // Populate fields before returning
    await policy.populate("distributerId", "name email");
    await policy.populate("lastUpdatedBy", "name email");

    return NextResponse.json({
      success: true,
      message: "Privacy policy created successfully",
      data: policy,
    });
  } catch (error) {
    console.error("Error creating privacy policy:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Privacy policy already exists for this distributor",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create privacy policy" },
      { status: 500 },
    );
  }
}

// PUT - Update a privacy policy
export async function PUT(request) {
  try {
    // Use admin middleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || "Invalid token" },
        { status: 401 },
      );
    }
    const user = authResult.user;

    // Check if user has distributerUpdateAccess
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You do not have permission to update privacy policies.",
        },
        { status: 403 },
      );
    }

    await dbConnect();

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Policy ID is required for update" },
        { status: 400 },
      );
    }

    // Add lastUpdatedBy field
    updateData.lastUpdatedBy = user._id;

    const policy = await PrivacyPolicy.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("distributerId", "name email")
      .populate("lastUpdatedBy", "name email");

    if (!policy) {
      return NextResponse.json(
        { success: false, message: "Privacy policy not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Privacy policy updated successfully",
      data: policy,
    });
  } catch (error) {
    console.error("Error updating privacy policy:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Privacy policy already exists for this distributor.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update privacy policy" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a privacy policy
export async function DELETE(request) {
  try {
    // Use admin middleware
    const authResult = await admin(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.error || "Authentication required",
        },
        { status: 401 },
      );
    }
    const user = authResult.user;

    // Check if user has distributerUpdateAccess
    if (!user.distributerUpdateAccess) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You do not have permission to delete privacy policies.",
        },
        { status: 403 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Policy ID is required" },
        { status: 400 },
      );
    }

    const policy = await PrivacyPolicy.findByIdAndDelete(id);

    if (!policy) {
      return NextResponse.json(
        { success: false, message: "Privacy policy not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Privacy policy deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting privacy policy:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete privacy policy" },
      { status: 500 },
    );
  }
}
