import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://promoadmin:PromoAdmin@ac-dtpfamu-shard-00-00.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-01.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-02.vcubuna.mongodb.net:27017/promoDB?ssl=true&replicaSet=atlas-h7ecwq-shard-0&authSource=admin&appName=Cluster0';

async function check() {
  await mongoose.connect(MONGODB_URI);
  const usersCount = await mongoose.connection.db.collection('users').countDocuments();
  const jobsCount = await mongoose.connection.db.collection('jobs').countDocuments();
  const leadsCount = await mongoose.connection.db.collection('leads').countDocuments();
  
  console.log('Users:', usersCount);
  console.log('Jobs:', jobsCount);
  console.log('Leads:', leadsCount);
  
  process.exit(0);
}

check();
