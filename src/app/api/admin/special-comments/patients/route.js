import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

// GET - Fetch all patients for dropdown
export const GET = async (req) => {
  try {
    await dbConnect();
    const authResult = await verifyAuth(req);

    // Ensure the user is an admin or super-admin
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!["admin", "super-admin"].includes(authResult.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit")) || 50;

    // Build search query
    let query = {};
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: "i" } },
        { caseId: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch patients with search and limit
    const patients = await Patient.find(query)
      .select("_id caseId patientName")
      .sort({ patientName: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      patients: patients,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};
