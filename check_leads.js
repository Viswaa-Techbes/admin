const mongoose = require('mongoose');

async function checkLeads() {
  try {
    const uri = 'mongodb://promoadmin:PromoAdmin@ac-dtpfamu-shard-00-00.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-01.vcubuna.mongodb.net:27017,ac-dtpfamu-shard-00-02.vcubuna.mongodb.net:27017/promoDB?ssl=true&replicaSet=atlas-h7ecwq-shard-0&authSource=admin&appName=Cluster0';
    console.log('Attempting to connect with:', uri.split('@')[1]); // Log without credentials
    await mongoose.connect(uri);
    console.log('CONNECTED');
    
    // Check if we are in promoDB
    console.log('Current DB:', mongoose.connection.name);
    
    const leadsCount = await mongoose.connection.collection('leads').countDocuments();
    console.log('LEADS_COUNT:', leadsCount);
    
    if (leadsCount > 0) {
      const firstLead = await mongoose.connection.collection('leads').findOne({});
      console.log('FIRST_LEAD_NAME:', firstLead.name);
    }
    
    process.exit(0);
  } catch (err) {
    console.log('ERROR:', err.message);
    process.exit(1);
  }
}

checkLeads();
