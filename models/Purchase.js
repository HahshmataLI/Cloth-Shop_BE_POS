const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, default: Date.now },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        sku: { type: String },
        name: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        unitCost: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],

    subTotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },

    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'BankTransfer', 'Credit'],
      default: 'Cash',
    },

    amountPaid: { type: Number, required: true, min: 0 },
    balanceDue: { type: Number, default: 0, min: 0 },

    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', PurchaseSchema);
