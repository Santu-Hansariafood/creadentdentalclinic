const mongoose = require("mongoose");

const whatsAppMessageSchema = new mongoose.Schema(
  {
    direction: { type: String, enum: ["outbound", "inbound"], required: true },
    phone: { type: String, required: true, index: true },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      index: true,
    },
    patientName: { type: String },
    text: { type: String, default: "" },
    messageType: { type: String, default: "text" },
    templateName: { type: String },
    templateParameters: { type: [String], default: undefined },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      index: true,
    },
    eventType: { type: String, index: true },
    status: {
      type: String,
      enum: [
        "queued",
        "sent",
        "delivered",
        "read",
        "failed",
        "received",
        "skipped",
      ],
      default: "sent",
      index: true,
    },
    read: { type: Boolean, default: false, index: true },
    messageId: { type: String, index: true },
    error: { type: String },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

whatsAppMessageSchema.index(
  { invoiceId: 1, eventType: 1, messageType: 1 },
  { unique: true, sparse: true },
);

module.exports = mongoose.model("WhatsAppMessage", whatsAppMessageSchema);
