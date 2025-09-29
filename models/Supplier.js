const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true }, // unique per supplier
    email: { type: String, trim: true },
    address: { type: String },
    company: { type: String }, // optional e.g. "Nishat Mills"
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', SupplierSchema);
