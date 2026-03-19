import mongoose from 'mongoose';

// Matches the 'leads' collection in promoDB (the old admin panel schema)
const LeadSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  service: { type: String },
  plan: { type: String },
  pincode: { type: String },
  paymentId: { type: String },
  password: { type: String },
  role: { type: String },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date },
}, { timestamps: false });

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema, 'leads');
