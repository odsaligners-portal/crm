import connectDB from '@/app/api/config/db';
import User from '@/app/api/models/User';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectDB();
  const { doctorId, distributerId } = await req.json();
  if (!doctorId) return NextResponse.json({ error: 'doctorId is required' }, { status: 400 });
  if (!distributerId) return NextResponse.json({ error: 'distributerId is required' }, { status: 400 });
  const update = {};
  if (distributerId !== undefined) update.distributerId = distributerId;
  await User.findByIdAndUpdate(doctorId, update);
  return NextResponse.json({ message: 'Distributer assignment updated' });
}
