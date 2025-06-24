import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/models/Patient';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

export async function GET(req) {
  await dbConnect();
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const doctorId = authResult.user.id;
  try {
    const { search } = Object.fromEntries(req.nextUrl.searchParams);
    const query = { userId: doctorId };

    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { caseId: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query).select('_id patientName name email progressStatus caseId city');
    return NextResponse.json({ success: true, patients });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const doctorId = authResult.user.id;
  try {
    const { patientId, status } = await req.json();
    const patient = await Patient.findOne({ _id: patientId, userId: doctorId });
    if (!patient) {
      return NextResponse.json({ success: false, message: 'Patient not found' }, { status: 404 });
    }
    patient.progressStatus = status;
    await patient.save();
    return NextResponse.json({ success: true, patient });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
} 