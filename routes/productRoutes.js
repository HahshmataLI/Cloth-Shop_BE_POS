const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const path = require('path');

// Disk storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB max per image

// Routes
router.post('/', upload.array('images', 6), productController.createProduct); // create with images
router.get('/', productController.getProducts);
router.get('/barcode/:barcode', productController.getByBarcode);
router.get('/:id', productController.getProductById);
router.put('/:id', upload.array('images', 6), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
