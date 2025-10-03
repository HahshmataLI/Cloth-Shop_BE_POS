// controllers/productController.js
const Product = require("../models/Product");
const bwipjs = require("bwip-js");

// helper SKU generator
function generateSKU(prefix = "RS") {
  return `${prefix}-${Date.now().toString().slice(-6)}-${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;
}

// CREATE product (handles req.files from multer memoryStorage)
// CREATE product
async function createProduct(req, res) {
  try {
    const body = req.body || {};

    // ensure category provided
    if (!body.category) {
      return res
        .status(400)
        .json({ success: false, message: "Category is required" });
    }

    // generate or validate SKU
    const sku = body.sku || generateSKU("RS");
    const exist = await Product.findOne({ sku });
    if (exist) {
      return res
        .status(400)
        .json({ success: false, message: "SKU already exists." });
    }

    // prepare images array
    const images = (req.files || []).map((f) => ({
      url: `/uploads/${f.filename}`, // public static path
      filename: f.originalname,
      contentType: f.mimetype,
    }));

    // generate barcode once
    const png = await bwipjs.toBuffer({
      bcid: "code128",
      text: sku,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center",
    });
    const barcodeBase64 = `data:image/png;base64,${png.toString("base64")}`;

    // build product
    const product = new Product({
      ...body,
      sku,
      images,
      barcodeImage: barcodeBase64,
    });

    await product.save();

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error("createProduct err:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET all products (with search + pagination) - Optimized
async function getProducts(req, res) {
  try {
    const { q, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
      ];
    }

    // Convert page/limit to numbers once
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    // Run queries in parallel
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .populate("subcategory", "name")
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(), // ⚡ Faster plain objects instead of Mongoose docs
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    console.error("getProducts err:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET product by ID
async function getProductById(req, res) {
  try {
    const p = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .lean(); // ⚡ faster, plain JSON instead of Mongoose doc

    if (!p) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: p });
  } catch (err) {
    console.error("getProductById err:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET product by Barcode/SKU
async function getByBarcode(req, res) {
  try {
    const barcode = req.params.barcode;

    // Run queries in parallel → whichever matches first, we pick
    const [bySku, byBarcode] = await Promise.all([
      Product.findOne({ sku: barcode })
        .populate("category", "name")
        .populate("subcategory", "name")
        .lean(),
      Product.findOne({ barcode })
        .populate("category", "name")
        .populate("subcategory", "name")
        .lean(),
    ]);

    const p = bySku || byBarcode;

    if (!p) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: p });
  } catch (err) {
    console.error("getByBarcode err:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}
// UPDATE product
async function updateProduct(req, res) {
  try {
    const body = req.body || {};
    const updateData = { ...body };

    // if new files uploaded → add them
    if (req.files && req.files.length) {
      updateData.images = req.files.map((f) => ({
        url: `/uploads/${f.filename}`,
        filename: f.originalname,
        contentType: f.mimetype,
      }));
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateProduct err:", err);
    res.status(400).json({ success: false, message: err.message });
  }
}

// DELETE product
async function deleteProduct(req, res) {
  try {
    const d = await Product.findByIdAndDelete(req.params.id);
    if (!d) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteProduct err:", err);
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
