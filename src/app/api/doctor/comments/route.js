import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/models/Patient';
import PatientComment from '@/app/api/models/PatientComment';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

export const GET = async (req) => {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);
    if (!authResult.success || authResult.user.role !== 'doctor') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authResult;

    // 1. Find all patients for the logged-in doctor to get their IDs
    const patients = await Patient.find({ userId: user.id }).select('_id caseId patientName').lean();
    if (!patients.length) {
      return NextResponse.json({ comments: [] });
    }
    
    // Create a map of patientId to patientInfo for easy lookup
    const patientInfoMap = new Map(patients.map(p => [p._id.toString(), { caseId: p.caseId, patientName: p.patientName }]));
    const patientIds = Array.from(patientInfoMap.keys());

    // 2. Find all comment documents for those patients
    const commentDocs = await PatientComment.find({ patientId: { $in: patientIds } }).lean();

    // 3. Flatten the comments and enrich them with patient info
    const allComments = commentDocs.flatMap(doc => {
      const patientInfo = patientInfoMap.get(doc.patientId.toString());
      if (!patientInfo) return []; // Should not happen if DB is consistent
      
      return doc.comments.map(comment => ({
        _id: comment._id,
        comment: comment.comment,
        commentedBy: comment.commentedBy,
        createdAt: comment.datetime,
        caseId: patientInfo.caseId,
        patientName: patientInfo.patientName,
      }));
    });

    // 4. Sort comments by date, newest first
    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ comments: allComments });

  } catch (error) {
    console.error('Error fetching all comments:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}; 