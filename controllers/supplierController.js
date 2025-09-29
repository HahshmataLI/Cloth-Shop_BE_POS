const Supplier = require('../models/Supplier');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Create supplier
// @route   POST /api/v1/suppliers
exports.createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json({ success: true, data: supplier });
});

// @desc    Get all suppliers
// @route   GET /api/v1/suppliers
exports.getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find();
  res.json({ success: true, count: suppliers.length, data: suppliers });
});

// @desc    Get supplier by ID
// @route   GET /api/v1/suppliers/:id
exports.getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, data: supplier });
});

// @desc    Update supplier
// @route   PUT /api/v1/suppliers/:id
exports.updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: supplier });
});

// @desc    Delete supplier
// @route   DELETE /api/v1/suppliers/:id
exports.deleteSupplier = asyncHandler(async (req, res) => {
  await Supplier.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Supplier deleted' });
});
