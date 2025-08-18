import dbConnect from "@/app/api/config/db";
import { admin } from "@/app/api/middleware/authMiddleware";
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
    const country = searchParams.get("country");
    const categoryType = searchParams.get("categoryType");
    let query = {};
    if (id) {
      query._id = id;
    } else if (category) {
      query.category = category;
    }

    if (active !== null) {
      query.active = active === "true";
    }

    // Filter by country if specified
    if (country) {
      // First, check if the country has any specific categories
      const countrySpecificCount = await CaseCategory.countDocuments({
        country: country,
        active: active === "true",
      });

      if (countrySpecificCount > 0) {
        // Country has specific categories, include both country-specific and defaults
        query.$or = [{ country: country }];
      } else {
        // Country has no specific categories, only return defaults
        query.categoryType = "default";
      }
    }

    // Filter by category type if specified
    if (categoryType) {
      query.categoryType = categoryType;
    }


    const categories = await CaseCategory.find(query).sort({
      categoryType: 1,
      country: 1,
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
      !["default", "country-specific"].includes(body.categoryType)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid category type. Must be "default" or "country-specific"',
        },
        { status: 400 },
      );
    }

    // Validate country for country-specific categories
    if (body.categoryType === "country-specific" && !body.country) {
      return NextResponse.json(
        {
          success: false,
          message: "Country is required for country-specific categories",
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

    // Check if category already exists for the same country/type
    let existingQuery = { category: body.category };
    if (body.categoryType === "country-specific") {
      existingQuery.country = body.country;
    } else {
      existingQuery.categoryType = "default";
    }

    const existingCategory = await CaseCategory.findOne(existingQuery);
    if (existingCategory) {
      const message =
        body.categoryType === "country-specific"
          ? `Case category "${body.category}" already exists for country "${body.country}"`
          : `Default case category "${body.category}" already exists`;
      return NextResponse.json({ success: false, message }, { status: 409 });
    }

    const category = new CaseCategory(body);
    await category.save();

    return NextResponse.json({
      success: true,
      message: "Case category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating case category:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Case category already exists for this country/type",
        },
        { status: 409 },
      );
    }

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
    const authResult = await admin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || "Invalid token" },
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
