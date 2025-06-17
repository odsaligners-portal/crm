import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '../../config/db';
import User from '../../models/User';
import { handleError, AppError } from '../../utils/errorHandler';

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      throw new AppError('Please provide all required fields', 400);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    // Return response without password
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    }, { status: 201 });

  } catch (error: any) {
    return handleError(error);
  }
} 