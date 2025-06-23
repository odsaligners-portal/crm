import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import PatientFile from '@/app/api/models/PatientFile';
import Patient from '@/app/api/models/Patient';
import User from '@/app/api/models/User';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import { sendEmail } from '@/app/api/utils/mailer';

export async function POST(req) {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: authResult.error || 'Authentication required' }, { status: 401 });
    }
    const { user } = authResult;
    const body = await req.json();
    const { patientId, fileName, fileType, fileUrl, fileKey } = body;
    if (!patientId || !fileName || !fileType || !fileUrl || !fileKey) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    // Save file record
    const patientFile = new PatientFile({
      patientId,
      fileName,
      fileType,
      fileUrl,
      fileKey,
      uploadedBy: user.role === 'admin' ? 'Admin' : 'Doctor',
    });
    await patientFile.save();

    // Fetch patient and users for notification
    const patient = await Patient.findById(patientId).populate('userId');
    if (!patient) {
      return NextResponse.json({ success: false, message: 'Patient not found' }, { status: 404 });
    }
    let notifyEmail = null;
    let notifyName = '';
    if (user.role === 'admin') {
      // Notify doctor
      if (patient.userId && patient.userId.email) {
        notifyEmail = patient.userId.email;
        notifyName = patient.userId.name;
      }
    } else if (user.role === 'doctor') {
      // Notify all admins
      const admins = await User.find({ role: 'admin' });
      const adminEmails = admins.map(a => a.email).filter(Boolean);
      if (adminEmails.length > 0) {
        notifyEmail = adminEmails.join(',');
        notifyName = 'Admin';
      }
    }
    if (notifyEmail) {
      await sendEmail({
        to: notifyEmail,
        subject: `New File Uploaded for Patient: ${patient.patientName}`,
        html: `<p>Hello ${notifyName},</p>
          <p>A new file has been uploaded to patient <strong>${patient.patientName}</strong> (Case ID: ${patient.caseId}) by ${user.role}.</p>
          <ul>
            <li><strong>File Name:</strong> ${fileName}</li>
            <li><strong>Download File:</strong> ${fileUrl}</li>
          </ul>
          <p>Please log in to the portal to view the file.</p>`
      });
    }
    return NextResponse.json({ success: true, file: patientFile });
  } catch (error) {
    console.error('Error uploading patient file:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: authResult.error || 'Authentication required' }, { status: 401 });
    }
    const { user } = authResult;
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    if (!patientId) {
      return NextResponse.json({ success: false, message: 'Missing patientId' }, { status: 400 });
    }
    // Fetch patient to check access
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json({ success: false, message: 'Patient not found' }, { status: 404 });
    }
    // Only admin or assigned doctor can access
    if (
      user.role !== 'admin' &&
      !(user.role === 'doctor' && patient.userId?.toString() === user.id)
    ) {
      return NextResponse.json({ success: false, message: "You don't have access to see the files" }, { status: 403 });
    }
    const files = await PatientFile.find({ patientId }).sort({ uploadedAt: -1 });
    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error('Error fetching patient files:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 