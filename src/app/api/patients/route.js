import dbConnect from '@/app/api/config/db';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import { NextResponse } from 'next/server';
import Patient from '../models/Patient';

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const search = searchParams.get('search') || '';

  // Get filter parameters
  const gender = searchParams.get('gender') || '';
  const country = searchParams.get('country') || '';
  const city = searchParams.get('city') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const state = searchParams.get('state') || '';
  const caseCategory = searchParams.get('caseCategory') || '';
  const caseType = searchParams.get('caseType') || '';
  const selectedPrice = searchParams.get('selectedPrice') || '';
  const treatmentFor = searchParams.get('treatmentFor') || '';
  const caseStatus = searchParams.get('caseStatus') || '';
  const sort = searchParams.get('sort') || '';

  // Get userId from token
  const authResult = await verifyAuth(req);
  if (!authResult.success || !authResult.user || !authResult.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = authResult.user.id;

  const query = { userId };

  // Search functionality
  if (search) {
    query.$or = [
      { patientName: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { caseId: { $regex: search, $options: 'i' } },
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

  let sortOption = {};

  if (sort === 'latest') {
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
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    // Get userId from token
    const authResult = await verifyAuth(req);
    
    
    if (!authResult.success || !authResult.user || !authResult.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.user.id;
    
    let patientData = {
      userId: userId,
    };

    // Check content type to determine how to parse the request
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON data
      const jsonData = await req.json();
      patientData = { ...patientData, ...jsonData };
    } else if (contentType.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await req.formData();
      console.log('FormData received');
      
      // Process form fields
      for (const [key, value] of formData.entries()) {
        if (key !== 'scanFiles') {
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
      const files = formData.getAll('scanFiles');
      const scanFiles = files.map((file, index) => ({
        fileName: file.name,
        fileUrl: `/uploads/${Date.now()}-${index}-${file.name}`, // Placeholder URL
        uploadedAt: new Date(),
      }));

      patientData.scanFiles = scanFiles;
    }

    // --- CASE ID GENERATION LOGIC ---
    function getStateAbbreviation(state) {
      if (!state) return '';
      const words = state.trim().split(' ');
      if (words.length > 1) {
        return words.map(w => w[0].toUpperCase()).join('');
      } else {
        return state.substring(0, 3).toUpperCase();
      }
    }

    async function generateUniqueCaseId(state) {
      const prefix = '+91';
      const stateAbbr = getStateAbbreviation(state);
      let caseId = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 100; // Prevent infinite loops

      while (!isUnique && attempts < maxAttempts) {
        const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7-digit
        caseId = `${prefix}${stateAbbr}${randomNum}`;
        console.log('Attempting caseId:', caseId);
        const exists = await Patient.findOne({ caseId });
        if (!exists) isUnique = true;
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique case ID after multiple attempts');
      }

      return caseId;
    }

    // Only generate caseId if not already present (first creation)
    if (!patientData.caseId) {
      
      patientData.caseId = await generateUniqueCaseId(patientData.state);
      
    }
    // --- END CASE ID GENERATION ---

   // Create patient
    const patient = await Patient.create(patientData);
  
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error('Error in POST:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A patient with this information already exists' },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
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