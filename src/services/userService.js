import User from '../models/User';
import connectDB from '../lib/mongodb';

export const UserService = {
  async getAllUsers() {
    await connectDB();
    return await User.find().select('-password');
  },

  async getUserById(id) {
    await connectDB();
    const user = await User.findById(id).select('-password');
    if (!user) throw new Error('User not found');
    return user;
  }
};
