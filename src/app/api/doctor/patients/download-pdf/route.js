import { NextResponse } from "next/server";
import { handleError } from "@/app/api/utils/errorHandler";
import dbConnect from "@/app/api/config/db";
import Patient from "@/app/api/models/Patient";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import { jsPDF } from "jspdf";

export async function GET(req) {
  try {
    await dbConnect();

    // Verify authentication and doctor role
    const authResult = await verifyAuth(req);

    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = authResult.user.id;

    // Get patient ID from query params
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("id");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 },
      );
    }

    // Fetch patient data and verify it belongs to the doctor
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Verify the patient belongs to this doctor
    if (patient.userId.toString() !== doctorId.toString()) {
      return NextResponse.json(
        { error: "Unauthorized: This patient does not belong to you" },
        { status: 403 },
      );
    }

    // Extract dental examination data if nested
    const dentalExam = patient.dentalExamination || {};

    // Create PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let yPos = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Helper function to check if we need a new page
    const checkPageBreak = (neededSpace = 20) => {
      if (yPos + neededSpace > pageHeight - 25) {
        doc.addPage();
        yPos = 15;
        return true;
      }
      return false;
    };

    // Helper function to add section header with box
    const addSectionHeader = (title, color = [37, 99, 235]) => {
      checkPageBreak(15);
      doc.setFillColor(...color);
      doc.roundedRect(margin, yPos, contentWidth, 10, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 5, yPos + 7);
      doc.setTextColor(0, 0, 0);
      yPos += 15;
    };

    // Helper function to add field
    const addField = (label, value, isBold = false) => {
      checkPageBreak(10);
      const displayValue = value || "Not specified";
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin + 5, yPos);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(
        String(displayValue),
        contentWidth - 20,
      );
      doc.text(lines, margin + 5, yPos + 5);
      yPos += lines.length * 5 + 3;
    };

    // ==================== HEADER ====================
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PATIENT DETAILS REPORT", pageWidth / 2, yPos + 12, {
      align: "center",
    });
    doc.setTextColor(0, 0, 0);
    yPos += 25;

    // ==================== BASIC INFORMATION ====================
    addSectionHeader("BASIC INFORMATION", [37, 99, 235]);

    addField("Case ID", patient.caseId);
    addField("Patient Name", patient.patientName);
    addField("Age", patient.age);
    addField("Gender", patient.gender);
    addField("Treatment For", patient.treatmentFor);

    yPos += 5;

    // ==================== LOCATION INFORMATION ====================
    addSectionHeader("LOCATION INFORMATION", [124, 58, 237]);

    addField("Country", patient.country);
    addField("State", patient.state);
    addField("City", patient.city);
    addField("Primary Address", patient.primaryAddress);
    addField("Shipping Address Type", patient.shippingAddressType);
    addField("Shipping Address", patient.shippingAddress);
    addField("Billing Address", patient.billingAddress);

    yPos += 5;

    // ==================== MEDICAL HISTORY ====================
    addSectionHeader("MEDICAL HISTORY", [220, 38, 38]);

    addField(
      "Chief Complaint",
      patient.chiefComplaint || dentalExam.chiefComplaint,
    );
    addField("Past Medical History", patient.pastMedicalHistory);
    addField("Past Dental History", patient.pastDentalHistory);
    addField(
      "Family History",
      patient.familyHistory || dentalExam.familyHistory,
    );

    yPos += 5;

    // ==================== CASE INFORMATION ====================
    addSectionHeader("CASE INFORMATION", [234, 88, 12]);

    const caseType =
      patient.caseType === "Single Arch"
        ? patient.singleArchType || patient.caseType
        : patient.caseType;
    addField("Case Type", caseType);
    addField("Case Category", patient.caseCategory);
    addField("Package", patient.selectedPrice);
    addField("Case Category Details", patient.caseCategoryDetails);
    addField("Treatment Plan", patient.treatmentPlan);
    addField(
      "Nature of Availability",
      patient.natureOfAvailability || dentalExam.natureOfAvailability,
    );

    const followUpMonths = patient.followUpMonths || dentalExam.followUpMonths;
    if (
      patient.natureOfAvailability === "traveling" ||
      dentalExam.natureOfAvailability === "traveling"
    ) {
      addField(
        "Follow-up Frequency",
        followUpMonths ? `Every ${followUpMonths} months` : "Not specified",
      );
    }

    addField("Oral Habits", patient.oralHabits || dentalExam.oralHabits);
    if (
      patient.oralHabits === "anyOtherHabit" ||
      dentalExam.oralHabits === "anyOtherHabit"
    ) {
      addField(
        "Other Habit Specification",
        patient.otherHabitSpecification || dentalExam.otherHabitSpecification,
      );
    }

    // Case Dates
    if (patient.caseStartDate) {
      addField(
        "Case Start Date",
        new Date(patient.caseStartDate).toLocaleString(),
      );
    }
    if (patient.caseEndDate) {
      addField("Case End Date", new Date(patient.caseEndDate).toLocaleString());
    }

    yPos += 5;

    // ==================== DENTAL EXAMINATION ====================
    addSectionHeader("DENTAL EXAMINATION", [16, 185, 129]);

    // Hard Tissue
    addField("Caries Teeth", dentalExam.cariesTeeth?.join(", ") || "None");
    addField(
      "Missing Tooth Teeth",
      dentalExam.missingToothTeeth?.join(", ") || "None",
    );
    addField(
      "Impacted Tooth Teeth",
      dentalExam.impactedToothTeeth?.join(", ") || "None",
    );
    addField(
      "Supernumerary Tooth",
      dentalExam.hasSupernumeraryTooth ? "Yes" : "No",
    );
    if (dentalExam.hasSupernumeraryTooth) {
      addField(
        "Supernumerary Description",
        dentalExam.supernumeraryDescription,
      );
    }

    yPos += 5;

    // Soft Tissue
    addSectionHeader("SOFT TISSUE EXAMINATION", [16, 185, 129]);

    addField("Facial Symmetry", dentalExam.facialSymmetry);
    addField("Nasolabial Angle", dentalExam.nasolabialAngle);
    addField("Mentolabial Sulcus", dentalExam.mentolabialSulcus);
    addField("Lip Competency", dentalExam.lipCompetency);
    addField("Gingival Display", dentalExam.gingivalDisplay);
    addField("Smile Arc", dentalExam.smileArc);

    yPos += 5;

    // Occlusion
    addSectionHeader("OCCLUSION", [16, 185, 129]);

    addField("Overjet", dentalExam.overjet);
    addField("Overbite", dentalExam.overbite);
    addField("Crossbite", dentalExam.crossbite);
    addField("Open Bite", dentalExam.openBite);
    addField("Midline Shift", dentalExam.midlineShift);

    yPos += 5;

    // Space Analysis
    addSectionHeader("SPACE ANALYSIS", [16, 185, 129]);

    addField("Crowding", dentalExam.crowding);
    addField("Spacing", dentalExam.spacing);
    addField("Space Required", dentalExam.spaceRequired);
    addField("Space Available", dentalExam.spaceAvailable);
    addField("Space Deficit", dentalExam.spaceDeficit);
    addField("Space Surplus", dentalExam.spaceSurplus);

    yPos += 5;

    // Treatment Modifications
    addSectionHeader("TREATMENT MODIFICATIONS", [16, 185, 129]);

    addField("IPR Type", dentalExam.iprType);
    addField("IPR Measure", dentalExam.iprMeasure);
    addField("Expansion Type", dentalExam.expansionType);

    // Gain Space
    if (dentalExam.gainSpaceExtraction) {
      addField("Gain Space Extraction", "Yes");
      addField("Extraction Type", dentalExam.extractionType);
      addField("Extraction Teeth", dentalExam.extractionTeeth?.join(", "));
    }
    if (dentalExam.gainSpaceDistalization) {
      addField("Gain Space Distalization", "Yes");
      addField(
        "Distalization Teeth",
        dentalExam.distalizationTeeth?.join(", "),
      );
    }
    if (dentalExam.gainSpaceProclination) {
      addField("Gain Space Proclination", "Yes");
      addField("Proclination Teeth", dentalExam.proclinationTeeth?.join(", "));
    }

    addField(
      "Extraction Required",
      dentalExam.extractionRequired ? "Yes" : "No",
    );
    if (dentalExam.extractionRequired) {
      addField("Extraction Comments", dentalExam.extractionComments);
    }

    yPos += 5;

    // ==================== FOOTER ====================
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" },
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Patient_${patient.caseId || patientId}_Details.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return handleError(error);
  }
}
