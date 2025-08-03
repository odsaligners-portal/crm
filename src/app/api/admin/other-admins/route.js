import { NextResponse } from 'next/server';
import connectDB from '@/app/api/config/db';
import User from '@/app/api/models/User';
import { admin } from '../../middleware/authMiddleware';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const authResult = await admin(req);
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const query = {};
  if (role) query.role = role;
  const admins = await User.find(query).select('name email mobile role distributerId distributerAccess');
  return NextResponse.json({ admins });
} 