const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
      set: (value) => {
        if (value === null || value === undefined) return undefined;

        const email = String(value).trim();
        return email === "" ? undefined : email;
      },
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    phone: { type: String, required: true, unique: true, index: true },
    dateOfBirth: { type: Date },
    age: { type: Number },
    gender: { type: String, required: true },
    address: { type: String },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
    },
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
  if (this.dateOfBirth && !this.age) {
    const dob = new Date(this.dateOfBirth);
    const today = new Date();
    let calcAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      calcAge--;
    }
    this.age = calcAge;
  }
  if (!this.dateOfBirth && this.age) {
    const approxDob = new Date();
    approxDob.setFullYear(approxDob.getFullYear() - this.age);
    this.dateOfBirth = approxDob;
  }
  next();
});

module.exports = mongoose.model("Patient", patientSchema);
