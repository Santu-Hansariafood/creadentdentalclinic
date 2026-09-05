const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    merchantTxnNo: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currencyCode: { type: String, default: "356" },
    transactionType: { type: String, default: "SALE" },
    txnDate: { type: String, required: true },
    customerEmailID: { type: String },
    customerMobileNo: { type: String },
    payType: { type: String, default: "0" },
    txnStatus: {
      type: String,
      enum: ["SUC", "REJ", "ERR", "REQ", "PENDING", "INITIATED"],
      default: "INITIATED",
    },
    txnResponseCode: { type: String },
    txnResponseMsg: { type: String },
    pgTxnNo: { type: String },
    authRefNo: { type: String },
    arnNo: { type: String },
    redirectURI: { type: String },
    tranCtx: { type: String },
    showOTPCapturePage: { type: String },
    otpGenerated: { type: Boolean, default: false },
    otpVerified: { type: Boolean, default: false },
    authorized: { type: Boolean, default: false },
    rawResponse: { type: mongoose.Schema.Types.Mixed },
    rawCallback: { type: mongoose.Schema.Types.Mixed },
    settlementDate: { type: String },
    settlementStatus: { type: String },
    refundedAmount: { type: Number, default: 0 },
    refundTxnNo: { type: String },
    refundStatus: { type: String },
    secureHash: { type: String },
    amountPaidApplied: { type: Number, default: 0 },
    paymentConfirmedAt: { type: Date },
    paymentThankYouSentAt: { type: Date },
    hashVerified: { type: Boolean, default: false },
    callbackProcessed: { type: Boolean, default: false },
    callbackProcessedAt: { type: Date },
  },
  { timestamps: true },
);

transactionSchema.index({ invoiceId: 1 });
transactionSchema.index({ patientId: 1 });
transactionSchema.index({ merchantTxnNo: 1 }, { unique: true });
transactionSchema.index({ pgTxnNo: 1 }, { sparse: true });
transactionSchema.index({ txnStatus: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
