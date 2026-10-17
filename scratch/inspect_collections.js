const mongoose = require('mongoose');

async function inspectCollections() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://promoadmin:PromoAdmin@cluster0.vcubuna.mongodb.net/promoDB';
    await mongoose.connect(uri);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in promoDB:', collections.map(c => c.name));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

inspectCollections();
