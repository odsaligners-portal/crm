import { NextResponse } from 'next/server';
import { handleError, AppError } from '../../../utils/errorHandler';
import connectDB from '../../../config/db';
import User from '../../../models/User';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

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
      return NextResponse.json({ message: 'Only super admin can delete admins' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.targetAdminId) {
      throw new AppError('targetAdminId is required', 400);
    }

    const deletedUser = await User.findByIdAndDelete(body.targetAdminId);
    if (!deletedUser) {
      throw new AppError('Admin not found', 404);
    }

    return NextResponse.json({ message: 'Admin deleted successfully' }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
} 