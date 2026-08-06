const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, unique: true, index: true },
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

patientSchema.pre("save", async function (next) {
  if (!this.patientId) {
    const prefix = "PAT";
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    const timestamp = Date.now().toString().slice(-4);
    this.patientId = `${prefix}-${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model("Patient", patientSchema);
