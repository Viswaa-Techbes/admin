const mongoose = require('mongoose');

async function run() {
  try {
    const uri = 'mongodb://promoadmin:PromoAdmin@ac-dtpfamu-shard-00-00.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-01.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-02.vcubuna.mongodb.net:27017/promoDB?ssl=true&replicaSet=atlas-h7ecwq-shard-0&authSource=admin&appName=Cluster0';
    await mongoose.connect(uri, { family: 4 });
    
    const admissions = await mongoose.connection.collection('admissions').find({}).toArray();
    console.log('Admissions:');
    console.log(JSON.stringify(admissions, null, 2));

    const coursePayments = await mongoose.connection.collection('coursepayments').find({}).toArray();
    console.log('\nCourse Payments:');
    console.log(JSON.stringify(coursePayments, null, 2));

    const courseInquiries = await mongoose.connection.collection('courseinquiries').find({}).toArray();
    console.log('\nCourse Inquiries:');
    console.log(JSON.stringify(courseInquiries, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
