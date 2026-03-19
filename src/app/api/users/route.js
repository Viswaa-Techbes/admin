import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export async function GET(req) {
  try {
    await connectDB();
    const users = await User.find().select('-password');
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}
