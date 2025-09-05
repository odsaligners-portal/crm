import dbConnect from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import { NextResponse } from "next/server";
import Patient from "../models/Patient";
import User from "../models/User";
import { sendEmail } from "../utils/mailer";

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

  const query = { userId };

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
    // Handle comma-separated caseStatus values for multi-select
    const caseStatusArray = caseStatus
      .split(",")
      .filter((status) => status.trim() !== "");
    if (caseStatusArray.length > 0) {
      query.caseStatus = { $in: caseStatusArray };
    }
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

    // Get userId from token
    const authResult = await verifyAuth(req);

    if (!authResult.success || !authResult.user || !authResult.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = authResult.user.id;

    let patientData = {};

    // Check content type to determine how to parse the request
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Handle JSON data
      const jsonData = await req.json();
      patientData = { ...patientData, ...jsonData };

      // Set createdBy to the authenticated user (who is creating the patient)
      patientData.createdBy = userId;

      // If userId is not provided in the request, use the authenticated user's ID
      // This handles the case where a doctor creates their own patient
      if (!patientData.userId) {
        patientData.userId = userId;
      }
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

      // Set createdBy to the authenticated user (who is creating the patient)
      patientData.createdBy = userId;

      // If userId is not provided in the request, use the authenticated user's ID
      // This handles the case where a doctor creates their own patient
      if (!patientData.userId) {
        patientData.userId = userId;
      }
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
      const maxAttempts = 100; // Prevent infinite loops

      while (!isUnique && attempts < maxAttempts) {
        const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7-digit
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

    // Only generate caseId if not already present (first creation)
    if (!patientData.caseId) {
      patientData.caseId = await generateUniqueCaseId(patientData.state);
    }

    // Create patient
    const patient = await Patient.create(patientData);

    // Send email notifications for new patient creation
    try {
      // Get the doctor who created the patient
      const doctor = await User.findById(userId)
        .select("name email role")
        .lean();

      if (doctor && doctor.role === "doctor") {
        // Send confirmation email to doctor
        const doctorEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Patient Created</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { margin-bottom: 30px; }
              .patient-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8; }
              .patient-info h3 { margin: 0 0 15px 0; color: #17a2b8; font-size: 18px; }
              .patient-info p { margin: 5px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .cta-button:hover { opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>👤 New Patient Created</h1>
              </div>
              
              <div class="content">
                <p>Dear Dr. ${doctor.name},</p>
                
                <p>You have successfully created a new patient record in the system.</p>
                
                <div class="patient-info">
                  <h3>📋 Patient Details</h3>
                  <p><strong>Patient Name:</strong> ${patient.patientName}</p>
                  <p><strong>Case ID:</strong> ${patient.caseId}</p>
                  <p><strong>Age:</strong> ${patient.age} years</p>
                  <p><strong>Gender:</strong> ${patient.gender}</p>
                  <p><strong>Location:</strong> ${patient.city}, ${patient.state}</p>
                  <p><strong>Treatment For:</strong> ${patient.treatmentFor || "Not specified"}</p>
                  <p><strong>Created Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <p>You can now start managing this patient's treatment and track their progress.</p>
                
                
              </div>
              
              <div class="footer">
                <p>This is an automated notification from the Patient Management System.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: doctor.email,
          subject: `New Patient Created: ${patient.patientName}`,
          html: doctorEmailHtml,
        });

        // Send notification email to all admins
        const admins = await User.find({ role: "admin" }, "email name").lean();
        const adminEmails = admins.map((admin) => admin.email).filter(Boolean);

        if (adminEmails.length > 0) {
          const adminNotificationHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Patient Registration</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                .content { margin-bottom: 30px; }
                .patient-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
                .patient-info h3 { margin: 0 0 15px 0; color: #28a745; font-size: 18px; }
                .patient-info p { margin: 5px 0; }
                .doctor-info { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .doctor-info h3 { margin: 0 0 15px 0; color: #495057; font-size: 16px; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .cta-button:hover { opacity: 0.9; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>👥 New Patient Registration</h1>
                </div>
                
                <div class="content">
                  <p>Hello Admin,</p>
                  
                  <p>A new patient has been registered by Dr. ${doctor.name} and requires your attention.</p>
                  
                  <div class="patient-info">
                    <h3>👤 Patient Information</h3>
                    <p><strong>Patient Name:</strong> ${patient.patientName}</p>
                    <p><strong>Case ID:</strong> ${patient.caseId}</p>
                    <p><strong>Age:</strong> ${patient.age} years</p>
                    <p><strong>Gender:</strong> ${patient.gender}</p>
                    <p><strong>Location:</strong> ${patient.city}, ${patient.state}</p>
                    <p><strong>Treatment For:</strong> ${patient.treatmentFor || "Not specified"}</p>
                    <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <div class="doctor-info">
                    <h3>👨‍⚕️ Doctor Information</h3>
                    <p><strong>Doctor Name:</strong> Dr. ${doctor.name}</p>
                    <p><strong>Doctor Email:</strong> ${doctor.email}</p>
                  </div>
                  
                  <p>Please review the patient's information and take any necessary administrative actions.</p>
                  
                
                </div>
                
                <div class="footer">
                  <p>This is an automated notification from the Patient Management System.</p>
                  <p>Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail({
            to: adminEmails,
            subject: `New Patient Registration: ${patient.patientName} by Dr. ${doctor.name}`,
            html: adminNotificationHtml,
          });
        }
      }
    } catch (emailError) {
      console.error("Error sending patient creation emails:", emailError);
      // Don't fail the patient creation if email fails
    }

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error in POST:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A patient with this information already exists" },
        { status: 400 },
      );
    }

    // Handle validation errors
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
