import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Notification from '@/app/api/models/Notification';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

export async function GET(req) {
  await dbConnect();
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const user = authResult.user;
  let filter = {};
  if (user.role === 'admin') {
    filter = { commentFor: 'admin' };
  } else if (user.role === 'doctor') {
    filter = { commentFor: user.id };
  } else {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // Unread first, then newest first
  const notifications = await Notification.find(filter)
    .sort({ read: 1, createdAt: -1 })
    .lean();
  return NextResponse.json({ notifications });
} 