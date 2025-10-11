import mongoose from "mongoose";

const DeadlineTimeSchema = new mongoose.Schema(
  {
    days: {
      type: Number,
      required: true,
      min: [0, "Days cannot be negative"],
      default: 0,
    },
    hours: {
      type: Number,
      required: true,
      min: [0, "Hours cannot be negative"],
      max: [23, "Hours must be between 0 and 23"],
      default: 0,
    },
    minutes: {
      type: Number,
      required: true,
      min: [0, "Minutes cannot be negative"],
      max: [59, "Minutes must be between 0 and 59"],
      default: 0,
    },
    totalHours: {
      type: Number,
      default: 0,
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

// Calculate total hours before saving
DeadlineTimeSchema.pre("save", function (next) {
  this.totalHours = this.days * 24 + this.hours + this.minutes / 60;
  next();
});

export default mongoose.models.DeadlineTime ||
  mongoose.model("DeadlineTime", DeadlineTimeSchema);
