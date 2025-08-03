import connectDB from '@/app/api/config/db';
import Distributer from '@/app/api/models/Distributer';
import { AppError, handleError } from '@/app/api/utils/errorHandler';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

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
    const user = await Distributer.findById(decoded.id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userDeleteAccess: user.userDeleteAccess,
        eventUpdateAccess: user.eventUpdateAccess,
        commentUpdateAccess: user.commentUpdateAccess,
        caseCategoryUpdateAccess: user.caseCategoryUpdateAccess,
        changeDoctorPasswordAccess: user.changeDoctorPasswordAccess,
        priceUpdateAccess: user.priceUpdateAccess,
        plannerAccess: user.plannerAccess,
        distributerAccess: user.distributerAccess,
        addSalesPersonAccess: user.addSalesPersonAccess,
        mobile: user.mobile,
        gender: user.gender,
        country: user.country,
        state: user.state,
        city: user.city,
        experience: user.experience,
        doctorType: user.doctorType,
        address: user.address,
        profilePicture: user.profilePicture || { url: '', fileKey: '', uploadedAt: null },
      }
    });

  } catch (error) {
    return handleError(error);
  }
}

// export async function PUT(req) {
//   try {
//     await connectDB();

//     const authResult = await verifyAuth(req);
//     if (!authResult.success) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }
//     const user = authResult.user;
    
//     // Get request body
//     const body = await req.json();

//     // Allow updating all fields provided in the body
//     const updateData = { ...body };

//     const updatedUser = await User.findByIdAndUpdate(
//       user.id,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!updatedUser) {
//       throw new AppError('User not found', 404);
//     }

//     return NextResponse.json({
//       user: {
//         id: updatedUser._id,
//         name: updatedUser.name,
//         email: updatedUser.email,
//         role: updatedUser.role,
//         mobile: updatedUser.mobile,
//         gender: updatedUser.gender,
//         country: updatedUser.country,
//         state: updatedUser.state,
//         city: updatedUser.city,
//         experience: updatedUser.experience,
//         doctorType: updatedUser.doctorType,
//         address: updatedUser.address,
//         profilePicture: updatedUser.profilePicture || { url: '', fileKey: '', uploadedAt: null },
//       }
//     });

//   } catch (error) {
//     console.error('Profile update error:', error);
//     return handleError(error);
//   }
// } 