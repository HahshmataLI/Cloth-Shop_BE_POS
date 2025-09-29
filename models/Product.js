// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true, trim: true },

    // reference category & subcategory
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
   subcategory: {
  type: mongoose.Schema.Types.ObjectId,
  default: null ,
  ref: "SubCategory",
},


    brand: { type: String },
    size: { type: String },
    color: { type: String },
    material: { type: String },
    season: { type: String },
    designCode: { type: String },

    purchasePrice: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stockQuantity: { type: Number, default: 0 },

    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },

    images: [
      {
        data: Buffer,
        contentType: String,
        filename: String,
      },
    ],

    barcodeImage: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);
