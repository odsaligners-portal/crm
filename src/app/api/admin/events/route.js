import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Event from '@/app/api/models/Event';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { app } from '@/utils/firebase';

const storage = getStorage(app);

// Helper to verify admin role
async function verifyAdmin(request) {
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user.role !== 'admin') {
        return { success: false, message: 'Unauthorized', status: 401 };
    }
    return { success: true, user: authResult.user };
}

export async function POST(request) {
  try {
    await dbConnect();
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authResult;

    const { name, description, eventDate, image } = await request.json();

    if (!name || !description || !eventDate || !image) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const newEvent = new Event({
      name,
      description,
      eventDate,
      image: { fileUrl: image.fileUrl, fileKey: image.fileKey || '' }, // fileKey is optional now
      createdBy: user.id,
    });

    await newEvent.save();

    return NextResponse.json(newEvent, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// DELETE an event using query parameter
export async function DELETE(request) {
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.success) {
        return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status });
    }

    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
        }
        
        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }

        if (event.image && event.image.fileKey) {
            const fileRef = ref(storage, event.image.fileKey);
            await deleteObject(fileRef).catch(err => console.error("Firebase delete failed:", err));
        }

        await Event.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}

// UPDATE an event using query parameter
export async function PUT(request) {
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.success) {
        return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status });
    }

    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
        }

        const body = await request.json();
        
        const eventToUpdate = await Event.findById(id);
        if (!eventToUpdate) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }
        
        const oldFileKey = eventToUpdate.image?.fileKey;
        const newFileKey = body.image?.fileKey;

        if (oldFileKey && newFileKey && oldFileKey !== newFileKey) {
            const oldFileRef = ref(storage, oldFileKey);
            await deleteObject(oldFileRef).catch(err => console.error("Old file delete failed:", err));
        }

        const updatedEvent = await Event.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        return NextResponse.json(updatedEvent, { status: 200 });

    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
} 