import mongoose from 'mongoose';

const accountsTeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the name'],
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

const AccountsTeam = mongoose.models.AccountsTeam || mongoose.model('AccountsTeam', accountsTeamSchema);

export default AccountsTeam; 