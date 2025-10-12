import { NextResponse } from "next/server";
import { handleError } from "../../../utils/errorHandler";
import connectDB from "../../../config/db";
import Patient from "../../../models/Patient";
import { verifyAuth } from "../../../middleware/authMiddleware";
import { jsPDF } from "jspdf";

export async function GET(req) {
  try {
    await connectDB();

    // Verify authentication and admin role
    const authResult = await verifyAuth(req, ["admin"]);

    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get patient ID from query params
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("id");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 },
      );
    }

    // Fetch patient data
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
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
      checkPageBreak(25);

      // Draw background box
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, "F");

      // Add title
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(title.toUpperCase(), margin + 3, yPos + 7);

      yPos += 18; // Increased from 13 to 18 for more gap
    };

    // Helper function to add subsection header
    const addSubsectionHeader = (title) => {
      checkPageBreak(18);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(title, margin + 2, yPos);
      yPos += 3;

      // Add subtle line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin + 2, yPos, pageWidth - margin, yPos);
      yPos += 8; // Increased from 6 to 8 for more gap
    };

    // Helper function to add field with better formatting
    const addField = (label, value, indent = 0) => {
      checkPageBreak(12);

      if (value === undefined || value === null || value === "") {
        value = "Not specified";
      }

      // Ensure value is a string
      value = String(value);

      // Label
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(75, 85, 99);
      doc.text(`${label}:`, margin + 2 + indent, yPos);

      // Value with wrapping
      doc.setFont("helvetica", "normal");
      doc.setTextColor(31, 41, 55);
      const splitValue = doc.splitTextToSize(value, contentWidth - 50 - indent);
      doc.text(splitValue, margin + 50 + indent, yPos);

      yPos += Math.max(7, splitValue.length * 5);
    };

    // Helper function to add list field
    const addListField = (label, items) => {
      checkPageBreak(10);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(75, 85, 99);
      doc.text(`${label}:`, margin + 2, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);

      if (items && items.length > 0) {
        items.forEach((item) => {
          checkPageBreak(6);
          doc.text(`   • ${item}`, margin + 4, yPos);
          yPos += 4.5;
        });
      } else {
        doc.text("   None", margin + 4, yPos);
        yPos += 4.5;
      }
      yPos += 3;
    };

    // ==================== PDF HEADER ====================
    // Title box
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("PATIENT MEDICAL RECORD", pageWidth / 2, 15, { align: "center" });

    // Case ID and Patient Name
    if (patient.caseId) {
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`Case ID: ${patient.caseId}`, pageWidth / 2, 23, {
        align: "center",
      });
    }

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105);
    doc.text(
      `Patient: ${patient.patientName || "Unknown"}`,
      pageWidth / 2,
      30,
      { align: "center" },
    );

    yPos = 42;

    // ==================== GENERAL INFORMATION ====================
    addSectionHeader("GENERAL INFORMATION", [37, 99, 235]);

    addField("Patient Name", patient.patientName);
    addField("Age", patient.age);
    addField("Gender", patient.gender);
    addField("Country", patient.country);
    addField("State/Province", patient.state);
    addField("City", patient.city);

    yPos += 5;

    // ==================== ADDRESS INFORMATION ====================
    addSectionHeader("ADDRESS INFORMATION", [124, 58, 237]);

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

    yPos += 5;

    // ==================== CLINICAL INFORMATION ====================
    checkPageBreak(35);
    addSectionHeader("CLINICAL INFORMATION", [5, 150, 105]);

    // Facial Assessment
    addSubsectionHeader("Facial Assessment");
    addField("Convex", patient.facialConvex || dentalExam.facialConvex);
    addField("Concave", patient.facialConcave || dentalExam.facialConcave);
    addField("Straight", patient.facialStraight || dentalExam.facialStraight);
    yPos += 3;

    // Lip Assessment
    addSubsectionHeader("Lip Assessment");
    addField(
      "Lip Posture & Tonicity",
      patient.lipPostureTonicity || dentalExam.lipPostureTonicity,
    );
    addField(
      "Lip Competence",
      patient.lipCompetence || dentalExam.lipCompetence,
    );
    yPos += 3;

    // TMJ Examination
    addSubsectionHeader("TMJ Examination");
    addField("Max Opening", patient.maxOpening || dentalExam.maxOpening);
    addField("Protrusion", patient.protrusion || dentalExam.protrusion);
    addField(
      "Right Excursion",
      patient.rightExcursion || dentalExam.rightExcursion,
    );
    addField(
      "Left Excursion",
      patient.leftExcursion || dentalExam.leftExcursion,
    );
    addField("TMJ Comments", patient.tmjComments || dentalExam.tmjComments);
    yPos += 3;

    // Soft Tissue Examination
    addSubsectionHeader("Soft Tissue Examination");
    addField("Gum", patient.gum || dentalExam.gum);
    addField(
      "Frenal Attachment Location",
      patient.frenalAttachmentLocation || dentalExam.frenalAttachmentLocation,
    );
    addField(
      "Frenal Attachment Type",
      patient.frenalAttachmentType || dentalExam.frenalAttachmentType,
    );
    addField("Tongue", patient.tongue || dentalExam.tongue);
    addField("Oral Mucosa", patient.oralMucosa || dentalExam.oralMucosa);
    addListField(
      "Gingival Recession Teeth",
      patient.gingivalRecessionTeeth || dentalExam.gingivalRecessionTeeth || [],
    );
    addField(
      "Gingival Recession Comments",
      patient.gingivalRecessionComments || dentalExam.gingivalRecessionComments,
    );
    yPos += 3;

    // ==================== HARD TISSUE EXAMINATION ====================
    checkPageBreak(35);
    addSectionHeader("HARD TISSUE EXAMINATION", [124, 58, 237]);

    addListField(
      "Caries Teeth",
      patient.cariesTeeth || dentalExam.cariesTeeth || [],
    );
    addListField(
      "Missing Teeth",
      patient.missingToothTeeth || dentalExam.missingToothTeeth || [],
    );
    addListField(
      "Impacted Teeth",
      patient.impactedToothTeeth || dentalExam.impactedToothTeeth || [],
    );

    const hasSupernumerary =
      patient.hasSupernumeraryTooth || dentalExam.hasSupernumeraryTooth;
    addField("Has Supernumerary Tooth", hasSupernumerary ? "Yes" : "No");
    if (hasSupernumerary) {
      addListField(
        "Supernumerary Teeth",
        patient.supernumeraryToothTeeth ||
          dentalExam.supernumeraryToothTeeth ||
          [],
      );
      addField(
        "Supernumerary Description",
        patient.supernumeraryToothDescription ||
          dentalExam.supernumeraryToothDescription,
      );
    }

    addListField(
      "Endodontically Treated Teeth",
      patient.endodonticallyTreatedToothTeeth ||
        dentalExam.endodonticallyTreatedToothTeeth ||
        [],
    );
    addListField(
      "Occlusal Wear Teeth",
      patient.occlusalWearTeeth || dentalExam.occlusalWearTeeth || [],
    );
    addListField(
      "Prosthesis Teeth",
      patient.prosthesisTeeth || dentalExam.prosthesisTeeth || [],
    );
    addField(
      "Prosthesis Comments",
      patient.prosthesisComments || dentalExam.prosthesisComments,
    );

    yPos += 5;

    // ==================== ARCH INFORMATION ====================
    checkPageBreak(35);
    addSectionHeader("ARCH INFORMATION", [14, 116, 144]);

    // Maxillary Arch
    addSubsectionHeader("Maxillary Arch");
    addField(
      "Shape",
      patient.maxillaryArcShape || dentalExam.maxillaryArcShape,
    );
    addField(
      "Symmetry",
      patient.maxillaryArcSymmetry || dentalExam.maxillaryArcSymmetry,
    );
    addField(
      "Alignment",
      patient.maxillaryArcAlignment || dentalExam.maxillaryArcAlignment,
    );
    yPos += 3;

    // Mandibular Arch
    addSubsectionHeader("Mandibular Arch");
    const mandibularShape =
      patient.mandibularArcShape || dentalExam.mandibularArcShape;
    addListField(
      "Shape",
      Array.isArray(mandibularShape)
        ? mandibularShape
        : mandibularShape
          ? [mandibularShape]
          : [],
    );
    addField(
      "Symmetry",
      patient.mandibularArcSymmetry || dentalExam.mandibularArcSymmetry,
    );
    addField(
      "Alignment",
      patient.mandibularArcAlignment || dentalExam.mandibularArcAlignment,
    );
    yPos += 3;

    // Midline Assessment
    addSubsectionHeader("Midline Assessment");
    addField(
      "Coincide with Facial Midline",
      patient.midlineCoincide || dentalExam.midlineCoincide,
    );
    addField(
      "Shifted to Left",
      patient.midlineShiftedLeft || dentalExam.midlineShiftedLeft,
    );
    addField(
      "Shifted to Right",
      patient.midlineShiftedRight || dentalExam.midlineShiftedRight,
    );
    yPos += 3;

    // ==================== ANTERIO POSTERIOR RELATIONSHIP ====================
    addSubsectionHeader("Anterio Posterior Relationship");
    addField(
      "Molar Relation",
      patient.molarRelation || dentalExam.molarRelation,
    );
    addField(
      "Molar Relation Comments",
      patient.molarRelationComments || dentalExam.molarRelationComments,
    );
    addField(
      "Canine Relation",
      patient.canineRelation || dentalExam.canineRelation,
    );
    addField(
      "Canine Relation Comments",
      patient.canineRelationComments || dentalExam.canineRelationComments,
    );
    addField("Overjet", patient.overjet || dentalExam.overjet);
    addField("Overbite", patient.overbite || dentalExam.overbite);
    yPos += 3;

    // Transverse Relationship
    addSubsectionHeader("Transverse Relationship");
    addListField(
      "Affected Teeth",
      patient.transverseRelationshipTeeth ||
        dentalExam.transverseRelationshipTeeth ||
        [],
    );
    addField(
      "Comments",
      patient.transverseRelationshipComments ||
        dentalExam.transverseRelationshipComments,
    );

    yPos += 5;

    // ==================== TREATMENT PLAN ====================
    checkPageBreak(35);
    addSectionHeader("TREATMENT PLAN", [5, 150, 105]);

    const treatmentConcerns = [];
    if (patient.treatmentPlanProtrusion || dentalExam.treatmentPlanProtrusion)
      treatmentConcerns.push("Protrusion");
    if (patient.treatmentPlanCrowding || dentalExam.treatmentPlanCrowding)
      treatmentConcerns.push("Crowding");
    if (patient.treatmentPlanSpacing || dentalExam.treatmentPlanSpacing)
      treatmentConcerns.push("Spacing");
    if (patient.treatmentPlanOpenBite || dentalExam.treatmentPlanOpenBite)
      treatmentConcerns.push("Open Bite");
    if (patient.treatmentPlanOverBite || dentalExam.treatmentPlanOverBite)
      treatmentConcerns.push("Over Bite");
    if (patient.treatmentPlanOverJet || dentalExam.treatmentPlanOverJet)
      treatmentConcerns.push("Over Jet");
    if (
      patient.treatmentPlanMidlineShift ||
      dentalExam.treatmentPlanMidlineShift
    )
      treatmentConcerns.push("Midline Shift");
    if (patient.treatmentPlanUnderbite || dentalExam.treatmentPlanUnderbite)
      treatmentConcerns.push("Underbite");
    if (
      patient.treatmentPlanAsymmetricJaw ||
      dentalExam.treatmentPlanAsymmetricJaw
    )
      treatmentConcerns.push("Asymmetric Jaw");
    if (patient.treatmentPlanGummySmile || dentalExam.treatmentPlanGummySmile)
      treatmentConcerns.push("Gummy Smile");
    if (patient.treatmentPlanCrossbite || dentalExam.treatmentPlanCrossbite)
      treatmentConcerns.push("Crossbite");
    if (patient.treatmentPlanNarrowArch || dentalExam.treatmentPlanNarrowArch)
      treatmentConcerns.push("Narrow Arch");
    if (patient.treatmentPlanClassI || dentalExam.treatmentPlanClassI)
      treatmentConcerns.push("Class I");
    if (patient.treatmentPlanClassIIDiv1 || dentalExam.treatmentPlanClassIIDiv1)
      treatmentConcerns.push("Class II Div 1");
    if (patient.treatmentPlanClassIIDiv2 || dentalExam.treatmentPlanClassIIDiv2)
      treatmentConcerns.push("Class II Div 2");
    if (patient.treatmentPlanClassIII || dentalExam.treatmentPlanClassIII)
      treatmentConcerns.push("Class III");

    addListField("Patient Concerns", treatmentConcerns);
    addField(
      "Treatment Plan Comments",
      patient.treatmentPlanComments || dentalExam.treatmentPlanComments,
    );

    yPos += 5;

    // How to Gain Space
    addSubsectionHeader("How to Gain Space");
    addField("IPR Type", patient.iprType || dentalExam.iprType);
    addField("IPR Measure", patient.iprMeasure || dentalExam.iprMeasure);
    addField(
      "Expansion Type",
      patient.expansionType || dentalExam.expansionType,
    );
    addField(
      "Extraction",
      patient.gainSpaceExtraction || dentalExam.gainSpaceExtraction,
    );

    if (
      (patient.gainSpaceExtraction || dentalExam.gainSpaceExtraction) === "yes"
    ) {
      addListField(
        "Extraction Teeth",
        patient.gainSpaceExtractionTeeth ||
          dentalExam.gainSpaceExtractionTeeth ||
          [],
      );
      addField(
        "Extraction Type",
        patient.extractionType || dentalExam.extractionType,
      );
    }

    addField(
      "Distalization",
      patient.gainSpaceDistalization || dentalExam.gainSpaceDistalization,
    );
    if (
      (patient.gainSpaceDistalization || dentalExam.gainSpaceDistalization) ===
      "yes"
    ) {
      addListField(
        "Distalization Teeth",
        patient.gainSpaceDistalizationTeeth ||
          dentalExam.gainSpaceDistalizationTeeth ||
          [],
      );
    }

    addField(
      "Proclination",
      patient.gainSpaceProclination || dentalExam.gainSpaceProclination,
    );
    if (
      (patient.gainSpaceProclination || dentalExam.gainSpaceProclination) ===
      "yes"
    ) {
      addListField(
        "Proclination Teeth",
        patient.gainSpaceProclinationTeeth ||
          dentalExam.gainSpaceProclinationTeeth ||
          [],
      );
    }

    addField(
      "Any Other Comments",
      patient.anyOtherComments || dentalExam.anyOtherComments,
    );

    yPos += 5;

    // ==================== EXTRACTION & IPR DETAILS ====================
    const extraction = patient.extraction || dentalExam.extraction;
    const ipr =
      patient.interproximalReduction || dentalExam.interproximalReduction;
    const measureIPR = patient.measureOfIPR || dentalExam.measureOfIPR;

    if (extraction && typeof extraction === "object") {
      checkPageBreak(20);
      addSubsectionHeader("Extraction Details");
      addField("Required", extraction.required ? "Yes" : "No");
      addField("Comments", extraction.comments);
      yPos += 3;
    }

    if (ipr && typeof ipr === "object") {
      checkPageBreak(20);
      addSubsectionHeader("Interproximal Reduction Details");
      addField("Detail 1", ipr.detail1);
      addField("Detail 2", ipr.detail2);
      addField("Detail 3", ipr.detail3);
      addField("Detail 4", ipr.detail4);
      yPos += 3;
    }

    if (measureIPR && typeof measureIPR === "object") {
      checkPageBreak(20);
      addSubsectionHeader("Measure of IPR");
      addField("Detail A", measureIPR.detailA);
      addField("Detail B", measureIPR.detailB);
      addField("Detail C", measureIPR.detailC);
      yPos += 3;
    }

    // ==================== FILE LINKS ====================
    checkPageBreak(35);
    addSectionHeader("UPLOADED FILES & DOCUMENTS", [124, 58, 237]);

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "italic");
    const wrappedText = doc.splitTextToSize(
      "Below are the links to all uploaded files for this patient. Click on the links in the PDF to view or download the files.",
      contentWidth,
    );
    doc.text(wrappedText, margin + 2, yPos);
    yPos += wrappedText.length * 4 + 8;

    // Dental Examination Files
    if (patient.dentalExaminationFiles) {
      const fileLabels = {
        img1: "Upper Arch Image",
        img2: "Lower Arch Image",
        img3: "Anterior View Image",
        img4: "Left View Image",
        img5: "Right View Image",
        img6: "Open Mouth Image",
        img7: "Profile View Image",
        img8: "Frontal View Image",
        img9: "Smiling Image",
        img10: "Lateral Cephalogram X-Ray",
        img11: "OPG X-Ray",
        model1: "3D Model - Maxillary (PLY/STL)",
        model2: "3D Model - Mandibular (PLY/STL)",
      };

      let hasFiles = false;

      Object.keys(fileLabels).forEach((key) => {
        const files = patient.dentalExaminationFiles[key];
        if (files && files.length > 0 && files[0]?.fileUrl) {
          checkPageBreak(12);
          hasFiles = true;

          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(71, 85, 105);
          doc.text(`${fileLabels[key]}:`, margin + 3, yPos);
          yPos += 5;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(37, 99, 235);

          const urlText = doc.splitTextToSize(
            files[0].fileUrl,
            contentWidth - 6,
          );
          doc.textWithLink(urlText[0], margin + 6, yPos, {
            url: files[0].fileUrl,
          });

          yPos += 6;
        }
      });

      if (!hasFiles) {
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.setFont("helvetica", "italic");
        doc.text("No dental examination files uploaded", margin + 3, yPos);
        yPos += 6;
      }
    }

    yPos += 5;

    // Scan Files
    if (patient.scanFiles && patient.scanFiles.length > 0) {
      checkPageBreak(20);
      addSubsectionHeader("Additional Scan Files");

      patient.scanFiles.forEach((file, index) => {
        checkPageBreak(12);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(`Scan File ${index + 1}:`, margin + 3, yPos);
        yPos += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(37, 99, 235);

        if (file.fileName) {
          doc.text(`Filename: ${file.fileName}`, margin + 6, yPos);
          yPos += 4;
        }

        const urlText = doc.splitTextToSize(file.fileUrl, contentWidth - 6);
        doc.textWithLink(urlText[0], margin + 6, yPos, {
          url: file.fileUrl,
        });

        yPos += 7;
      });
    }

    // ==================== PAYMENT INFORMATION ====================
    if (patient.paymentReceived || patient.paymentPending) {
      checkPageBreak(20);
      addSectionHeader("PAYMENT INFORMATION", [234, 88, 12]);

      addField("Payment Received", patient.paymentReceived || "0");
      addField("Payment Pending", patient.paymentPending || "0");
      yPos += 3;
    }

    // ==================== CASE STATUS ====================
    if (patient.caseStatus) {
      checkPageBreak(15);
      addSectionHeader("CASE STATUS", [5, 150, 105]);
      addField("Status", patient.caseStatus);
      yPos += 3;
    }

    // Add footers to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageNumber = i;
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      const footerText = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} | Page ${pageNumber} of ${totalPages}`;
      doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: "center" });

      // Add a subtle line above footer
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
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
