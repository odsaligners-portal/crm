import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import User from '@/app/api/models/User';
import Patient from '@/app/api/models/Patient';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

export async function GET(req) {
  await dbConnect();

  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await User.countDocuments({ role: 'doctor' });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newPatientsThisMonth = await Patient.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // You can add more stats here, like pending approvals if you have a status field
    // const pendingApprovals = await Patient.countDocuments({ status: 'pending' });

    return NextResponse.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        newPatientsThisMonth,
        // pendingApprovals
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
} 