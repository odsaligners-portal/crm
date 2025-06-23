import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/models/Patient';
import PatientComment from '@/app/api/models/PatientComment';
import User from '@/app/api/models/User';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import { sendEmail } from '@/app/api/utils/mailer';

// POST - Add a new comment to a patient
export async function POST(request) {
  try {
    await dbConnect();
    
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    const { user: commenter } = authResult;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const { comment } = await request.json();
    
    if (!patientId || !comment) {
      return NextResponse.json(
        { success: false, message: 'Patient ID and comment are required' },
        { status: 400 }
      );
    }
    
    const patient = await Patient.findById(patientId).populate('userId');
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    
    // Check if patient has userId and handle the authorization properly
    if (commenter.role !== 'admin') {
      // Check if patient has userId for email notifications
      if (!patient.userId) {
        console.warn(`Patient ${patientId} has no userId field`);
      }
      // Convert both IDs to strings for comparison
      const patientUserId = patient.userId._id.toHexString();
      
      const currentUserId = commenter.id;
      
      if (patientUserId !== currentUserId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
      }
    }

    // Reverting to the original database logic
    let patientComment = await PatientComment.findOne({ patientId });

    if (!patientComment) {
      patientComment = new PatientComment({
        patientId,
        patientName: patient.patientName,
        comments: [],
      });
    }
    
    const newComment = {
      comment,
      commentedBy: {
        user: commenter.id,
        userType: commenter.role,
        name: commenter.role === 'admin' ? 'Admin' : "Doctor",
      },
    };

    patientComment.comments.push(newComment);
    await patientComment.save();
    
    // --- Email Notification Logic ---
    try {
      if (commenter.role === 'admin') {
        // Admin commented, notify the doctor
        if (patient.userId && patient.userId.email) {
          await sendEmail({
            to: patient.userId.email,
            subject: `New Comment on Patient: ${patient.patientName}`,
            html: `
              <p>Hello Dr. ${patient.userId.name},</p>
              <p>A new comment has been added by an admin to your patient, <strong>${patient.patientName}</strong> (Case ID: ${patient.caseId}).</p>
              <p><strong>Comment:</strong></p>
              <blockquote>${comment}</blockquote>
              <p>Please log in to the portal to view the full details.</p>
            `
          });
        }
      } else if (commenter.role === 'doctor') {
        // Doctor commented, notify the admin(s)
        const admins = await User.find({ role: 'admin' });
        const adminEmails = admins.map(admin => admin.email).filter(Boolean);
        
        if (adminEmails.length > 0) {
          await sendEmail({
            to: adminEmails.join(','),
            subject: `New Doctor Comment on Patient: ${patient.patientName}`,
            html: `
              <p>Hello Admin,</p>
              <p>A new comment has been added by Doctor to patient <strong>${patient.patientName}</strong> (Case ID: ${patient.caseId}).</p>
              <p><strong>Comment:</strong></p>
              <blockquote>${comment}</blockquote>
              <p>Please log in to the portal to review.</p>
            `
          });
        }
      }
    } catch (emailError) {
      // Log the error but don't fail the request
      console.error("Failed to send notification email:", emailError);
    }
    // --- End of Email Notification Logic ---

    return NextResponse.json(patientComment.comments.slice(-1)[0], { status: 201 });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

export const GET = async (req) => {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: authResult.error }, { status: 401 });
    }
    const { user } = authResult;

    const patientId = req.nextUrl.searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ message: 'Patient ID is required' }, { status: 400 });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    const caseId = patient.caseId;

    // Check if patient has userId and handle the authorization properly
    if (user.role !== 'admin') {
      // For non-admin users, check if they own the patient
      if (!patient.userId) {
        return NextResponse.json({ message: 'Patient record is invalid' }, { status: 400 });
      }
      
      // Convert both IDs to strings for comparison
      const patientUserId = patient.userId.toHexString();
      
      const currentUserId = user.id;
      
      if (patientUserId !== currentUserId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
      }
    }

    const patientComment = await PatientComment.findOne({ patientId });

    if (!patientComment) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json({
      comments : patientComment.comments,
      caseId
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
};