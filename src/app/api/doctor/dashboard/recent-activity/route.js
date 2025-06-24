import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/models/Patient';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import PatientComment from '@/app/api/models/PatientComment';

export async function GET(req) {
  await dbConnect();

  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const doctorId = authResult.user._id;

  try {
    const limit = 10;
    let activities = [];

    const patientsOfDoctor = await Patient.find({ doctor: doctorId }).distinct('_id');

    // New Comments on Doctor's Patients
    const newComments = await PatientComment.find({ patient: { $in: patientsOfDoctor } })
        .sort({ 'comments.datetime': -1 })
        .limit(limit)
        .populate('patient', 'name')
        .populate('comments.commentedBy', 'name');

    newComments.forEach(pc => {
        pc.comments.slice(0, limit).forEach(c => {
            // We only want to show comments from others, not the doctor themselves.
            if (c.commentedBy._id.toString() !== doctorId.toString()) {
                activities.push({
                    type: 'NEW_COMMENT',
                    message: `New comment on ${pc.patient.name}'s case by ${c.commentedBy.name}`,
                    timestamp: c.datetime,
                });
            }
        });
    });

    // You could add other activities here, e.g., patient status updates
    
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