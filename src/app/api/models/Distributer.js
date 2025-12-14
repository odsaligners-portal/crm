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
    oldEmail: {
      type: String,
      default: null,
      trim: true,
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
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  },
);

// Generate unique referral code before saving (only for new documents)
distributerSchema.pre("save", async function (next) {
  // Only generate referral code if it doesn't exist and this is a new document
  if (!this.referralCode && this.isNew) {
    let isUnique = false;
    let referralCode = "";
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate a 8 character alphanumeric code
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      referralCode = "";
      for (let i = 0; i < 8; i++) {
        referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const DistributerModel = mongoose.models.Distributer || this.constructor;
      const existing = await DistributerModel.findOne({
        referralCode: referralCode,
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (isUnique) {
      this.referralCode = referralCode;
    } else {
      return next(new Error("Failed to generate unique referral code"));
    }
  }
  next();
});

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
