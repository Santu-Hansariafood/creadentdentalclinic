const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    dosageForm: { type: String, required: true },
    dosageStrength: { type: String, required: true },
  },
  { timestamps: true },
);

medicineSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Medicine", medicineSchema);
