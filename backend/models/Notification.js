const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
