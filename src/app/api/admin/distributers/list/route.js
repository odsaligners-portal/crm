import { NextResponse } from "next/server";
import connectDB from "@/app/api/config/db";
import Distributer from "@/app/api/models/Distributer";
import { admin } from "@/app/api/middleware/authMiddleware";

export async function GET(req) {
  await connectDB();

  const authResult = await admin(req);
  if (!authResult.success) {
    return NextResponse.json({ message: authResult.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const distributers =
      await Distributer.find(query).select("name email role");

    return NextResponse.json({
      success: true,
      distributers: distributers.map((d) => ({
        _id: d._id,
        name: d.name,
        email: d.email,
        role: d.role,
      })),
    });
  } catch (error) {
    console.error("Error fetching distributers:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server Error" },
      { status: 500 },
    );
  }
}
