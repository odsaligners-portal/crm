import mongoose from "mongoose";

const PlanSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
});

const CaseCategorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    categoryType: {
      type: String,
      enum: ["default", "distributor-specific"],
      default: "default",
      required: true,
    },
    distributerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Distributer",
      // Required only when categoryType is 'distributor-specific'
      required: function () {
        return this.categoryType === "distributor-specific";
      },
    },
    plans: {
      type: [PlanSchema],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);


// Pre-save middleware to handle unique constraint
CaseCategorySchema.pre("save", function (next) {
  // For default categories, set distributerId to null
  if (this.categoryType === "default") {
    this.distributerId = null;
  }
  next();
});

export default mongoose.models.CaseCategory ||
  mongoose.model("CaseCategory", CaseCategorySchema);
