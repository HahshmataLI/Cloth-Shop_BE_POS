const express = require('express');
const router = express.Router();
const { createSubCategory, getSubCategories } = require('../controllers/subCategoryController');
const { protect, authorize } = require('../middlewares/auth');
const SubCategory = require('../models/subCategory');

// @route   POST /api/v1/subcategories
// @access  Admin
router.post('/', protect, authorize('admin'), createSubCategory);

// @route   GET /api/v1/subcategories
// @access  Public/Admin
// supports: /api/v1/subcategories?category=categoryId
router.get('/', getSubCategories);

// @route   GET /api/v1/subcategories/by-category/:categoryId
// @access  Public/Admin
router.get('/by-category/:categoryId', async (req, res) => {
  try {
    const subcategories = await SubCategory.find({ category: req.params.categoryId })
      .populate('category', 'name');
    res.json({ success: true, data: subcategories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
