import { NextResponse } from 'next/server';
import connectDB from '@/app/api/config/db';
import User from '@/app/api/models/User';
import { admin } from '@/app/api/middleware/authMiddleware';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  await connectDB();

  const authResult = await admin(req);
  if (!authResult.success) {
    return NextResponse.json({ message: authResult.error }, { status: 401 });
  }

  const superAdminId = process.env.SUPER_ADMIN_ID;
  if (authResult.user.id !== superAdminId) {
    return NextResponse.json({ message: 'Only super admin can change this password.' }, { status: 403 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'Current and new password are required.' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: 'New password must be at least 8 characters long.' }, { status: 400 });
  }

  const user = await User.findById(superAdminId).select('+password');
  if (!user) {
    return NextResponse.json({ message: 'Super admin not found.' }, { status: 404 });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 400 });
  }

  user.password = newPassword;
  await user.save();

  return NextResponse.json({ message: 'Password updated successfully.' });
} 