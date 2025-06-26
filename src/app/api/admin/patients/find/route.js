import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/models/Patient';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

export async function GET(req) {
  await dbConnect();
  const authResult = await verifyAuth(req);
  if (!authResult.success || authResult.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  let patients = [];
  if (!search) {
    // Return all approved patients
    patients = await Patient.find({ caseApproval: true }).populate('userId');
  } else {
    patients = await Patient.find({
      $or: [
        { caseId: search },
        { patientName: { $regex: search, $options: 'i' } },
      ],
      caseApproval: true,
    }).populate('userId');
  }
  if (!patients || patients.length === 0) {
    return NextResponse.json({ error: 'Patient(s) not found' }, { status: 404 });
  }
  return NextResponse.json({ patients });
} 