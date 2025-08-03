import { NextResponse } from 'next/server';
import connectDB from '@/app/api/config/db';
import AccountsTeam from '@/app/api/models/AccountsTeam';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import User from '../../models/User';

export async function GET(req) {
  await connectDB();
  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  const userData = await User.findById(authResult.user.id);

  const isAdmin = userData.role === 'admin';

  if (!isAdmin) {
    return NextResponse.json({ message: 'Only admin can access this resource' }, { status: 403 });
  }

  const hasAccess = userData.addSalesPersonAccess;

  if (!hasAccess) {
    return NextResponse.json(
      { message: "You don't have permission to access this resource" },
      { status: 403 },
    );
  }

  const accountsTeam = await AccountsTeam.find();
  return NextResponse.json({ accountsTeam });
}

export async function POST(req) {
  await connectDB();
  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userData = await User.findById(authResult.user.id);

  const isAdmin = userData.role === "admin";

  if (!isAdmin) {
    return NextResponse.json(
      { message: "Only admin can access this resource" },
      { status: 403 },
    );
  }

  const hasAccess = userData.addSalesPersonAccess;

  if (!hasAccess) {
    return NextResponse.json(
      { message: "You don't have permission to access this resource" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { name, mobile, email } = body;
    if (!name || !mobile || !email) {
      return NextResponse.json({ message: 'Name, mobile, and email are required.' }, { status: 400 });
    }
    // Check for unique email
    const existing = await AccountsTeam.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: 'An accounts team member with this email already exists.' }, { status: 409 });
    }
    const accountsMember = new AccountsTeam({ name, mobile, email });
    await accountsMember.save();
    return NextResponse.json({ accountsMember }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Failed to create accounts team member.' }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectDB();
  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userData = await User.findById(authResult.user.id);

  const isAdmin = userData.role === "admin";

  if (!isAdmin) {
    return NextResponse.json(
      { message: "Only admin can access this resource" },
      { status: 403 },
    );
  }

  const hasAccess = userData.addSalesPersonAccess;

  if (!hasAccess) {
    return NextResponse.json(
      { message: "You don't have permission to access this resource" },
      { status: 403 },
    );
  }
  
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ message: 'Accounts team member ID is required.' }, { status: 400 });
    }
    const deleted = await AccountsTeam.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Accounts team member not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Accounts team member deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Failed to delete accounts team member.' }, { status: 500 });
  }
} 