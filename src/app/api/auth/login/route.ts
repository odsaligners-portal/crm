import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '../../config/db';
import User from '../../models/User';
import { handleError, AppError } from '../../utils/errorHandler';

export async function POST(req: Request) {
  try {
    console.log('Starting login process...');
    await connectDB();
    
    const { email, password } = await req.json();
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }
   
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    console.log('Found user:', user ? 'Yes' : 'No');
  
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    
    // Check password
    console.log('Checking password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );
    console.log('JWT token generated successfully');

    // Return response without password
    const response = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
    console.log('Sending response:', { ...response, token: 'HIDDEN' });
    
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Login error:', error);
    return handleError(error);
  }
} 