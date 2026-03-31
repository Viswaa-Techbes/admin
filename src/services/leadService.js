import Lead from '../models/Lead';
import connectDB from '../lib/mongodb';
import bcrypt from 'bcryptjs';

export const LeadService = {
  async createLead(data) {
    await connectDB();
    const { password, ...rest } = data;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
    
    return await Lead.create({
      ...rest,
      password: hashedPassword,
      role: 'user',
      status: 'Active',
      createdAt: new Date(),
    });
  },

  async getAllLeads() {
    await connectDB();
    return await Lead.find().sort({ createdAt: -1 });
  }
};
