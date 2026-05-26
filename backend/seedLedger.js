require('dotenv').config();
const mongoose = require('mongoose');
const PaymentLedger = require('./models/PaymentLedger');

const seedData = [
  {
    slNo: 1,
    lorryNo: 'WB-1234',
    paymentDate: new Date('2024-05-20'),
    paymentAmount: 15000,
    dueAmount: 5000,
    status: 'Partial',
    remarks: 'Advance for trip #45'
  },
  {
    slNo: 2,
    lorryNo: 'OR-5678',
    paymentDate: new Date('2024-05-22'),
    paymentAmount: 25000,
    dueAmount: 0,
    status: 'Paid',
    remarks: 'Full payment for trip #46'
  },
  {
    slNo: 3,
    lorryNo: 'JH-9012',
    paymentDate: new Date('2024-05-24'),
    paymentAmount: 10000,
    dueAmount: 15000,
    status: 'Partial',
    remarks: 'Partial payment for trip #47'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');
    
    await PaymentLedger.deleteMany({});
    await PaymentLedger.insertMany(seedData);
    
    console.log('Database seeded successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
