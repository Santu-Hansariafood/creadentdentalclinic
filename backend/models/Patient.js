const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true },
    address: { type: String },
    bloodGroup: { type: String },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
    },
    medicalHistory: {
      allergies: [String],
      chronicConditions: [String],
      medications: [String],
      previousSurgeries: [String],
      familyHistory: [String],
    },
    vitalSigns: {
      bloodPressure: { type: String },
      height: { type: String },
      weight: { type: String },
    },
    dentalHistory: {
      lastVisit: { type: Date },
      previousTreatments: [String],
      currentIssues: [String],
    },
    insurance: {
      provider: { type: String },
      policyNumber: { type: String },
      expiryDate: { type: Date },
    },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Patient", patientSchema);
