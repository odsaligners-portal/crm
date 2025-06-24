import { NextResponse } from 'next/server';
import connectDB from '@/app/api/config/db';
import User from '@/app/api/models/User';
import { admin } from '@/app/api/middleware/authMiddleware';

export async function POST(req) {
  await connectDB();

  const authResult = await admin(req);
  if (!authResult.success) {
    return NextResponse.json({ message: authResult.error }, { status: 401 });
  }

  const { userId, password } = await req.json();

  if (!userId || !password) {
    return NextResponse.json({ message: 'User ID and password are required' }, { status: 400 });
  }
  
  if (password.length < 8) {
    return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
  }

  const user = await User.findById(userId);

  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  // If the target user is an admin, only a super admin can change their password
  if (user.role === 'admin') {
    const superAdminId = process.env.SUPER_ADMIN_ID;
    if (authResult.user.id !== superAdminId) {
      return NextResponse.json({ message: 'You are not authorized to change another admin\'s password.' }, { status: 403 });
    }
  }

  // The pre-save hook in the User model will hash the password
  user.password = password;
  await user.save();

  return NextResponse.json({ message: 'Password updated successfully' });
} 