import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/models/Patient';
import PatientComment from '@/app/api/models/PatientComment';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';


export async function GET(req) {
  await dbConnect();

  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const doctorId = authResult.user.id;
  
  try {
    const patientsOfDoctor = await Patient.find({ userId: doctorId }).select('_id patientName createdAt');
    const patientIds = patientsOfDoctor.map(p => p._id);
    
    const recentComments = await PatientComment.find({ patientId: { $in: patientIds } })
      .populate({
        path: 'comments.commentedBy.user',
        select: 'name'
      });

    const patientActivity = {};

    recentComments.forEach(pc => {
      
        const patientId = pc.patientId.toHexString();
        if (!patientActivity[patientId]) {
            patientActivity[patientId] = {
                lastActivity: new Date(0),
                commentsToday: Array(7).fill(0)
            };
        }
        pc.comments.forEach(comment => {
            const now = new Date();
            const commentDate = new Date(comment.datetime);
            if (commentDate > patientActivity[patientId].lastActivity) {
                patientActivity[patientId].lastActivity = commentDate;
            }

            const diffDays = Math.floor((now - commentDate) / (1000 * 60 * 60 * 24));
            if (diffDays < 7) {
                patientActivity[patientId].commentsToday[6 - diffDays]++;
            }
        });
    });
    
    const atAGlanceData = patientsOfDoctor.map(p => {
        const activity = patientActivity[p._id.toString()];
        return {
            patient: p,
            lastActivity: activity ? activity.lastActivity : p.createdAt,
            sparklineData: activity ? activity.commentsToday : Array(7).fill(0)
        }
    }).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
    .slice(0, 5); // Take the 5 most recently active

    return NextResponse.json({ success: true, data: atAGlanceData });
  } catch (error) {
    console.error("Error fetching at-a-glance data:", error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
} 