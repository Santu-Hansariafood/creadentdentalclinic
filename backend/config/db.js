const mongoose = require('mongoose');

const connectDB = async () => {
  const options = {
    // Connection pool settings for scalability
    maxPoolSize: 100, // Maximum number of connections in the pool
    minPoolSize: 10, // Minimum number of connections in the pool
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
  };

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`🔌 Connection Pool: max=${options.maxPoolSize}, min=${options.minPoolSize}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
