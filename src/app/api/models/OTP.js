import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
    },
    userData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
OTPSchema.index({ email: 1, expiresAt: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs

// Static method to generate OTP
OTPSchema.statics.generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create and save OTP
OTPSchema.statics.createOTP = async function (email) {
  // Delete any existing OTPs for this email
  await this.deleteMany({ email });

  const otp = this.generateOTP();
  const otpDoc = new this({
    email,
    otp,
  });

  return await otpDoc.save();
};

// Instance method to verify OTP
OTPSchema.methods.verifyOTP = function (inputOTP) {
  // Check if OTP is expired
  if (new Date() > this.expiresAt) {
    return { success: false, message: "OTP has expired" };
  }

  // Check if OTP matches
  if (this.otp === inputOTP) {
    return { success: true, message: "OTP verified successfully" };
  }

  return { success: false, message: "Invalid OTP" };
};

export default mongoose.models.OTP || mongoose.model("OTP", OTPSchema);
