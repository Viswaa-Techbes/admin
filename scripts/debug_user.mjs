import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://promoadmin:PromoAdmin@ac-dtpfamu-shard-00-00.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-01.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-02.vcubuna.mongodb.net:27017/promoDB?ssl=true&replicaSet=atlas-h7ecwq-shard-0&authSource=admin&appName=Cluster0';

async function check() {
  await mongoose.connect(MONGODB_URI);
  const user = await mongoose.connection.db.collection('users').findOne({ email: 'lohith@techbes.co.in' });
  console.log('User found:', JSON.stringify(user, null, 2));
  process.exit(0);
}

check();
