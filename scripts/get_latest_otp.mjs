import mongoose from 'mongoose';

const uri = 'mongodb://promoadmin:PromoAdmin@ac-dtpfamu-shard-00-00.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-01.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-02.vcubuna.mongodb.net:27017/promoDB?ssl=true&replicaSet=atlas-h7ecwq-shard-0&authSource=admin&appName=Cluster0';

async function checkOtp() {
  try {
    await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 30000 });
    const otpRec = await mongoose.connection.collection('otpverifications').findOne({
      email: 'lohith@techbes.co.in',
      purpose: 'admin_mfa'
    });
    console.log('OTP RECORD:', JSON.stringify(otpRec, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching OTP:', err);
    process.exit(1);
  }
}

checkOtp();
