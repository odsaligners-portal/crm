import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },
    pastMedicalHistory: {
      type: String,
      default: "",
      trim: true,
    },
    pastDentalHistory: {
      type: String,
      default: "",
      trim: true,
    },
    treatmentFor: {
      type: String,
      required: false, // Made optional for dental examination form
      enum: ["Invisalign", "Clear Aligners", "Braces"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    primaryAddress: {
      type: String,
      trim: true,
    },
    shippingAddressType: {
      type: String,
      required: false, // Made optional for dental examination form
      trim: true,
    },
    shippingAddress: {
      type: String,
      trim: true,
    },
    billingAddress: {
      type: String,
      trim: true,
    },
    privacyAccepted: {
      type: Boolean,
      required: false, // Made optional for dental examination form
    },
    declarationAccepted: {
      type: Boolean,
      required: false, // Made optional for dental examination form
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plannerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Chief complaint & case
    chiefComplaint: {
      type: String,
      trim: true,
      default: "",
    },
    caseType: {
      type: String,
      default: "",
    },
    singleArchType: {
      type: String,
      default: "",
    },
    caseCategory: {
      type: String,
      default: "",
    },
    selectedPrice: {
      type: String,
      trim: true,
      default: "",
    },
    caseCategoryDetails: {
      type: String,
      trim: true,
      default: "",
    },
    treatmentPlan: {
      type: String,
      trim: true,
      default: "",
    },
    extraction: {
      required: false, // Made optional for dental examination form
      type: {
        required: {
          type: Boolean,
          default: false,
        },
        comments: {
          type: String,
          trim: true,
          default: "",
        },
      },
      default: { required: false, comments: "" },
    },

    fileUploadCount: {
      count: {
        type: Number,
        default: 0,
      },
      remianing: {
        type: Number,
        default: 1,
      },
    },
    // IPR
    interproximalReduction: {
      type: {
        detail1: { type: String, trim: true },
        detail2: { type: String, trim: true },
        detail3: { type: String, trim: true },
        detail4: { type: String, trim: true },
      },
    },
    measureOfIPR: {
      detailA: { type: String, trim: true },
      detailB: { type: String, trim: true },
      detailC: { type: String, trim: true },
    },
    additionalComments: {
      type: String,
      trim: true,
    },

    // Midline & Arch Expansion
    midline: {
      type: String,
      trim: true,
    },
    midlineComments: {
      type: String,
      trim: true,
    },
    archExpansion: {
      type: String,
      trim: true,
    },
    archExpansionComments: {
      type: String,
      trim: true,
    },

    // Scan Files (structured by type)
    scanFiles: {
      img1: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img2: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img3: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img4: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img5: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img6: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img7: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img8: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img9: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img10: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img11: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      model1: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      model2: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },

    caseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    profilePicture: {
      url: { type: String, default: "" },
      fileKey: { type: String, default: "" },
      uploadedAt: { type: Date, default: Date.now },
    },
    stlFile: {
      canUpload: { type: Boolean, default: false },
      uploaded: { type: Boolean, default: false },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      uploadedAt: { type: Date, default: Date.now },
      file: {
        url: { type: String, default: "" },
        fileKey: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
      comment: { type: String, default: "" },
    },
    progressStatus: {
      type: String,
      enum: ["in-progress", "midway", "completed"],
      default: "in-progress",
    },
    caseStatus: {
      type: String,
      enum: [
        "setup pending",
        "approval pending",
        "approved",
        "rejected",
        "modify",
      ],
      default: "setup pending",
    },
    modification: {
      commentSubmitted: { type: Boolean, default: false },
    },
    MRP: {
      type: String,
      default: "",
    },
    actualPrice: {
      type: String,
      default: "",
    },
    amount: {
      total: { type: Number, default: 0 },
      received: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },

    // New Dental Examination Fields
    dentalExamination: {
      // General Information
      chiefComplaint: { type: String, trim: true, default: "" },
      natureOfAvailability: { type: String, trim: true, default: "" },
      followUpMonths: { type: String, trim: true, default: "" },
      oralHabits: { type: String, trim: true, default: "" },
      otherHabitSpecification: { type: String, trim: true, default: "" },
      familyHistory: { type: String, trim: true, default: "" },

      // Clinical Information
      facialConvex: { type: String, trim: true, default: "" },
      facialConcave: { type: String, trim: true, default: "" },
      facialStraight: { type: String, trim: true, default: "" },
      lipPostureTonicity: { type: String, trim: true, default: "" },
      lipCompetence: { type: String, trim: true, default: "" },
      maxOpening: { type: String, trim: true, default: "" },
      protrusion: { type: String, trim: true, default: "" },
      rightExcursion: { type: String, trim: true, default: "" },
      leftExcursion: { type: String, trim: true, default: "" },
      tmjComments: { type: String, trim: true, default: "" },
      gum: { type: String, trim: true, default: "" },
      frenalAttachmentLocation: { type: String, trim: true, default: "" },
      frenalAttachmentType: { type: String, trim: true, default: "" },
      tongue: { type: String, trim: true, default: "" },
      oralMucosa: { type: String, trim: true, default: "" },
      gingivalRecessionTeeth: [{ type: Number }],
      gingivalRecessionComments: { type: String, trim: true, default: "" },

      // Detailed Hard Tissue Examination
      cariesTeeth: [{ type: Number }],
      missingToothTeeth: [{ type: Number }],
      impactedToothTeeth: [{ type: Number }],
      supernumeraryToothTeeth: [{ type: Number }],
      hasSupernumeraryTooth: { type: Boolean, default: false },
      supernumeraryToothDescription: { type: String, trim: true, default: "" },
      endodonticallyTreatedToothTeeth: [{ type: Number }],
      occlusalWearTeeth: [{ type: Number }],
      prosthesisTeeth: [{ type: Number }],
      prosthesisComments: { type: String, trim: true, default: "" },

      // Arch Information
      maxillaryArcShape: { type: String, trim: true, default: "" },
      maxillaryArcSymmetry: { type: String, trim: true, default: "" },
      maxillaryArcAlignment: { type: String, trim: true, default: "" },
      mandibularArcShape: [{ type: String, trim: true }],
      mandibularArcSymmetry: { type: String, trim: true, default: "" },
      mandibularArcAlignment: { type: String, trim: true, default: "" },

      // Midline Assessment
      midlineCoincide: { type: String, trim: true, default: "" },
      midlineShiftedLeft: { type: String, trim: true, default: "" },
      midlineShiftedRight: { type: String, trim: true, default: "" },

      // Anterio Posterior Relationship
      molarRelation: { type: String, trim: true, default: "" },
      molarRelationComments: { type: String, trim: true, default: "" },
      canineRelation: { type: String, trim: true, default: "" },
      canineRelationComments: { type: String, trim: true, default: "" },
      overjet: { type: String, trim: true, default: "" },
      overbite: { type: String, trim: true, default: "" },

      // Transverse Relationship
      transverseRelationshipTeeth: [{ type: Number }],
      transverseRelationshipComments: { type: String, trim: true, default: "" },

      // Treatment Plan for Patient Concern
      treatmentPlanProtrusion: { type: Boolean, default: false },
      treatmentPlanCrowding: { type: Boolean, default: false },
      treatmentPlanSpacing: { type: Boolean, default: false },
      treatmentPlanOpenBite: { type: Boolean, default: false },
      treatmentPlanOverBite: { type: Boolean, default: false },
      treatmentPlanOverJet: { type: Boolean, default: false },
      treatmentPlanMidlineShift: { type: Boolean, default: false },
      treatmentPlanUnderbite: { type: Boolean, default: false },
      treatmentPlanAsymmetricJaw: { type: Boolean, default: false },
      treatmentPlanGummySmile: { type: Boolean, default: false },
      treatmentPlanCrossbite: { type: Boolean, default: false },
      treatmentPlanNarrowArch: { type: Boolean, default: false },
      treatmentPlanClassI: { type: Boolean, default: false },
      treatmentPlanClassIIDiv1: { type: Boolean, default: false },
      treatmentPlanClassIIDiv2: { type: Boolean, default: false },
      treatmentPlanClassIII: { type: Boolean, default: false },
      treatmentPlanComments: { type: String, trim: true, default: "" },

      // How to Gain Space
      iprType: { type: String, trim: true, default: "" },
      iprMeasure: { type: String, trim: true, default: "" },
      gainSpaceExtraction: { type: String, trim: true, default: "" },
      gainSpaceExtractionTeeth: [{ type: Number }],
      extractionType: { type: String, trim: true, default: "" },
      gainSpaceDistalization: { type: String, trim: true, default: "" },
      gainSpaceDistalizationTeeth: [{ type: Number }],
      gainSpaceProclination: { type: String, trim: true, default: "" },
      gainSpaceProclinationTeeth: [{ type: Number }],
      expansionType: { type: String, trim: true, default: "" },

      // Any Other Comments
      anyOtherComments: { type: String, trim: true, default: "" },
    },

    // Dental Examination Files (separate from scanFiles)
    dentalExaminationFiles: {
      img1: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img2: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img3: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img4: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img5: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img6: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img7: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img8: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img9: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img10: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img11: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      model1: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      model2: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },

    // Middle Clinic Images (11 images without models)
    middleClinicImages: {
      img1: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img2: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img3: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img4: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img5: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img6: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img7: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img8: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img9: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img10: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img11: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },

    // Post Clinic Images (11 images without models)
    postClinicImages: {
      img1: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img2: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img3: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img4: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img5: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img6: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img7: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img8: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img9: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img10: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      img11: [
        {
          fileUrl: { type: String },
          fileKey: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

const Patient =
  mongoose.models.Patient || mongoose.model("Patient", patientSchema);

export default Patient;
