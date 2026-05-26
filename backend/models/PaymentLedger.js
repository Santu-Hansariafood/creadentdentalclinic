const mongoose = require('mongoose');

const paymentLedgerSchema = new mongoose.Schema({
  slNo: { type: Number, required: true },
  lorryNo: { type: String, required: true },
  paymentDate: { type: Date, required: true },
  paymentAmount: { type: Number, required: true },
  dueAmount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Partial', 'Pending'], default: 'Pending' },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PaymentLedger', paymentLedgerSchema);
