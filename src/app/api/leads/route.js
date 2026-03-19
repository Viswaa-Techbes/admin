import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      name,
      email,
      phone,
      password,
      plan,
      service,
      pincode,
      paymentId
    } = body;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const newLead = await Lead.create({
      name,
      email,
      phone,
      password: hashedPassword,
      service,
      pincode,
      plan,
      paymentId,
      role: "user",
      status: "Active",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, data: newLead });

  } catch (err) {
    console.error('Lead creation error:', err);
    return NextResponse.json({
      success: false,
      message: err.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const leads = await Lead.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: leads
    });

  } catch (err) {
    console.error('Fetch leads error:', err);
    return NextResponse.json({
      success: false,
      message: err.message
    }, { status: 500 });
  }
}
