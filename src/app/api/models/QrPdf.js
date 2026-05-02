import mongoose from "mongoose";

const qrPdfSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    pdf: {
      fileUrl: { type: String, required: true },
      fileKey: { type: String, required: true },
      fileName: { type: String, required: true },
      fileSize: { type: Number, required: true },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const QrPdf = mongoose.models.QrPdf || mongoose.model("QrPdf", qrPdfSchema);

export default QrPdf;
