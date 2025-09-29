const express = require('express');
const router = express.Router();

const { createCategory, getCategories } = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/auth');

// @route   POST /api/v1/categories
// @access  Admin only
router.post('/', protect, authorize('admin'), createCategory);

// @route   GET /api/v1/categories
// @access  Public
router.get('/', getCategories);

module.exports = router;
