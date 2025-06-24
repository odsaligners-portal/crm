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

  try {
    const distribution = await Patient.aggregate([
      { $group: { _id: { $ifNull: ['$caseCategory', 'Uncategorized'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const labels = distribution.map(item => item._id || 'Uncategorized');
    const series = distribution.map(item => item.count);
    
    return NextResponse.json({ success: true, data: { labels, series } });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
} 