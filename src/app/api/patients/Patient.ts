import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required'],
    },
    pastMedicalHistory: {
      type: String,
      default: '',
      trim: true,
    },
    pastDentalHistory: {
      type: String,
      default: '',
      trim: true,
    },
    treatmentFor: {
      type: String,
      required: [true, 'Treatment for is required'],
      enum: ['Invisalign', 'Clear Aligners', 'Braces'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    primaryAddress: {
      type: String,
      trim: true,
    },
    shippingAddressType: {
      type: String,
      enum: ['Primary Address', 'New Address'],
      required: [true, 'Shipping address type is required'],
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
      required: [true, 'Privacy policy acceptance is required'],
    },
    declarationAccepted: {
      type: Boolean,
      required: [true, 'Declaration acceptance is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Chief complaint & case
    chiefComplaint: {
      type: String,
      trim: true,
      default: '',
    },
    caseType: {
      type: String,
      default: '',
    },
    caseCategory: {
      type: String,
      default: '',
    },
    selectedPrice: {
      type: String,
      trim: true,
      default: '',
    },
    caseCategoryDetails: {
      type: String,
      trim: true,
      default: '',
    },
    treatmentPlan: {
      type: String,
      trim: true,
      default: '',
    },
    extraction: {
      required: true,
      type: {
        required: {
          type: Boolean,
          default: false,
        },
        comments: {
          type: String,
          trim: true,
          default: '',
        },
      },
      default: { required: false, comments: '' },
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
      img1: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      img2: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      img3: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      img4: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      img5: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      img6: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      img7: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      img8: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      img9: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      img10: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      img11: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      model1: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
      model2: [{ fileUrl: { type: String }, fileKey: { type: String }, uploadedAt: { type: Date, default: Date.now } }],
    },

    caseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Patient =
  mongoose.models.Patient || mongoose.model('Patient', patientSchema);

export default Patient;
