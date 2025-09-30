const Sale = require('../models/Sale');
const Product =require('../models/Product')

// Create a new sale
exports.createSale = async (req, res) => {
  const session = await Sale.startSession();
  session.startTransaction();

  try {
    const { items } = req.body;

    // Check and update stock
    for (let item of items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
      }

      // Deduct stock
      product.stockQuantity -= item.quantity;
      await product.save({ session });
    }

    // Save sale after stock updates
    const sale = new Sale(req.body);
    await sale.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("createSale error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};
// Get all sales
exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('customer')
      .populate('cashier')
      .populate('items.product');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate('cashier')
      .populate('items.product');
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update sale
exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  const session = await Sale.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id).session(session);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    // Restore stock
    for (let item of sale.items) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.stockQuantity += item.quantity;
        await product.save({ session });
      }
    }

    await sale.deleteOne({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: 'Sale deleted and stock restored' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: err.message });
  }
};

