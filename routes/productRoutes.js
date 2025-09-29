// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');

// multer memory storage so controller can get file.buffer
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB max per image

// Routes
router.post('/', upload.array('images', 6), productController.createProduct); // create with images
router.get('/', productController.getProducts);
router.get('/barcode/:barcode', productController.getByBarcode);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
