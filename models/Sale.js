const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        sku: { type: String },
        name: { type: String },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true },
      },
    ],
    subTotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'JazzCash', 'Easypaisa', 'BankTransfer', 'Credit'],
      default: 'Cash',
    },
    amountPaid: { type: Number, required: true },
    changeDue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', SaleSchema);
