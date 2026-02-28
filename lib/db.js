const mongoose = require('mongoose');
const dns = require('dns');

// Fix Node.js DNS resolution - use Google public DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

let cached = global._mongoConn;
if (!cached) cached = global._mongoConn = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5,
      family: 4,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;