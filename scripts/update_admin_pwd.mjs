import dns from 'dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const uri = 'mongodb://promoadmin:PromoAdmin@ac-dtpfamu-shard-00-00.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-01.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-02.vcubuna.mongodb.net:27017/promoDB?ssl=true&replicaSet=atlas-h7ecwq-shard-0&authSource=admin&appName=Cluster0';

async function updateAdmins() {
  try {
    await mongoose.connect(uri, {
      family: 4,
      serverSelectionTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB Atlas');

    const hashedPassword = await bcrypt.hash('admin*#123', 12);

    const res1 = await mongoose.connection.collection('users').updateOne(
      { email: 'lohith@techbes.co.in' },
      {
        $set: {
          password: hashedPassword,
          isDeleted: false,
          role: 'admin',
          mfaEnabled: false,
          failedLoginAttempts: 0,
          lockUntil: null,
          updatedAt: new Date()
        }
      }
    );
    console.log('Updated lohith@techbes.co.in:', JSON.stringify(res1));

    const res2 = await mongoose.connection.collection('users').updateOne(
      { email: 'admin@techbes.co.in' },
      {
        $set: {
          password: hashedPassword,
          isDeleted: false,
          role: 'admin',
          mfaEnabled: false,
          failedLoginAttempts: 0,
          lockUntil: null,
          updatedAt: new Date()
        }
      }
    );
    console.log('Updated admin@techbes.co.in:', JSON.stringify(res2));

    process.exit(0);
  } catch (err) {
    console.error('Error updating admins:', err);
    process.exit(1);
  }
}

updateAdmins();
