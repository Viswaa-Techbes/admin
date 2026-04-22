import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://promoadmin:PromoAdmin@ac-dtpfamu-shard-00-00.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-01.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-02.vcubuna.mongodb.net:27017/promoDB?ssl=true&replicaSet=atlas-h7ecwq-shard-0&authSource=admin&appName=Cluster0';

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
    const password = 'admin*#123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate(
      { email },
      { 
        name: 'Admin', 
        email, 
        password: hashedPassword, 
        role: 'admin',
        mobileNumber: '0000000000',
        sessionActive: true,
        lastSeen: new Date()
      },
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
