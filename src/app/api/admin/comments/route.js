import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/models/Patient';
import PatientComment from '@/app/api/models/PatientComment';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

export const GET = async (req) => {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);
    // Ensure the user is an admin
    if (!authResult.success || authResult.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 1. Find all patients to create a lookup map
    const patients = await Patient.find({}).select('_id caseId patientName').lean();
    if (!patients.length) {
      return NextResponse.json({ comments: [] });
    }
    
    // Create a map of patientId -> { caseId, patientName }
    const patientInfoMap = new Map(patients.map(p => [p._id.toString(), { caseId: p.caseId, patientName: p.patientName }]));
    const patientIds = Array.from(patientInfoMap.keys());

    // 2. Find all comment documents for all patients
    const commentDocs = await PatientComment.find({ patientId: { $in: patientIds } }).lean();

    // 3. Flatten the comments and add patient info to each one
    const allComments = commentDocs.flatMap(doc => {
      const patientInfo = patientInfoMap.get(doc.patientId.toString());
      if (!patientInfo) return [];
      
      return doc.comments.map(comment => ({
        _id: comment._id,
        comment: comment.comment,
        commentedBy: comment.commentedBy,
        createdAt: comment.datetime,
        caseId: patientInfo.caseId,
        patientName: patientInfo.patientName,
      }));
    });

    // 4. Sort all comments by date, newest first
    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ comments: allComments });

  } catch (error) {
    console.error('Error fetching all comments for admin:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}; 