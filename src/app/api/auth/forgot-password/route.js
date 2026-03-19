import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(req) {
  try {
    await connectDB();
    const { email } = await req.json();

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: 'If email exists, a reset link was sent' }, { status: 200 });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: '"Admin Panel" <noreply@adminpanel.com>',
      to: user.email,
      subject: 'Password Reset Request',
      html: `You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. It expires in 15 minutes.`
    });

    return NextResponse.json({ message: 'If email exists, a reset link was sent' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error processing request', error: error.message }, { status: 500 });
  }
}
