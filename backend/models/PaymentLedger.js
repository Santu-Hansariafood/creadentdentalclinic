const mongoose = require("mongoose");

const paymentLedgerSchema = new mongoose.Schema(
  {
    slNo: { type: Number, required: true },
    lorryNo: { type: String, default: "-" },
    treatmentName: { type: String, default: "General payment" },
    paymentDate: { type: Date, required: true },
    paymentMode: { type: String, default: "Manual" },
    referenceNo: { type: String, default: "-" },
    paymentAmount: { type: Number, required: true },
    dueAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Paid", "Partial", "Pending"],
      default: "Pending",
    },
    remarks: { type: String },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PaymentLedger", paymentLedgerSchema);
