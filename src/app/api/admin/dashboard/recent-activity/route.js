import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/models/Patient';
import User from '@/app/api/models/User';
import Event from '@/app/api/models/Event';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import PatientComment from '@/app/api/models/PatientComment';

export async function GET(req) {
  await dbConnect();

  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const limit = 12;
    let activities = [];

    // New Patients
    const newPatients = await Patient.find().sort({ createdAt: -1 }).limit(limit).select('patientName createdAt');
    activities.push(...newPatients.map(p => ({
      type: 'NEW_PATIENT',
      message: `New patient registered: ${p.patientName}`,
      timestamp: p.createdAt,
    })));

    // New Doctors
    const newDoctors = await User.find({ role: 'doctor' }).sort({ createdAt: -1 }).limit(limit).select('name createdAt');
    activities.push(...newDoctors.map(d => ({
      type: 'NEW_DOCTOR',
      message: `New doctor joined: ${d.name}`,
      timestamp: d.createdAt,
    })));

    // New Comments
    const newComments = await PatientComment.find().sort({ 'comments.datetime': -1 }).limit(limit).populate('patientId', 'name').populate('comments.commentedBy.user');
    newComments.forEach(pc => {
        pc.comments.slice(0, limit).forEach(c => {
            activities.push({
                type: 'NEW_COMMENT',
                message: `New comment on ${pc.patientName}'s case by ${c.commentedBy.name}`,
                timestamp: c.datetime
            });
        });
    });

    // New Events
    const newEvents = await Event.find().sort({ createdAt: -1 }).limit(limit).select('name createdAt');
    activities.push(...newEvents.map(e => ({
      type: 'NEW_EVENT',
      message: `New event Added: ${e.name}`,
      timestamp: e.createdAt,
    })));
    
    // Sort all activities by timestamp and take the latest `limit` items
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivities = activities.slice(0, limit);

    return NextResponse.json({ success: true, data: recentActivities });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
} 