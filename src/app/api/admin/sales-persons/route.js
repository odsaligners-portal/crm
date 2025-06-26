import { NextResponse } from 'next/server';
import connectDB from '@/app/api/config/db';
import SalesPerson from '@/app/api/models/SalesPerson';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';

export async function GET(req) {
  await connectDB();
  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const superAdminId = process.env.SUPER_ADMIN_ID;
  if (authResult.user.id !== superAdminId) {
    return NextResponse.json({ message: 'Only super admin can access this resource' }, { status: 403 });
  }
  const salesPersons = await SalesPerson.find();
  return NextResponse.json({ salesPersons });
}

export async function POST(req) {
  await connectDB();
  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const superAdminId = process.env.SUPER_ADMIN_ID;
  if (authResult.user.id !== superAdminId) {
    return NextResponse.json({ message: 'Only super admin can access this resource' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { name, mobile, email } = body;
    if (!name || !mobile || !email) {
      return NextResponse.json({ message: 'Name, mobile, and email are required.' }, { status: 400 });
    }
    // Check for unique email
    const existing = await SalesPerson.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: 'A sales person with this email already exists.' }, { status: 409 });
    }
    const salesPerson = new SalesPerson({ name, mobile, email });
    await salesPerson.save();
    return NextResponse.json({ salesPerson }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Failed to create sales person.' }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectDB();
  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const superAdminId = process.env.SUPER_ADMIN_ID;
  if (authResult.user.id !== superAdminId) {
    return NextResponse.json({ message: 'Only super admin can access this resource' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ message: 'Sales person ID is required.' }, { status: 400 });
    }
    const deleted = await SalesPerson.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Sales person not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Sales person deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Failed to delete sales person.' }, { status: 500 });
  }
} 