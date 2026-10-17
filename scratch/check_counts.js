const mongoose = require('mongoose');

async function checkCounts() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://promoadmin:PromoAdmin@cluster0.vcubuna.mongodb.net/promoDB';
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const matCount = await db.collection('materials').countDocuments();
    const cctvCount = await db.collection('cctvproducts').countDocuments();
    const serviceMatCount = await db.collection('servicematerials').countDocuments();
    console.log('materials count:', matCount);
    console.log('cctvproducts count:', cctvCount);
    console.log('servicematerials count:', serviceMatCount);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkCounts();
