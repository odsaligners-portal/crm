import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  commentedBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "commentedBy.userType",
    },
    userType: {
      type: String,
      required: true,
      enum: ["User", "Distributer"], // Ensure only valid models
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

const patientCommentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  },
);

const PatientComment =
  mongoose.models.PatientComment ||
  mongoose.model("PatientComment", patientCommentSchema);

export default PatientComment;
