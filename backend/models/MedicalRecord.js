const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  date: { type: Date, required: true },
  visitType: { type: String },
  diagnosis: { type: String },
  treatment: { type: String },
  prescriptions: [String],
  notes: { type: String },
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    height: String,
    weight: String
  }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
