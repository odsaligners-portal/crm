import mongoose from "mongoose";

const specialCommentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Comment title is required"],
    trim: true,
  },
  comment: {
    type: String,
    required: [true, "Comment content is required"],
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdByName: {
    type: String,
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: false, // Optional field
  },
  patientName: {
    type: String,
    required: false, // Optional field
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Optional field
  },
  doctorName: {
    type: String,
    required: false, // Optional field
  },
  readBy: [{
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for better query performance
specialCommentSchema.index({ createdBy: 1, createdAt: -1 });
specialCommentSchema.index({ patientId: 1 });
specialCommentSchema.index({ doctorId: 1 });

const SpecialComment = mongoose.models.SpecialComment || mongoose.model("SpecialComment", specialCommentSchema);

export default SpecialComment;
