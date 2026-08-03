require('dotenv').config();
const mongoose = require('mongoose');
const PaymentLedger = require('./models/PaymentLedger');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    await PaymentLedger.deleteMany({});
    await PaymentLedger.insertMany(seedData);
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
