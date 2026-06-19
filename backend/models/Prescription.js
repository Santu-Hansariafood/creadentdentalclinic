const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
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
    date: { type: Date, default: Date.now },
    diagnosis: { type: String },
    medications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],
    notes: { type: String },
    status: { type: String, enum: ["Active", "Completed"], default: "Active" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
