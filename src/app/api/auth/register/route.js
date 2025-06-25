import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import connectDB from '../../config/db';
import User from '../../models/User';
import { AppError, handleError } from '../../utils/errorHandler';

export async function POST(req) {
  try {
    await connectDB();
    
    const { 
      name, email, password, profilePicture
    } = await req.json();

    if ( !name || !email || !password ) {
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
      ...(profilePicture ? { profilePicture } : {}),
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    // Return response without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    };

    return NextResponse.json({
      user: userResponse,
      token
    }, { status: 201 });

  } catch (error) {
    return handleError(error);
  }
} 