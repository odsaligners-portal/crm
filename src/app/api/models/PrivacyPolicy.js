import mongoose from "mongoose";

const PrivacyPolicySchema = new mongoose.Schema(
  {
    distributerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Distributer",
      required: true,
      unique: true, // Each distributor can have only one privacy policy
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Privacy Policy",
    },
    content: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    version: {
      type: String,
      trim: true,
      default: "1.0",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
PrivacyPolicySchema.index({ distributerId: 1 });
PrivacyPolicySchema.index({ active: 1 });

export default mongoose.models.PrivacyPolicy ||
  mongoose.model("PrivacyPolicy", PrivacyPolicySchema);
