import { NextResponse } from 'next/server';
import { handleError, AppError } from '../../utils/errorHandler';
import connectDB from '../../config/db';
import User from '../../models/User';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    await connectDB();

    // Get token from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authorized', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Get user data
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        gender: user.gender,
        country: user.country,
        state: user.state,
        city: user.city,
        experience: user.experience,
        doctorType: user.doctorType,
        address: user.address,
      }
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    // Get token from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authorized', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Get request body
    const body = await req.json();

    // Dynamically build the update object with provided fields
    const updateData = {};
    const fields = [
      'name', 'email', 'mobile', 'gender', 'country', 'state', 
      'city', 'experience', 'doctorType', 'address'
    ];

    fields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        gender: user.gender,
        country: user.country,
        state: user.state,
        city: user.city,
        experience: user.experience,
        doctorType: user.doctorType,
        address: user.address,
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return handleError(error);
  }
} 