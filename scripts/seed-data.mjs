import mongoose from 'mongoose';
import Job from '../src/models/Job.js';
import Technician from '../src/models/Technician.js';
import Payment from '../src/models/Payment.js';
import { JOBS, TECHNICIANS, PAYMENTS } from '../src/lib/data.js';

import dns from 'dns';

if (dns.setServers) {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

// MongoDB URI from .env.local or hardcoded for this script (as seen in setup_admin.mjs)
const MONGODB_URI = 'mongodb+srv://promoadmin:PromoAdmin@cluster0.vcubuna.mongodb.net/promoDB';

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI, { family: 4 });
    console.log('Connected to MongoDB');

    // Migrate Jobs
    console.log('Migrating Jobs...');
    await Job.deleteMany({});
    const jobsToInsert = JOBS.map(j => ({
      jobId: j.id,
      customer: j.customer,
      service: j.service,
      tech: j.tech === '—' ? null : j.tech,
      status: j.status,
      date: j.date,
      location: j.location
    }));
    await Job.insertMany(jobsToInsert);

    // Migrate Technicians
    console.log('Migrating Technicians...');
    await Technician.deleteMany({});
    const techsToInsert = TECHNICIANS.map(t => ({
      name: t.name,
      phone: t.phone,
      specialization: t.specialization,
      status: t.status,
      assignedJobs: t.assignedJobs,
      rating: t.rating,
      experience: t.experience,
      avatar: t.avatar
    }));
    await Technician.insertMany(techsToInsert);

    // Migrate Payments
    console.log('Migrating Payments...');
    await Payment.deleteMany({});
    const paymentsToInsert = PAYMENTS.map(p => ({
      paymentId: p.id,
      customer: p.customer,
      service: p.service,
      amount: p.amount,
      method: p.method,
      status: p.status,
      date: p.date
    }));
    await Payment.insertMany(paymentsToInsert);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
