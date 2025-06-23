import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import CaseCategory from '@/app/api/models/CaseCategory';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

// GET - Fetch all case categories or fetch one by ID
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const active = searchParams.get('active');
    
    let query = {};
    if (id) {
      query._id = id;
    } else if (category) {
      query.category = category;
    }
    
    if (active !== null) {
      query.active = active === 'true';
    }
    
    const categories = await CaseCategory.find(query).sort({ category: 1 });
    
    // If fetching by ID, return single object, otherwise return array
    const data = id ? categories[0] || null : categories;
    
    return NextResponse.json({
      success: true,
      data: data,
      count: Array.isArray(data) ? data.length : (data ? 1 : 0)
    });
  } catch (error) {
    console.error('Error fetching case categories:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch case categories' },
      { status: 500 }
    );
  }
}

// POST - Add a new case category
export async function POST(request) {
  try {
    //Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { user: decoded } = authResult;
    
    // Check if user is an admin
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Only admins can create case categories.' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.category || !body.plans || body.plans.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Category and at least one plan are required' },
        { status: 400 }
      );
    }
    
    // Validate plans structure
    for (const plan of body.plans) {
      if (!plan.label || !plan.value) {
        return NextResponse.json(
          { success: false, message: 'Each plan must have label and value' },
          { status: 400 }
        );
      }
    }
    
    // Check if category already exists
    const existingCategory = await CaseCategory.findOne({ category: body.category });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Case category already exists' },
        { status: 409 }
      );
    }
    
    const category = new CaseCategory(body);
    await category.save();
    
    return NextResponse.json({
      success: true,
      message: 'Case category added successfully',
      data: category
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding case category:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'A case category with this name already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to add case category' },
      { status: 500 }
    );
  }
}

// PUT - Update a case category
export async function PUT(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Invalid token' },
        { status: 401 }
      );
    }

    const { user: decoded } = authResult;

    // Check if user is an admin
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Only admins can update case categories.' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required for update' },
        { status: 400 }
      );
    }
    
    // Validate plans structure if provided
    if (updateData.plans) {
      for (const plan of updateData.plans) {
        if (!plan.label || !plan.value) {
          return NextResponse.json(
            { success: false, message: 'Each plan must have label and value' },
            { status: 400 }
          );
        }
      }
    }
    
    const category = await CaseCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Case category not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Case category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating case category:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'A case category with this name already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update case category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a case category
export async function DELETE(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { user: decoded } = authResult;

    // Check if user is an admin
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Only admins can delete case categories.' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    const category = await CaseCategory.findByIdAndDelete(id);
    
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Case category not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Case category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting case category:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete case category' },
      { status: 500 }
    );
  }
}