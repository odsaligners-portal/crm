import mongoose from 'mongoose';

const PlanSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
});

const CaseCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  plans: {
    type: [PlanSchema],
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.models.CaseCategory || mongoose.model('CaseCategory', CaseCategorySchema);
