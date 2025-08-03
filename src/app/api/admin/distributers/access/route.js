import dbConnect from '@/app/api/config/db';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import Distributer from '@/app/api/models/Distributer';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

// PUT - Update distributor access permission
export async function PUT(req) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admins to update access permissions
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const body = await req.json();
    const { distributerId, access } = body;

    // Validate required fields
    if (!distributerId || !access) {
      return NextResponse.json(
        { error: 'Distributor ID and access level are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(distributerId)) {
      return NextResponse.json({ error: 'Invalid distributor ID' }, { status: 400 });
    }

    // Validate access level
    const validAccessLevels = ['view', 'full'];
    if (!validAccessLevels.includes(access)) {
      return NextResponse.json(
        { error: `Invalid access level. Must be one of: ${validAccessLevels.join(', ')}` },
        { status: 400 }
      );
    }

    // Find and update the distributor
    const updatedDistributer = await Distributer.findByIdAndUpdate(
      distributerId,
      { $set: { access } },
      { new: true, runValidators: true }
    );

    if (!updatedDistributer) {
      return NextResponse.json(
        { error: 'Distributor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Distributor access updated to '${access}' successfully`,
      distributer: {
        id: updatedDistributer._id,
        name: updatedDistributer.name,
        email: updatedDistributer.email,
        access: updatedDistributer.access,
        updatedAt: updatedDistributer.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating distributor access:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Retrieve distributor access information
export async function GET(req) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admins to view access information
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const distributerId = searchParams.get('distributerId');

    if (!distributerId || !mongoose.Types.ObjectId.isValid(distributerId)) {
      return NextResponse.json({ error: 'Invalid distributor ID' }, { status: 400 });
    }

    const distributer = await Distributer.findById(distributerId)
      .select('_id name email access createdAt updatedAt')
      .lean();

    if (!distributer) {
      return NextResponse.json({ error: 'Distributor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      distributer: {
        id: distributer._id,
        name: distributer.name,
        email: distributer.email,
        access: distributer.access,
        createdAt: distributer.createdAt,
        updatedAt: distributer.updatedAt
      }
    });

  } catch (error) {
    console.error('Error retrieving distributor access:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Bulk update access for multiple distributors
export async function PATCH(req) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admins to bulk update access
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const body = await req.json();
    const { distributerIds, access } = body;

    // Validate required fields
    if (!distributerIds || !Array.isArray(distributerIds) || distributerIds.length === 0) {
      return NextResponse.json(
        { error: 'Distributor IDs array is required' },
        { status: 400 }
      );
    }

    if (!access) {
      return NextResponse.json(
        { error: 'Access level is required' },
        { status: 400 }
      );
    }

    // Validate all distributor IDs
    const invalidIds = distributerIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid distributor IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate access level
    const validAccessLevels = ['view', 'full'];
    if (!validAccessLevels.includes(access)) {
      return NextResponse.json(
        { error: `Invalid access level. Must be one of: ${validAccessLevels.join(', ')}` },
        { status: 400 }
      );
    }

    // Update multiple distributors
    const result = await Distributer.updateMany(
      { _id: { $in: distributerIds } },
      { $set: { access } },
      { runValidators: true }
    );

    // Get updated distributors for response
    const updatedDistributers = await Distributer.find({ _id: { $in: distributerIds } })
      .select('_id name email access updatedAt')
      .lean();

    return NextResponse.json({
      success: true,
      message: `Successfully updated access to '${access}' for ${result.modifiedCount} distributor(s)`,
      data: {
        updatedCount: result.modifiedCount,
        distributors: updatedDistributers
      }
    });

  } catch (error) {
    console.error('Error in bulk distributor access update:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
