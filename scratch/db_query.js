const mongoose = require('mongoose');

async function run() {
  try {
    const uri = 'mongodb://promoadmin:PromoAdmin@ac-dtpfamu-shard-00-00.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-01.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-02.vcubuna.mongodb.net:27017/promoDB?ssl=true&replicaSet=atlas-h7ecwq-shard-0&authSource=admin&appName=Cluster0';
    console.log('Connecting...');
    await mongoose.connect(uri, { family: 4 });
    console.log('Connected.');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:');
    for (const c of collections) {
      const count = await mongoose.connection.collection(c.name).countDocuments();
      console.log(` - ${c.name}: ${count} documents`);
    }

    const courses = await mongoose.connection.collection('courses').find({}).toArray();
    console.log('\nCourses in DB:', courses.map(c => ({ id: c._id, title: c.title, isDeleted: c.isDeleted, status: c.status })));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
