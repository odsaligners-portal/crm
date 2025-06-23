import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Event from '@/app/api/models/Event';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

export async function GET(request) {
  try {
    await dbConnect();
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Only allow admin to fetch a single event
      if (authResult.user.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden: Only admins can fetch a single event.' }, { status: 403 });
      }
      const event = await Event.findById(id);
      if (!event) {
        return NextResponse.json({ message: 'Event not found' }, { status: 404 });
      }
      return NextResponse.json(event, { status: 200 });
    }

    const events = await Event.find({}).populate('createdBy', 'name').sort({ eventDate: -1 });
    return NextResponse.json(events, { status: 200 });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
} 