const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true },
  address: { type: String },
  bloodGroup: { type: String },
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String }
  },
  medicalHistory: {
    allergies: [String],
    chronicConditions: [String],
    medications: [String],
    previousSurgeries: [String],
    familyHistory: [String]
  },
  dentalHistory: {
    lastVisit: { type: Date },
    previousTreatments: [String],
    currentIssues: [String]
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
