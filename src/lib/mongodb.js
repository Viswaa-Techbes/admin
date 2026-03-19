import dns from 'dns';
import mongoose from 'mongoose';

// Fix for querySrv ECONNREFUSED on some networks
if (dns.setServers) {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  // Detect URI change and reset cache if needed (useful for hot-reloading env vars)
  if (cached.conn && cached.uri !== MONGODB_URI) {
    console.log('MONGODB_URI changed, resetting connection...');
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
  cached.uri = MONGODB_URI;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
