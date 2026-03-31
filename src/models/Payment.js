import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true }, // e.g. PAY-8821
  customer: { type: String, required: true },
  service: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String }, // UPI, Card, Cash, etc.
  status: { 
    type: String, 
    enum: ['Paid', 'Pending', 'Partial'],
    default: 'Pending'
  },
  date: { type: String }
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
