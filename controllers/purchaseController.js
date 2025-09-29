const Purchase = require('../models/Purchase');

// @desc   Create new purchase
// @route  POST /api/v1/purchases
exports.createPurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.create(req.body);
    res.status(201).json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
};

// @desc   Get all purchases
// @route  GET /api/v1/purchases
exports.getPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find().populate('supplier').populate('items.product');
    res.status(200).json({ success: true, data: purchases });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single purchase
// @route  GET /api/v1/purchases/:id
exports.getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('supplier').populate('items.product');
    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Purchase not found' });
    }
    res.status(200).json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
};

// @desc   Update purchase
// @route  PUT /api/v1/purchases/:id
exports.updatePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Purchase not found' });
    }
    res.status(200).json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete purchase
// @route  DELETE /api/v1/purchases/:id
exports.deletePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Purchase not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
