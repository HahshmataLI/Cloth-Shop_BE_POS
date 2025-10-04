// controllers/productController.js
const Product = require("../models/Product");
const bwipjs = require("bwip-js");
const fs = require("fs");
const path = require("path");

// helper SKU generator
function generateSKU(prefix = "RS") {
  return `${prefix}-${Date.now().toString().slice(-6)}-${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;
}

// helper: remove duplicate images (by filename)
function uniqueImages(images) {
  return Array.from(new Map(images.map(img => [img.filename, img])).values());
}

// CREATE product
async function createProduct(req, res) {
  try {
    const body = req.body || {};
    if (!body.category) {
      return res.status(400).json({ success: false, message: "Category required" });
    }

    const sku = body.sku || generateSKU("RS");
    const exist = await Product.findOne({ sku });
    if (exist) {
      return res.status(400).json({ success: false, message: "SKU already exists." });
    }

    // Save relative paths for images
    const images = uniqueImages(
      (req.files || []).map(f => ({
        url: `/uploads/${f.filename}`,   // relative path only
        filename: f.originalname,
        contentType: f.mimetype,
      }))
    );

    // generate barcode (base64 image)
    const png = await bwipjs.toBuffer({
      bcid: "code128",
      text: sku,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center",
    });
    const barcodeBase64 = `data:image/png;base64,${png.toString("base64")}`;

    const product = new Product({ ...body, sku, images, barcodeImage: barcodeBase64 });
    await product.save();

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error("createProduct err:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET all products (with pagination + search)
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

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .populate("subcategory", "name")
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      meta: { total, page: pageNum, limit: limitNum },
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
      .lean();

    if (!p) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: p });
  } catch (err) {
    console.error("getProductById err:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET product by SKU (since barcode field doesn't exist in schema)
async function getByBarcode(req, res) {
  try {
    const code = req.params.barcode;

    const p = await Product.findOne({ sku: code })
      .populate("category", "name")
      .populate("subcategory", "name")
      .lean();

    if (!p) {
      return res.status(404).json({ success: false, message: "Product not found" });
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

    if (req.files && req.files.length) {
      updateData.images = uniqueImages(
        req.files.map(f => ({
          url: `/uploads/${f.filename}`,
          filename: f.originalname,
          contentType: f.mimetype,
        }))
      );
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateProduct err:", err);
    res.status(400).json({ success: false, message: err.message });
  }
}

// DELETE product (with image cleanup)
async function deleteProduct(req, res) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // cleanup uploaded images
    product.images.forEach(img => {
      const filePath = path.join(__dirname, "../uploads", path.basename(img.url));
      fs.unlink(filePath, err => {
        if (err) console.error("File delete error:", err.message);
      });
    });

    res.json({ success: true, message: "Product deleted successfully" });
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
