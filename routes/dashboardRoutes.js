// routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// public for now — add auth middleware where needed
router.get('/summary', dashboardController.getSummary);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/weekly-sales', dashboardController.getWeeklySales);
router.get('/sales-by-payment', dashboardController.getSalesByPaymentMethod);
router.get('/top-customers', dashboardController.getTopCustomers);
router.get('/products-summary', dashboardController.getProductsSummary);
router.get('/purchases-summary', dashboardController.getPurchasesSummary);

module.exports = router;
