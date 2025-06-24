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

  const doctorId = authResult.user._id;

  try {
    const myPatients = await Patient.countDocuments({ doctor: doctorId });
    
    // Assuming 'pending' status exists. If not, this will be 0.
    const pendingCases = await Patient.countDocuments({ userId: doctorId, status: 'in-progress' });

    return NextResponse.json({
      success: true,
      data: {
        myPatients,
        pendingCases,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
} 