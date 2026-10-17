const mongoose = require('mongoose');

async function inspectMaterials() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://promoadmin:PromoAdmin@cluster0.vcubuna.mongodb.net/promoDB';
    await mongoose.connect(uri);
    console.log('Connected to DB');
    const materials = await mongoose.connection.collection('materials').find({}).limit(5).toArray();
    console.log('Total sample materials count:', materials.length);
    console.log(JSON.stringify(materials, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

inspectMaterials();
