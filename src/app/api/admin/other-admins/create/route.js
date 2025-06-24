import { NextResponse } from 'next/server';
import { handleError, AppError } from '../../../utils/errorHandler';
import connectDB from '../../../config/db';
import User from '../../../models/User';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await connectDB();

    // Authenticate and check super admin
    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const superAdminId = process.env.SUPER_ADMIN_ID;
    if (authResult.user.id !== superAdminId) {
      return NextResponse.json({ message: 'Only super admin can create admins' }, { status: 403 });
    }

    const body = await req.json();
    const requiredFields = ['name', 'email', 'password'];
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new AppError(`${field} is required`, 400);
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Create new admin user
    const newUser = new User({
      ...body,
      role: 'admin',
    });
    await newUser.save();

    // Exclude password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json({ message: 'Admin created successfully' }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
} 