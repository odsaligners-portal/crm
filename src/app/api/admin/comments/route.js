import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/models/Patient';
import PatientComment from '@/app/api/models/PatientComment';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import { admin } from '@/app/api/middleware/authMiddleware';
import Notification from '@/app/api/models/Notification';

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

export async function DELETE(request) {
  try {
    const authResult = await admin(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: authResult.error || 'Authentication required' }, { status: 401 });
    }
    const user = authResult.user;
    if (!user.commentUpdateAccess) {
      return NextResponse.json({ success: false, message: 'Forbidden: You do not have permission to delete comments.' }, { status: 403 });
    }
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Comment ID is required' }, { status: 400 });
    }
    // Remove the comment from the comments array in PatientComment
    const result = await PatientComment.updateOne(
      { 'comments._id': id },
      { $pull: { comments: { _id: id } } }
    );
    // Also delete notifications related to this comment
    await Notification.deleteMany({ commentId: id });
    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Comment and related notifications deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete comment' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authResult = await admin(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: authResult.error || 'Authentication required' }, { status: 401 });
    }
    const user = authResult.user;
    if (!user.commentUpdateAccess) {
      return NextResponse.json({ success: false, message: 'Forbidden: You do not have permission to update comments.' }, { status: 403 });
    }
    await dbConnect();
    const body = await request.json();
    const { id, comment } = body;
    if (!id || typeof comment !== 'string') {
      return NextResponse.json({ success: false, message: 'Comment ID and new comment text are required' }, { status: 400 });
    }
    // Update the comment text in the comments array in PatientComment
    const result = await PatientComment.findOneAndUpdate(
      { 'comments._id': id },
      { $set: { 'comments.$.comment': comment } },
      { new: true }
    );
    if (!result) {
      return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });
    }
    // Return the updated comment object
    const updatedComment = result.comments.find(c => c._id.toString() === id);
    return NextResponse.json({ success: true, message: 'Comment updated successfully', data: updatedComment });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update comment' }, { status: 500 });
  }
} 