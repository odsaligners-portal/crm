import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import User from "@/app/api/models/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { sendEmail } from "@/app/api/utils/mailer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    let patient;
    // Find patient and check if it belongs to the logged-in user
    if (authResult.user.role === "planner") {
      patient = await Patient.findOne({
        _id: id,
        plannerId: authResult.user.id, // Use id from decoded token
      }).lean();
    } else if (authResult.user.role === "doctor") {
      patient = await Patient.findOne({
        _id: id,
        userId: authResult.user.id, // Use id from decoded token
      }).lean();
    } else if (authResult.user.role === "admin") {
      patient = await Patient.findOne({
        _id: id,
      }).lean();
    }

    if (!patient && authResult.user.role !== "admin") {
      return NextResponse.json(
        {
          error: "You do not have permission to view Patient Record",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();

    // If only caseStatus is being updated, allow admin or doctor
    if (
      Object.keys(body).length === 1 &&
      Object.prototype.hasOwnProperty.call(body, "caseStatus") &&
      typeof body.caseStatus === "string"
    ) {
      // Allow admin or doctor
      if (["admin", "doctor"].includes(authResult.user.role)) {
        const updatedPatient = await Patient.findByIdAndUpdate(
          id,
          { $set: { caseStatus: body.caseStatus } },
          { new: true, runValidators: true },
        );
        if (!updatedPatient) {
          return NextResponse.json(
            { error: "Patient not found" },
            { status: 404 },
          );
        }
        return NextResponse.json(updatedPatient);
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // If modification comment is being submitted
    if (
      Object.prototype.hasOwnProperty.call(body, "modification") &&
      typeof body.modification === "object"
    ) {
      if (["admin", "doctor", "distributer"].includes(authResult.user.role)) {
        const updatedPatient = await Patient.findByIdAndUpdate(
          id,
          {
            $set: {
              "modification.commentSubmitted":
                body.modification.commentSubmitted,
              caseStatus: body.caseStatus || "setup pending",
            },
          },
          { new: true, runValidators: true },
        );
        if (!updatedPatient) {
          return NextResponse.json(
            { error: "Patient not found" },
            { status: 404 },
          );
        }
        return NextResponse.json(updatedPatient);
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Otherwise, update only if user owns the patient
    const fieldsToUpdate = Object.fromEntries(
      Object.entries({
        // Step-1 fields
        patientName: body.patientName,
        age: body.age,
        gender: body.gender,
        pastMedicalHistory: body.pastMedicalHistory,
        pastDentalHistory: body.pastDentalHistory,
        treatmentFor: body.treatmentFor,
        country: body.country,
        state: body.state,
        city: body.city,
        primaryAddress: body.primaryAddress,
        shippingAddress: body.shippingAddress,
        shippingAddressType: body.shippingAddressType,
        billingAddress: body.billingAddress,
        privacyAccepted: body.privacyAccepted,
        declarationAccepted: body.declarationAccepted,
        // Step-2/3 fields
        chiefComplaint: body.chiefComplaint,
        caseType: body.caseType,
        singleArchType: body.singleArchType,
        caseCategory: body.caseCategory,
        selectedPrice: body.selectedPrice,
        extraction: body.extraction,
        interproximalReduction: body.interproximalReduction,
        measureOfIPR: body.measureOfIPR,
        caseCategoryDetails: body.caseCategoryDetails,
        treatmentPlan: body.treatmentPlan,
        midline: body.midline,
        midlineComments: body.midlineComments,
        archExpansion: body.archExpansion,
        archExpansionComments: body.archExpansionComments,
        additionalComments: body.additionalComments,
        // Step-4 field
        scanFiles: body.scanFiles,
        // Dental Examination fields
        dentalExamination: body.dentalExamination,
        dentalExaminationFiles: body.dentalExaminationFiles,
        // Clinic Images fields
        middleClinicImages: body.middleClinicImages,
        postClinicImages: body.postClinicImages,
      }).filter(([v]) => v !== undefined),
    );

    if (authResult.user.role === "admin") {
      fieldsToUpdate.userId = body.userId;
    }

    let updatedPatient;

    if (authResult.user.role === "admin") {
      updatedPatient = await Patient.findOneAndUpdate(
        {
          _id: id,
        },
        { $set: fieldsToUpdate },
        { new: true, runValidators: true },
      );
    } else {
      updatedPatient = await Patient.findOneAndUpdate(
        {
          _id: id,
          userId: authResult.user.id,
        },
        { $set: fieldsToUpdate },
        { new: true, runValidators: true },
      );
    }

    if (!updatedPatient) {
      return NextResponse.json(
        {
          error:
            "Patient not found or you do not have permission to modify this record",
        },
        { status: 404 },
      );
    }

    // Send email notification to all admins when doctor updates patient
    if (authResult.user.role === "doctor") {
      try {
        // Get the doctor who updated the patient
        const doctor = await User.findById(authResult.user.id)
          .select("name email role")
          .lean();

        if (doctor) {
          // Send notification email to all admins
          const admins = await User.find(
            { role: "admin" },
            "email name",
          ).lean();
          const adminEmails = admins
            .map((admin) => admin.email)
            .filter(Boolean);

          if (adminEmails.length > 0) {
            const adminNotificationHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Patient Record Updated</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
                  .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                  .header { background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
                  .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                  .content { margin-bottom: 30px; }
                  .patient-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
                  .patient-info h3 { margin: 0 0 15px 0; color: #ffc107; font-size: 18px; }
                  .patient-info p { margin: 5px 0; }
                  .doctor-info { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
                  .doctor-info h3 { margin: 0 0 15px 0; color: #495057; font-size: 16px; }
                  .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
                  .cta-button { display: inline-block; background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                  .cta-button:hover { opacity: 0.9; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📝 Patient Record Updated</h1>
                  </div>
                  
                  <div class="content">
                    <p>Dear Admin,</p>
                    
                    <p>A patient record has been updated by a doctor in the system.</p>
                    
                    <div class="patient-info">
                      <h3>👤 Patient Details</h3>
                      <p><strong>Patient Name:</strong> ${updatedPatient.patientName}</p>
                      <p><strong>Case ID:</strong> ${updatedPatient.caseId}</p>
                      <p><strong>Age:</strong> ${updatedPatient.age} years</p>
                      <p><strong>Gender:</strong> ${updatedPatient.gender}</p>
                      <p><strong>Location:</strong> ${updatedPatient.city}, ${updatedPatient.state}</p>
                      <p><strong>Treatment For:</strong> ${updatedPatient.treatmentFor || "Not specified"}</p>
                      <p><strong>Updated Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="doctor-info">
                      <h3>👨‍⚕️ Doctor Information</h3>
                      <p><strong>Doctor Name:</strong> Dr. ${doctor.name}</p>
                      <p><strong>Doctor Email:</strong> ${doctor.email}</p>
                    </div>
                    
                    <p>Please review the updated patient record and take any necessary actions.</p>
                    
                    <div style="text-align: center;">
                      <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/patients" class="cta-button">
                        View Patient Records
                      </a>
                    </div>
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
              subject: `Patient Record Updated: ${updatedPatient.patientName} by Dr. ${doctor.name}`,
              html: adminNotificationHtml,
            });
          }
        }
      } catch {
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json(updatedPatient);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Delete patient only if it belongs to the logged-in user
    const patient = await Patient.findOneAndDelete({
      _id: id,
      userId: authResult.user.id, // Use id from decoded token
    });

    if (!patient) {
      return NextResponse.json(
        {
          error:
            "Patient not found or you do not have permission to delete this record",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
