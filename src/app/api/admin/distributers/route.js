import connectDB from "@/app/api/config/db";
import Distributer from "@/app/api/models/Distributer";
import User from "@/app/api/models/User";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/app/api/middleware/authMiddleware"; 

// Access control helper
async function verifyAdminWithDistributerAccess(request) {
  const authResult = await verifyAuth(request);

  if (!authResult.success || authResult.user.role !== "admin") {
    return { success: false, message: "Unauthorized", status: 401 };
  }

  const user = await User.findById(authResult.user.id);
 
  if (!user || !user.distributerAccess) {
    return {
      success: false,
      message: "You do not have access to manage distributers",
      status: 403,
    };
  }

  return { success: true, user };
}

// GET all distributers with optional search, pagination
export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;
  const search = searchParams.get("search") || "";

  const query = search ? { name: { $regex: search, $options: "i" } } : {};

  const totalDistributers = await Distributer.countDocuments(query);

  const distributers = await Distributer.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  return NextResponse.json({
    distributers,
    pagination: {
      totalDistributers,
      totalPages: Math.ceil(totalDistributers / limit),
    },
  });
}

// Create a new distributer (Admin + Access Required)
export async function POST(req) {
  await connectDB();

  const auth = await verifyAdminWithDistributerAccess(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = await req.json();
  const distributer = new Distributer(body);
  await distributer.save();

  return NextResponse.json(
    { message: "Distributer created successfully" },
    { status: 201 },
  );
}

// Delete distributer (Admin + Access Required)
export async function DELETE(req) {
  await connectDB();

  const auth = await verifyAdminWithDistributerAccess(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await Distributer.findByIdAndDelete(body.id);

  return NextResponse.json({ message: "Distributer deleted successfully" });
}

// Update distributer (Admin + Access Required)
export async function PUT(req) {
  await connectDB();

  const auth = await verifyAdminWithDistributerAccess(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await Distributer.findByIdAndUpdate(body.id, body, { new: true });

  return NextResponse.json({ message: "Distributer updated successfully" });
}
