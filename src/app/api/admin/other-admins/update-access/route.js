import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import { NextResponse } from 'next/server';
import connectDB from '../../../config/db';
import User from '../../../models/User';
import { AppError, handleError } from '../../../utils/errorHandler';

export async function POST(req) {
  try {
    await connectDB();

    // Get token from authorization header
    const authResult = await verifyAuth(req);
    
    if (!authResult.success || authResult.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const data = authResult;
    const userData = data.user;
    
    // Get request body
    const body = await req.json();
    const superAdminId = process.env.SUPER_ADMIN_ID;
    if (userData.id !== superAdminId) {
      throw new AppError('Not authorized', 401);
    }
    if (!body.targetAdminId) {
      throw new AppError('targetAdminId is required', 400);
    }
    // Only allow updating access fields
    const accessFields = [
      "userDeleteAccess",
      "eventUpdateAccess",
      "commentUpdateAccess",
      "caseCategoryUpdateAccess",
      "changeDoctorPasswordAccess",
      "priceUpdateAccess",
      "addSalesPersonAccess",
      "distributerAccess",
      "plannerAccess",
      "specialCommentAccess",
    ];
    const updateData = {};
    accessFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });
    // // If the UI sends a combined field for sales & a/c team access, update both
    // if (body.salesAndAccountsTeamAccess !== undefined) {
    //   updateData.priceUpdateAccess = body.salesAndAccountsTeamAccess;
    //   updateData.addSalesPersonAccess = body.salesAndAccountsTeamAccess;
    // }
    const user = await User.findByIdAndUpdate(
      body.targetAdminId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select(
      "id name email userDeleteAccess eventUpdateAccess commentUpdateAccess caseCategoryUpdateAccess changeDoctorPasswordAccess priceUpdateAccess addSalesPersonAccess distributerAccess plannerAccess",
    );
    if (!user) {
      throw new AppError('Admin not found', 404);
    }
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userDeleteAccess: user.userDeleteAccess,
        eventUpdateAccess: user.eventUpdateAccess,
        commentUpdateAccess: user.commentUpdateAccess,
        caseCategoryUpdateAccess: user.caseCategoryUpdateAccess,
        changeDoctorPasswordAccess: user.changeDoctorPasswordAccess,
        priceUpdateAccess: user.priceUpdateAccess,
        addSalesPersonAccess: user.addSalesPersonAccess,
        distributerAccess: user.distributerAccess,
        plannerAccess: user.plannerAccess,
      },
    });
  } catch (error) {
    return handleError(error);
  }
} 