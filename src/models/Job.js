import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true }, // e.g. TBS-1042
  customer: { type: String, required: true },
  service: { type: String, required: true },
  tech: { type: String }, // Can be name or ID reference later
  status: { 
    type: String, 
    enum: ['Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  date: { type: String }, // or Date object
  location: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Job || mongoose.model('Job', JobSchema);
