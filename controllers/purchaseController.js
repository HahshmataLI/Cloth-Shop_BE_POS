const Purchase = require('../models/Purchase');
const Product = require('../models/Product');



// @desc   Create new purchase & update stock
// @route  POST /api/v1/purchases
exports.createPurchase = async (req, res, next) => {
  const session = await Purchase.startSession();
  session.startTransaction();

  try {
    let { items, tax, amountPaid, paymentMethod, supplier, notes } = req.body;

    // Calculate totals
    const subTotal = items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
    const grandTotal = subTotal + (tax || 0);
    const balanceDue = grandTotal - (amountPaid || 0);

    // Create purchase
    const purchase = await Purchase.create(
      [
        {
          invoiceNumber: `INV-${Date.now()}`,
          supplier,
          items: items.map(i => ({
            ...i,
            total: i.quantity * i.unitCost,
          })),
          subTotal,
          tax,
          grandTotal,
          paymentMethod,
          amountPaid,
          balanceDue,
          notes,
        },
      ],
      { session }
    );

    // ✅ Update stock for each purchased product
    for (const item of items) {
      await Product.findByIdAndUpdate(
  item.product,
  { $inc: { stockQuantity: item.quantity } }, // ✅ correct field
  { new: true, session }
);

    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: purchase[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
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
  const session = await Purchase.startSession();
  session.startTransaction();

  try {
    const purchase = await Purchase.findById(req.params.id).session(session);

    if (!purchase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, error: 'Purchase not found' });
    }

    // ✅ Decrease stock for each purchased item
    for (const item of purchase.items) {
    await Product.findByIdAndUpdate(
  item.product,
  { $inc: { stockQuantity: -item.quantity } }, // ✅ correct field
  { new: true, session }
);

    }

    await purchase.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};
