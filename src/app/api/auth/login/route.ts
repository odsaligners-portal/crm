import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '../../config/db';
import User from '../../models/User';
import { handleError, AppError } from '../../utils/errorHandler';

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const { email, password } = await req.json();

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }
   
    // Find user
    const user = await User.findOne({ email });
  
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    
    console.log(user.password);
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

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
    });

  } catch (error: any) {
    return handleError(error);
  }
} 