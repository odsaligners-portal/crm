import dbConnect from "@/app/api/config/db";
import { admin, verifyAuth } from "@/app/api/middleware/authMiddleware";
import CaseCategory from "@/app/api/models/CaseCategory";
import { NextResponse } from "next/server";

// GET - Fetch all case categories or fetch one by ID
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const active = searchParams.get("active");
    const distributerId = searchParams.get("distributerId");
    const categoryType = searchParams.get("categoryType");
    let query = {};

    if (id) {
      query._id = id;
    } else if (category) {
      query.category = category;
    }

    // Build base query with active filter
    const activeFilter = active !== null ? { active: active === "true" } : {};

    // Apply filters based on parameters
    if (distributerId === "default") {
      // Doctor with no distributor: Return only default categories
      query = {
        ...activeFilter,
        categoryType: "default",
        distributerId: null,
      };
    } else if (distributerId && distributerId !== "") {
      // Doctor with distributor assigned: Filter by distributor ID
      // First, check if the distributor has any specific categories
      const distributerSpecificCount = await CaseCategory.countDocuments({
        distributerId: distributerId,
        categoryType: "distributor-specific",
        ...activeFilter,
      });

      if (distributerSpecificCount > 0) {
        // Distributor has specific categories, include both distributor-specific and defaults
        query = {
          ...activeFilter,
          $or: [
            {
              distributerId: distributerId,
              categoryType: "distributor-specific",
            },
          ],
        };
      } else {
        // Distributor has no specific categories, only return defaults
        query = {
          ...activeFilter,
          categoryType: "default",
          distributerId: null,
        };
      }
    } else {
      // Admin frontend (no distributerId parameter): Return all categories
      query = {
        ...activeFilter,
      };
    }

    // Filter by category type if specified (this overrides distributor logic)
    if (categoryType) {
      query.categoryType = categoryType;
    }

    const categories = await CaseCategory.find(query)
      .populate("distributerId", "name email")
      .sort({
        categoryType: 1,
        category: 1,
      });

    // If fetching by ID, return single object, otherwise return array
    const data = id ? categories[0] || null : categories;

    return NextResponse.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : data ? 1 : 0,
    });
  } catch (error) {
    console.error("Error fetching case categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch case categories" },
      { status: 500 },
    );
  }
}

// POST - Add a new case category
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
    console.log(user);
    // Check if user has caseCategoryUpdateAccess
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You do not have permission to create case categories.",
        },
        { status: 403 },
      );
    }

    await dbConnect();

    const body = await request.json();

    // Validate required fields
    if (!body.category || !body.plans || body.plans.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Category and at least one plan are required",
        },
        { status: 400 },
      );
    }

    // Validate category type
    if (
      body.categoryType &&
      !["default", "distributor-specific"].includes(body.categoryType)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid category type. Must be "default" or "distributor-specific"',
        },
        { status: 400 },
      );
    }

    // Validate distributerId for distributor-specific categories
    if (body.categoryType === "distributor-specific" && !body.distributerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Distributor is required for distributor-specific categories",
        },
        { status: 400 },
      );
    }

    // Validate plans structure
    for (const plan of body.plans) {
      if (!plan.label || !plan.value) {
        return NextResponse.json(
          { success: false, message: "Each plan must have label and value" },
          { status: 400 },
        );
      }
    }

    // Clean up the body data
    const categoryData = { ...body };

    // For default categories, remove or set distributerId to null
    if (categoryData.categoryType === "default") {
      delete categoryData.distributerId; // Remove the field entirely
    } else if (
      !categoryData.distributerId ||
      categoryData.distributerId === ""
    ) {
      // For distributor-specific categories, ensure distributerId is not empty
      return NextResponse.json(
        {
          success: false,
          message:
            "Distributor is required for distributor-specific categories",
        },
        { status: 400 },
      );
    }

    const category = new CaseCategory(categoryData);
    await category.save();

    return NextResponse.json({
      success: true,
      message: "Case category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating case category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create case category" },
      { status: 500 },
    );
  }
}

// PUT - Update a case category
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

    // Check if user has caseCategoryUpdateAccess
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You do not have permission to update case categories.",
        },
        { status: 403 },
      );
    }

    await dbConnect();

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Category ID is required for update" },
        { status: 400 },
      );
    }

    // Validate plans structure if provided
    if (updateData.plans) {
      for (const plan of updateData.plans) {
        if (!plan.label || !plan.value) {
          return NextResponse.json(
            { success: false, message: "Each plan must have label and value" },
            { status: 400 },
          );
        }
      }
    }

    // Clean up the update data
    if (updateData.categoryType === "default") {
      // For default categories, remove distributerId
      updateData.distributerId = null;
    } else if (
      updateData.categoryType === "distributor-specific" &&
      (!updateData.distributerId || updateData.distributerId === "")
    ) {
      // For distributor-specific categories, ensure distributerId is not empty
      return NextResponse.json(
        {
          success: false,
          message:
            "Distributor is required for distributor-specific categories",
        },
        { status: 400 },
      );
    }

    const category = await CaseCategory.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Case category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Case category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error updating case category:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "A case category with this name already exists.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to update case category" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a case category
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
    // Check if user has caseCategoryUpdateAccess
    if (!user.caseCategoryUpdateAccess) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You do not have permission to delete case categories.",
        },
        { status: 403 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Category ID is required" },
        { status: 400 },
      );
    }

    const category = await CaseCategory.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Case category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Case category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting case category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete case category" },
      { status: 500 },
    );
  }
}
