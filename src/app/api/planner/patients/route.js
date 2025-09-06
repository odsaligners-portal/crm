import dbConnect from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import { NextResponse } from "next/server";
import Patient from "../../models/Patient";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const search = searchParams.get("search") || "";

  // Get filter parameters
  const gender = searchParams.get("gender") || "";
  const country = searchParams.get("country") || "";
  const city = searchParams.get("city") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const state = searchParams.get("state") || "";
  const caseCategory = searchParams.get("caseCategory") || "";
  const caseType = searchParams.get("caseType") || "";
  const selectedPrice = searchParams.get("selectedPrice") || "";
  const treatmentFor = searchParams.get("treatmentFor") || "";
  const caseStatus = searchParams.get("caseStatus") || "";
  const sort = searchParams.get("sort") || "";

  // Get userId from token
  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user || !authResult.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = authResult.user.id;

  // Base query conditions
  const baseConditions = [
    { caseStatus: "setup pending" }, // Setup pending cases
    {
      caseStatus: "approved",
      "stlFile.uploaded": { $ne: true }, // Approved cases where STL is not uploaded
    },
  ];

  // If caseStatus filter is specified, override the base conditions
  if (caseStatus) {
    if (caseStatus === "setup pending") {
      baseConditions.splice(1, 1); // Remove approved condition
    } else if (caseStatus === "approved") {
      baseConditions.splice(0, 1); // Remove setup pending condition
    }
  }

  const query = {
    plannerId: userId,
    $or: baseConditions,
  };

  // Search functionality
  if (search) {
    query.$and = [
      {
        $or: [
          { patientName: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
          { caseId: { $regex: search, $options: "i" } },
        ],
      },
    ];
  }

  // Filter functionality
  if (gender) {
    query.gender = gender;
  }

  if (country) {
    query.country = country;
  }

  if (city) {
    query.city = city;
  }

  if (state) {
    query.state = state;
  }

  if (caseCategory) {
    query.caseCategory = caseCategory;
  }

  if (caseType) {
    query.caseType = caseType;
  }

  if (selectedPrice) {
    query.selectedPrice = selectedPrice;
  }

  if (treatmentFor) {
    query.treatmentFor = treatmentFor;
  }

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  let sortOption = {};

  if (sort === "latest") {
    sortOption = { createdAt: -1 };
  }

  try {
    const skip = (page - 1) * limit;
    const patients = await Patient.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Patient.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      patients,
      pagination: {
        currentPage: page,
        totalPages,
        totalPatients: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 },
    );
  }
}
