const mongoose = require("mongoose");

const connectDB = async () => {
  const options = {
    maxPoolSize: 100,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  };

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(
      `Connection Pool: max=${options.maxPoolSize}, min=${options.minPoolSize}`,
    );
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
