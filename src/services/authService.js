import User from '../models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '../lib/auth';
import connectDB from '../lib/mongodb';

export const AuthService = {
  async login(email, password) {
    await connectDB();
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const token = await signToken({ 
      id: user._id, 
      role: user.role, 
      email: user.email 
    });

    return { token, user: { name: user.name, email: user.email, role: user.role } };
  },

  async register(name, email, password) {
    await connectDB();
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    return { user: { name: user.name, email: user.email, role: user.role } };
  }
};
