const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
     phone: { type: String, required: true,  index: true }, 
    email: { type: String , unique: true },
    address: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', CustomerSchema);
