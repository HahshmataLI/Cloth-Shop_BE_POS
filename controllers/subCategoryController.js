const SubCategory = require('../models/subCategory');
const Category = require('../models/Category');

// Create subcategory
const createSubCategory = async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    // ensure category exists
    const cat = await Category.findById(category);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // check duplicate
    const exists = await SubCategory.findOne({ name, category });
    if (exists) {
      return res.status(400).json({ success: false, message: 'SubCategory already exists under this category' });
    }

    const sub = await SubCategory.create({ name, category });
    res.status(201).json({ success: true, data: sub });
  } catch (err) {
    console.error('createSubCategory error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all subcategories (optionally filter by category)
const getSubCategories = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const subs = await SubCategory.find(filter).populate('category', 'name');
    res.json({ success: true, data: subs });
  } catch (err) {
    console.error('getSubCategories error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createSubCategory,
  getSubCategories,
};
