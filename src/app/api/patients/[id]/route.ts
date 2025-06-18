import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import dbConnect from '@/app/api/config/db';
import Patient from '@/app/api/patients/Patient';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();

    // Find patient and check if it belongs to the logged-in user
    const patient = await Patient.findOne({
      _id: params.id,
      userId: authResult.user.id // Use id from decoded token
    }).lean();

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found or you do not have permission to view this record' },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error('Error in GET patient:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();

    const fieldsToUpdate = Object.fromEntries(
      Object.entries({
        chiefComplaint: body.chiefComplaint,
        caseType: body.caseType,
        singleArchType: body.singleArchType,
        caseCategory: body.caseCategory,
        selectedPrice: body.selectedPrice,
        extraction: body.extraction,
        interproximalReduction: body.interproximalReduction,
        measureOfIPR: body.measureOfIPR,
      }).filter(([_, v]) => v !== undefined)
    );

    const updatedPatient = await Patient.findOneAndUpdate(
      {
        _id: params.id,
        userId: authResult.user.id,
      },
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return NextResponse.json(
        { error: 'Patient not found or you do not have permission to modify this record' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPatient);
  } catch (error: any) {
    console.error('Error in PUT patient:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Delete patient only if it belongs to the logged-in user
    const patient = await Patient.findOneAndDelete({
      _id: params.id,
      userId: authResult.user.id // Use id from decoded token
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found or you do not have permission to delete this record' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE patient:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 