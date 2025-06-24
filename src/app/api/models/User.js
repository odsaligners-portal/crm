import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  mobile: {
    type: String,
  },
  gender: {
    type: String,
  },
  country: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  experience: {
    type: String,
  },
  doctorType: {
    type: String,
  },
  address: {
    type: String,
  },
  role: {
    type: String,
    enum: ['doctor', 'admin', 'super-admin'],
    default: 'doctor'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  profilePicture: {
    url: { type: String, default: '' },
    fileKey: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  userDeleteAccess: {
    type: Boolean,
    default: false,
  },
  eventUpdateAccess: {
    type: Boolean,
    default: false,
  },
  commentUpdateAccess: {
    type: Boolean,
    default: false,
  },
  passwordChangeAccess: {
    type: Boolean,
    default: false,
  },
  caseCategoryUpdateAccess: {
    type: Boolean,
    default: false,
  },
  changeDoctorPasswordAccess: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
