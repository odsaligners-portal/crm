import mongoose from 'mongoose';

const patientFileSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['image', 'pdf', 'video'],
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileKey: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: String,
    enum: ['Admin', 'Doctor'],
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const PatientFile = mongoose.models.PatientFile || mongoose.model('PatientFile', patientFileSchema);

export default PatientFile; 