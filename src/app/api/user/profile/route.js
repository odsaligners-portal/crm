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
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        socialLinks: user.socialLinks || {
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: ''
        },
        address: user.address || {
          country: '',
          city: '',
          postalCode: '',
          taxId: ''
        }
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
    console.log('Received update data:', body);

    // Update user data
    const updateData = {
      name: body.name,
      email: body.email,
      bio: body.bio,
      phone: body.phone,
    };

    console.log('Update data being sent to DB:', updateData);

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    console.log('Updated user data:', user);

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio || '',
        phone: user.phone || '',
        socialLinks: user.socialLinks || {
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: ''
        },
        address: user.address || {
          country: '',
          city: '',
          postalCode: '',
          taxId: ''
        }
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return handleError(error);
  }
} 