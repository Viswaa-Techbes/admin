const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Attempting to connect to:', process.env.MONGODB_URI || 'mongodb+srv://promoadmin:PromoAdmin@cluster0.vcubuna.mongodb.net/promoDB');
    await mongoose.connect('mongodb+srv://promoadmin:PromoAdmin@cluster0.vcubuna.mongodb.net/promoDB');
    console.log('CONN_SUCCESS');
    
    // Let's actually check the users collection
    const users = await mongoose.connection.collection('users').find({}).limit(1).toArray();
    console.log('DB_DOCS_FOUND:', users.length);
    if (users.length > 0) console.log('DOC_KEYS:', Object.keys(users[0]));
    
    process.exit(0);
  } catch (err) {
    console.log('CONN_ERROR:', err.message);
    process.exit(1);
  }
}

testConnection();
