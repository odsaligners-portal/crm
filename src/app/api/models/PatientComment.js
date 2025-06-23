import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  commentedBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userType: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  datetime: {
    type: Date,
    default: Date.now,
  },
});

const patientCommentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true,
  },
  patientName: {
    type: String,
    required: true,
  },
  comments: [commentSchema],
}, {
  timestamps: true,
});

const PatientComment = mongoose.models.PatientComment || mongoose.model('PatientComment', patientCommentSchema);

export default PatientComment; 