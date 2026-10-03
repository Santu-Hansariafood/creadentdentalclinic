const mongoose = require("mongoose");
const Patient = require("../models/Patient");

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

    const patientIndexes = await Patient.collection.indexes();
    const uniquePhoneIndex = patientIndexes.find(
      (index) => index.key?.phone === 1 && index.unique,
    );
    if (uniquePhoneIndex) {
      await Patient.collection.dropIndex(uniquePhoneIndex.name);
    }
    await Patient.collection.createIndex({ phone: 1 });

    console.log(
      `Connection Pool: max=${options.maxPoolSize}, min=${options.minPoolSize}`,
    );
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
