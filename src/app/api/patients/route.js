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
    // Note: state abbreviation no longer used in caseId format

    function getCountryCode(country) {
      const countryCodeMap = {
        "United States": "+1",
        Canada: "+1",
        "United Kingdom": "+44",
        Germany: "+49",
        France: "+33",
        Italy: "+39",
        Spain: "+34",
        Netherlands: "+31",
        Belgium: "+32",
        Switzerland: "+41",
        Austria: "+43",
        Sweden: "+46",
        Norway: "+47",
        Denmark: "+45",
        Finland: "+358",
        Poland: "+48",
        "Czech Republic": "+420",
        Hungary: "+36",
        Romania: "+40",
        Bulgaria: "+359",
        Greece: "+30",
        Portugal: "+351",
        Ireland: "+353",
        Iceland: "+354",
        Luxembourg: "+352",
        Malta: "+356",
        Cyprus: "+357",
        Estonia: "+372",
        Latvia: "+371",
        Lithuania: "+370",
        Slovenia: "+386",
        Slovakia: "+421",
        Croatia: "+385",
        Serbia: "+381",
        Montenegro: "+382",
        "Bosnia and Herzegovina": "+387",
        "North Macedonia": "+389",
        Albania: "+355",
        Kosovo: "+383",
        Moldova: "+373",
        Ukraine: "+380",
        Belarus: "+375",
        Russia: "+7",
        Georgia: "+995",
        Armenia: "+374",
        Azerbaijan: "+994",
        Turkey: "+90",
        Israel: "+972",
        Lebanon: "+961",
        Jordan: "+962",
        Syria: "+963",
        Iraq: "+964",
        Iran: "+98",
        "Saudi Arabia": "+966",
        Kuwait: "+965",
        Qatar: "+974",
        Bahrain: "+973",
        "United Arab Emirates": "+971",
        Oman: "+968",
        Yemen: "+967",
        Egypt: "+20",
        Libya: "+218",
        Tunisia: "+216",
        Algeria: "+213",
        Morocco: "+212",
        Sudan: "+249",
        "South Sudan": "+211",
        Ethiopia: "+251",
        Eritrea: "+291",
        Djibouti: "+253",
        Somalia: "+252",
        Kenya: "+254",
        Uganda: "+256",
        Tanzania: "+255",
        Rwanda: "+250",
        Burundi: "+257",
        "Democratic Republic of the Congo": "+243",
        "Republic of the Congo": "+242",
        Gabon: "+241",
        "Equatorial Guinea": "+240",
        Cameroon: "+237",
        "Central African Republic": "+236",
        Chad: "+235",
        Niger: "+227",
        Nigeria: "+234",
        Benin: "+229",
        Togo: "+228",
        Ghana: "+233",
        "Ivory Coast": "+225",
        Liberia: "+231",
        "Sierra Leone": "+232",
        Guinea: "+224",
        "Guinea-Bissau": "+245",
        Senegal: "+221",
        "The Gambia": "+220",
        Mauritania: "+222",
        Mali: "+223",
        "Burkina Faso": "+226",
        "Cape Verde": "+238",
        "São Tomé and Príncipe": "+239",
        Angola: "+244",
        Zambia: "+260",
        Zimbabwe: "+263",
        Botswana: "+267",
        Namibia: "+264",
        "South Africa": "+27",
        Lesotho: "+266",
        Swaziland: "+268",
        Madagascar: "+261",
        Mauritius: "+230",
        Seychelles: "+248",
        Comoros: "+269",
        Malawi: "+265",
        Mozambique: "+258",
        China: "+86",
        Japan: "+81",
        "South Korea": "+82",
        "North Korea": "+850",
        Mongolia: "+976",
        Taiwan: "+886",
        "Hong Kong": "+852",
        Macau: "+853",
        Vietnam: "+84",
        Thailand: "+66",
        Myanmar: "+95",
        Laos: "+856",
        Cambodia: "+855",
        Malaysia: "+60",
        Singapore: "+65",
        Brunei: "+673",
        Philippines: "+63",
        Indonesia: "+62",
        "East Timor": "+670",
        "Papua New Guinea": "+675",
        Fiji: "+679",
        "New Zealand": "+64",
        Australia: "+61",
        India: "+91",
        Pakistan: "+92",
        Bangladesh: "+880",
        "Sri Lanka": "+94",
        Maldives: "+960",
        Nepal: "+977",
        Bhutan: "+975",
        Afghanistan: "+93",
        Kazakhstan: "+7",
        Uzbekistan: "+998",
        Turkmenistan: "+993",
        Tajikistan: "+992",
        Kyrgyzstan: "+996",
        Brazil: "+55",
        Argentina: "+54",
        Chile: "+56",
        Peru: "+51",
        Colombia: "+57",
        Venezuela: "+58",
        Ecuador: "+593",
        Bolivia: "+591",
        Paraguay: "+595",
        Uruguay: "+598",
        Guyana: "+592",
        Suriname: "+597",
        "French Guiana": "+594",
        Mexico: "+52",
        Guatemala: "+502",
        Belize: "+501",
        "El Salvador": "+503",
        Honduras: "+504",
        Nicaragua: "+505",
        "Costa Rica": "+506",
        Panama: "+507",
        Cuba: "+53",
        Jamaica: "+1876",
        Haiti: "+509",
        "Dominican Republic": "+1809",
        "Puerto Rico": "+1787",
        "Trinidad and Tobago": "+1868",
        Barbados: "+1246",
        "Saint Lucia": "+1758",
        "Saint Vincent and the Grenadines": "+1784",
        Grenada: "+1473",
        "Antigua and Barbuda": "+1268",
        "Saint Kitts and Nevis": "+1869",
        Dominica: "+1767",
        Bahamas: "+1242",
      };

      return countryCodeMap[country] || "+XX";
    }

    async function generateUniqueCaseId(country) {
      // New format: YY + MM + countryCodeWithoutPlus (padded to 4) + nextNumber
      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = (now.getMonth() + 1).toString().padStart(2, "0");

      // Convert phone code like +91 to numeric string without +, e.g., "91"
      const phoneCode = (getCountryCode(country) || "+XX").replace(/^\+/, "");
      const phoneCodePadded = phoneCode.padStart(4, "0");

      // Get the latest patient irrespective of prefix
      const lastPatient = await Patient.findOne({}, { caseId: 1 })
        .sort({ createdAt: -1, _id: -1 })
        .lean();

      let nextFive = 1;
      if (lastPatient && lastPatient.caseId) {
        const lastCaseId = String(lastPatient.caseId);
        const tail = lastCaseId.slice(-5); // last five characters
        const numericTail = parseInt(tail.replace(/\D/g, ""), 10);
        if (!Number.isNaN(numericTail)) {
          nextFive = numericTail + 1;
        }
      }

      const nextFivePadded = nextFive.toString().padStart(5, "0");

      return `${yy}${mm}${phoneCodePadded}${nextFivePadded}`;
    }

    // Only generate caseId if not already present (first creation)
    if (!patientData.caseId) {
      patientData.caseId = await generateUniqueCaseId(patientData.country);
    }

    // Create patient
    const patient = await Patient.create(patientData);

    // Send email notifications for new patient creation
    try {
      // Get the doctor who created the patient
      const doctor = await User.findById(userId)
        .select("name email role")
        .lean();

      console.log("Doctor found:", doctor); // Debug log

      if (
        doctor &&
        doctor.role === "doctor" &&
        doctor.email &&
        doctor.email.trim()
      ) {
        console.log("Sending email to doctor:", doctor.email); // Debug log

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

        try {
          await sendEmail({
            to: doctor.email,
            subject: `New Patient Created: ${patient.patientName}`,
            html: doctorEmailHtml,
          });
          console.log("Doctor email sent successfully to:", doctor.email);
        } catch (emailError) {
          console.error("Error sending doctor email:", emailError);
          // Don't fail the patient creation if doctor email fails
        }

        // Send notification email to all admins
        const admins = await User.find({ role: "admin" }, "email name").lean();
        const adminEmails = admins.map((admin) => admin.email).filter(Boolean);

        if (adminEmails.length > 0) {
          console.log("Sending admin emails to:", adminEmails); // Debug log

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

          try {
            await sendEmail({
              to: adminEmails,
              subject: `New Patient Registration: ${patient.patientName} by Dr. ${doctor.name}`,
              html: adminNotificationHtml,
            });
            console.log("Admin emails sent successfully to:", adminEmails);
          } catch (adminEmailError) {
            console.error("Error sending admin emails:", adminEmailError);
            // Don't fail the patient creation if admin emails fail
          }
        }
      } else {
        console.log("Doctor email not sent - conditions not met:", {
          doctor: !!doctor,
          role: doctor?.role,
          email: doctor?.email,
          emailTrimmed: doctor?.email?.trim(),
        });
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
