import mongoose from 'mongoose';

const salesPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the salesperson\'s name'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Please provide the mobile number'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide the email'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  }
}, {
  timestamps: true
});

const SalesPerson = mongoose.models.SalesPerson || mongoose.model('SalesPerson', salesPersonSchema);

export default SalesPerson; 