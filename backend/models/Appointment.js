const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientName: { type: String, required: true },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorName: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: Number, default: 30 },
    type: { type: String, required: true },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    reason: { type: String },
    notes: { type: String },
    bookingPatientNotificationSentAt: { type: Date },
    bookingDoctorNotificationSentAt: { type: Date },
    reminderOneDaySentAt: { type: Date },
    reminderOneHourSentAt: { type: Date },
    lastNotificationError: { type: String },
  },
  { timestamps: true },
);

appointmentSchema.index({ date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1, status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
