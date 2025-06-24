import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Notification from '@/app/api/models/Notification';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import mongoose from 'mongoose';

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
    filter = { commentFor: new mongoose.Types.ObjectId(user.id) };
  } else {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  // Unread first, then newest first
  const notifications = await Notification.find(filter)
    .sort({ read: 1, createdAt: -1 })
    .lean();

  return NextResponse.json({ notifications });
}

export async function PATCH(req) {
  await dbConnect();
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { notificationId } = await req.json();
    if (!notificationId) {
      return NextResponse.json({ message: 'Notification ID is required' }, { status: 400 });
    }
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, notification });
  } catch (err) {
    return NextResponse.json({ message: err.message || 'Failed to update notification' }, { status: 500 });
  }
} 