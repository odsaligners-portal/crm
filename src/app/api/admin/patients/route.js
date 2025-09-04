import dbConnect from "@/app/api/config/db";

import { NextResponse } from "next/server";
import Patient from "@/app/api/models/Patient";
import { admin } from "../../middleware/authMiddleware";

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
  const sort = searchParams.get("sort") || "";
  const caseStatus = searchParams.get("caseStatus") || "";

  // Get userId from token
  const authResult = await admin(req);

  if (!authResult.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = {};

  // Search functionality
  if (search) {
    query.$or = [
      { patientName: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { caseId: { $regex: search, $options: "i" } },
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
  if (caseStatus) {
    query.caseStatus = caseStatus;
  }
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  let sortOption = { createdAt: -1 };

  if (sort === "oldest") {
    sortOption = { createdAt: 1 };
  }

  try {
    const skip = (page - 1) * limit;
    const patients = await Patient.find(query)
      .populate("userId", "name")
      .populate("plannerId", "name")
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
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    // Only allow admin users
    const authResult = await admin(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optionally, you can get the admin userId if needed
    // const userId = authResult.user.id;
    let patientData = {};

    // Check content type to determine how to parse the request
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Handle JSON data
      const jsonData = await req.json();
      patientData = { ...patientData, ...jsonData };
    } else if (contentType.includes("multipart/form-data")) {
      // Handle FormData
      const formData = await req.formData();

      // Process form fields
      for (const [key, value] of formData.entries()) {
        if (key !== "scanFiles") {
          try {
            // Try to parse as JSON for nested objects
            patientData[key] = JSON.parse(value);
          } catch {
            // If not JSON, use as string
            patientData[key] = value;
          }
        }
      }

      // Handle file uploads
      const files = formData.getAll("scanFiles");
      const scanFiles = files.map((file, index) => ({
        fileName: file.name,
        fileUrl: `/uploads/${Date.now()}-${index}-${file.name}`, // Placeholder URL
        uploadedAt: new Date(),
      }));

      patientData.scanFiles = scanFiles;
    }

    // --- CASE ID GENERATION LOGIC ---
    function getStateAbbreviation(state) {
      if (!state) return "";
      const words = state.trim().split(" ");
      if (words.length > 1) {
        return words.map((w) => w[0].toUpperCase()).join("");
      } else {
        return state.substring(0, 3).toUpperCase();
      }
    }

    async function generateUniqueCaseId(state) {
      const prefix = "+91";
      const stateAbbr = getStateAbbreviation(state);
      let caseId = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!isUnique && attempts < maxAttempts) {
        const randomNum = Math.floor(1000000 + Math.random() * 900000000);
        caseId = `${prefix}${stateAbbr}${randomNum}`;
        const exists = await Patient.findOne({ caseId });
        if (!exists) isUnique = true;
        attempts++;
      }

      if (!isUnique) {
        throw new Error(
          "Failed to generate unique case ID after multiple attempts",
        );
      }

      return caseId;
    }

    if (!patientData.caseId) {
      patientData.caseId = await generateUniqueCaseId(patientData.state);
    }

    const patient = await Patient.create(patientData);
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error in POST:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A patient with this information already exists" },
        { status: 400 },
      );
    }
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message,
      );
      return NextResponse.json(
        { error: validationErrors.join(", ") },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
