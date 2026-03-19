import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://promoadmin:PromoAdmin@cluster0.vcubuna.mongodb.net/promoDB';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function setup() {
  try {
    await mongoose.connect(MONGODB_URI, { 
      // Force IPv4 if IPv6 SRV is causing the ECONNREFUSED error
      family: 4 
    });
    console.log('Connected to DB');

    const email = 'admin@techbes.co.in';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate(
      { email },
      { name: 'Admin', email, password: hashedPassword, role: 'admin' },
      { upsert: true, new: true }
    );

    console.log('Admin user created/updated successfully:', user.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setup();
