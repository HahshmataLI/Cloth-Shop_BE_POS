// controllers/productController.js
const Product = require('../models/Product');
const bwipjs = require('bwip-js');

// helper SKU generator
function generateSKU(prefix = 'RS') {
  return `${prefix}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

// CREATE product (handles req.files from multer memoryStorage)
async function createProduct(req, res) {
  try {
    const body = req.body || {};

    // ensure category provided
    if (!body.category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    // generate or validate SKU
    const sku = body.sku || generateSKU('RS');
    const exist = await Product.findOne({ sku });
    if (exist) {
      return res.status(400).json({ success: false, message: 'SKU already exists.' });
    }

    // prepare images array if files present
    const images = [];
    if (req.files && req.files.length) {
      for (const f of req.files) {
        images.push({
          data: f.buffer,
          contentType: f.mimetype,
          filename: f.originalname,
        });
      }
    }

    // generate barcode image (base64 PNG)
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: sku,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });
    const barcodeBase64 = `data:image/png;base64,${png.toString('base64')}`;

    const productData = {
      ...body,
      sku,
      images,
      barcodeImage: barcodeBase64,
    };

    const product = new Product(productData);
    await product.save();

    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error('createProduct err:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET all products (with search + pagination)
async function getProducts(req, res) {
  try {
    const { q, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
    });
  } catch (err) {
    console.error('getProducts err:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET product by ID
async function getProductById(req, res) {
  try {
    const p = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('subcategory', 'name',);

    if (!p) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: p });
  } catch (err) {
    console.error('getProductById err:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET product by Barcode/SKU
async function getByBarcode(req, res) {
  try {
    const p =
      (await Product.findOne({ sku: req.params.barcode })
        .populate('category', 'name')
        .populate('subcategory', 'name')) ||
      (await Product.findOne({ barcode: req.params.barcode })
        .populate('category', 'name')
        .populate('subcategory', 'name'));

    if (!p) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: p });
  } catch (err) {
    console.error('getByBarcode err:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// UPDATE product
async function updateProduct(req, res) {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name')
      .populate('subcategory', 'name');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateProduct err:', err);
    res.status(400).json({ success: false, message: err.message });
  }
}

// DELETE product
async function deleteProduct(req, res) {
  try {
    const d = await Product.findByIdAndDelete(req.params.id);
    if (!d) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('deleteProduct err:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getByBarcode,
  updateProduct,
  deleteProduct,
};
