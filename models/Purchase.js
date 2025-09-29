const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }, // optional if you manage suppliers
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        sku: { type: String },
        name: { type: String },
        quantity: { type: Number, required: true },
        unitCost: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    subTotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'BankTransfer', 'Credit'],
      default: 'Cash',
    },
    amountPaid: { type: Number, required: true },
    balanceDue: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', PurchaseSchema);
