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
      enum: ["default", "country-specific"],
      default: "default",
      required: true,
    },
    country: {
      type: String,
      trim: true,
      // Required only when categoryType is 'country-specific'
      required: function () {
        return this.categoryType === "country-specific";
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
    // Compound index to ensure unique category names per country
    // For default categories, country will be null
    // For country-specific categories, combination of category and country must be unique
  },
  {
    timestamps: true,
  },
);

// Create compound index for category and country
CaseCategorySchema.index({ category: 1, country: 1 }, { unique: true });

// Pre-save middleware to handle unique constraint
CaseCategorySchema.pre("save", function (next) {
  // For default categories, set country to null
  if (this.categoryType === "default") {
    this.country = null;
  }
  next();
});

export default mongoose.models.CaseCategory ||
  mongoose.model("CaseCategory", CaseCategorySchema);
