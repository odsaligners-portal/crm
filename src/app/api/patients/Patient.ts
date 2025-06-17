import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    personalInfo: {
      firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
      },
      dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
      },
      gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Male', 'Female', 'Other'],
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
      },
      address: {
        city: {
          type: String,
          required: [true, 'City is required'],
          trim: true,
        },
        country: {
          type: String,
          required: [true, 'Country is required'],
          trim: true,
        },
      },
    },
    medicalInfo: {
      bloodType: {
        type: String,
        required: [true, 'Blood type is required'],
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
      chronicConditions: {
        type: String,
        trim: true,
        default: '',
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
patientSchema.index({ 'personalInfo.email': 1 }, { unique: true });
patientSchema.index({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });

const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);

export default Patient; 