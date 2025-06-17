import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import Patient from './Patient';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const search = searchParams.get('search') || '';

  // Get userId from token
  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user || !authResult.user._id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = authResult.user._id;

  const query: any = { userId };
  if (search) {
    query.$or = [
      { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
      { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
      { 'personalInfo.email': { $regex: search, $options: 'i' } },
      { 'personalInfo.phone': { $regex: search, $options: 'i' } },
      { 'personalInfo.address.city': { $regex: search, $options: 'i' } },
      { 'personalInfo.address.country': { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Patient.countDocuments(query);
  const patients = await Patient.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return NextResponse.json({ patients, total });
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get userId from token
    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.user || !authResult.user._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.user._id;

    const body = await req.json();
    
   
    // Create patient with userId
    const patient = await Patient.create({
      ...body,
      userId,
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern?.['personalInfo.email']) {
      return NextResponse.json(
        { error: 'A patient with this email already exists' },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 