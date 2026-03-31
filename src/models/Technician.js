import mongoose from 'mongoose';

const TechnicianSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  specialization: { type: String },
  status: { 
    type: String, 
    enum: ['Available', 'On Job', 'Offline'],
    default: 'Available'
  },
  assignedJobs: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  experience: { type: String },
  avatar: { type: String }
}, { timestamps: true });

export default mongoose.models.Technician || mongoose.model('Technician', TechnicianSchema);
