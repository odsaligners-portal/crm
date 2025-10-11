import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const distributerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide the distributer name"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Please provide the mobile number"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide the email"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },

    city: {
      type: String,
      required: [true, "Please provide the city"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Please provide the country"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "Please provide the state"],
      trim: true,
    },
    access: {
      type: String,
      enum: ["view", "full"],
      default: "view",
      required: true,
    },
    role: {
      type: String,
      default: "distributer",
    },
    logo: {
      url: { type: String, default: "" },
      fileKey: { type: String, default: "" },
      uploadedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
distributerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
distributerSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const Distributer =
  mongoose.models.Distributer ||
  mongoose.model("Distributer", distributerSchema);

export default Distributer;
