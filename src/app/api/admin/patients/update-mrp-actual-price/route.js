import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/models/Patient';
import User from '@/app/api/models/User';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import AccountsTeam from '@/app/api/models/AccountsTeam';
import { sendMail } from '@/app/api/utils/mailer';

export async function PUT(req) {
  await dbConnect();
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Fetch the latest user from DB for access check
  const userFromDb = await User.findById(authResult.user.id || authResult.user._id);
  if (!userFromDb) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }
  if (!(
    (userFromDb.role === 'admin' && userFromDb.priceUpdateAccess === true)
  )) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Patient ID required' }, { status: 400 });
  }
  const body = await req.json();
  const { MRP, actualPrice } = body;
  if (MRP === undefined && actualPrice === undefined) {
    return NextResponse.json({ error: 'MRP or actualPrice required' }, { status: 400 });
  }
  const update = {};
  if (MRP !== undefined) update.MRP = MRP;
  if (actualPrice !== undefined) update.actualPrice = actualPrice;
  const patient = await Patient.findByIdAndUpdate(id, { $set: update }, { new: true }).populate('userId');
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  // Send email to accounts team
  try {
    const accounts = await AccountsTeam.find({}, 'email');
    const emails = accounts.map(a => a.email).filter(Boolean);
    if (emails.length > 0) {
      const doctorName = patient.userId?.name || 'Unknown';
      const subject = `Price Updated for Patient ${patient.patientName} (Case ID: ${patient.caseId})`;
      const html = `
        <p>The price for patient <strong>${patient.patientName}</strong> (case ID: <strong>${patient.caseId}</strong>) of doctor <strong>${doctorName}</strong> has been updated.</p>
        <ul>
          <li>MRP: <strong>${patient.MRP ?? 'N/A'}</strong></li>
          <li>Actual Price: <strong>${patient.actualPrice ?? 'N/A'}</strong></li>
        </ul>
        <p><strong>Please generate the invoice.</strong></p>
      `;
      await sendMail({ to: emails, subject, html });
    }
  } catch (err) {
    console.error('Failed to send accounts team email:', err);
  }

  return NextResponse.json({ patient });
} 