// controllers/dashboardController.js
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const mongoose = require('mongoose');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// controllers/dashboardController.js
exports.getSummary = async (req, res) => {
  try {
    const today = startOfDay();
    const monthStart = startOfMonth();

    const [
      totalSalesCount,
      totalPurchasesCount,
      totalProductsCount,
      totalCustomersCount,
      totalSuppliersCount,

      // total sales revenue
      totalRevenueAgg,

      // today's sales
      todaySalesAgg,

      // this month sales
      monthSalesAgg,

      // low stock
      lowStockProductsArr,

      // ---- PROFIT CALCULATIONS ----
      profitAgg,
      todayProfitAgg,
      monthProfitAgg
    ] = await Promise.all([
      Sale.countDocuments(),
      Purchase.countDocuments(),
      Product.countDocuments(),
      Customer.countDocuments(),
      Supplier.countDocuments(),

      // total sales revenue
      Sale.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: "$grandTotal" } } }
      ]),

      // today's sales
      Sale.aggregate([
        { $match: { date: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$grandTotal" }, invoices: { $sum: 1 } } }
      ]),

      // this month sales
      Sale.aggregate([
        { $match: { date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$grandTotal" }, invoices: { $sum: 1 } } }
      ]),

      // low stock products
      Product.find({ stockQuantity: { $lte: 5, $gt: 0 } }).select("_id").lean(),

      // total profit
      Sale.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "prod"
          }
        },
        { $unwind: "$prod" },
        {
          $project: {
            revenue: { 
              $multiply: [
                "$items.quantity", 
                { $subtract: ["$items.unitPrice", "$items.discount"] } // ✅ discount-aware
              ] 
            },
            cost: { $multiply: ["$items.quantity", "$prod.purchasePrice"] }
          }
        },
        {
          $group: {
            _id: null,
            totalProfit: { $sum: { $subtract: ["$revenue", "$cost"] } }
          }
        }
      ]),

      // today's profit
      Sale.aggregate([
        { $match: { date: { $gte: today } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "prod"
          }
        },
        { $unwind: "$prod" },
        {
          $project: {
            revenue: { 
              $multiply: [
                "$items.quantity", 
                { $subtract: ["$items.unitPrice", "$items.discount"] }
              ] 
            },
            cost: { $multiply: ["$items.quantity", "$prod.purchasePrice"] }
          }
        },
        {
          $group: {
            _id: null,
            todayProfit: { $sum: { $subtract: ["$revenue", "$cost"] } }
          }
        }
      ]),

      // this month profit
      Sale.aggregate([
        { $match: { date: { $gte: monthStart } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "prod"
          }
        },
        { $unwind: "$prod" },
        {
          $project: {
            revenue: { 
              $multiply: [
                "$items.quantity", 
                { $subtract: ["$items.unitPrice", "$items.discount"] }
              ] 
            },
            cost: { $multiply: ["$items.quantity", "$prod.purchasePrice"] }
          }
        },
        {
          $group: {
            _id: null,
            monthProfit: { $sum: { $subtract: ["$revenue", "$cost"] } }
          }
        }
      ])
    ]);

    // ✅ Extract values safely
    const totalRevenue = totalRevenueAgg[0]?.totalRevenue || 0;
    const todaySales = todaySalesAgg[0]?.total || 0;
    const todayInvoices = todaySalesAgg[0]?.invoices || 0;
    const monthSales = monthSalesAgg[0]?.total || 0;
    const monthInvoices = monthSalesAgg[0]?.invoices || 0;

    const totalProfit = profitAgg[0]?.totalProfit || 0;
    const todayProfit = todayProfitAgg[0]?.todayProfit || 0;
    const monthProfit = monthProfitAgg[0]?.monthProfit || 0;

    res.json({
      success: true,
      data: {
        totalSales: totalSalesCount,
        totalPurchases: totalPurchasesCount,
        totalProducts: totalProductsCount,
        totalCustomers: totalCustomersCount,
        totalSuppliers: totalSuppliersCount,

        totalRevenue,
        totalProfit,

        todaySales,
        todayInvoices,
        todayProfit,

        monthSales,
        monthInvoices,
        monthProfit,

        lowStockProducts: lowStockProductsArr.length
      }
    });
  } catch (err) {
    console.error("getSummary error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// GET /api/v1/dashboard/top-products?limit=5
exports.getTopProducts = async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit || '5', 10));

    const topProducts = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: { $toObjectId: '$items.product' }, // ensure ObjectId for lookup
          totalQty: { $sum: '$items.quantity' },
          totalSales: { $sum: '$items.total' }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: { $ifNull: ['$product.name', 'Unknown Product'] },
          sku: '$product.sku',
          totalQty: 1,
          totalSales: 1
        }
      }
    ]);

    res.json({ success: true, data: topProducts });
  } catch (err) {
    console.error('getTopProducts error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/dashboard/weekly-sales
exports.getWeeklySales = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6);
    lastWeek.setHours(0, 0, 0, 0);

    const weeklySales = await Sale.aggregate([
      { $match: { date: { $gte: lastWeek } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$grandTotal' },
          invoices: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const daysMap = new Map(weeklySales.map(d => [d._id, d]));
    const results = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(lastWeek);
      day.setDate(lastWeek.getDate() + i);
      const key = day.toISOString().slice(0, 10);
      const record = daysMap.get(key) || { _id: key, total: 0, invoices: 0 };
      results.push(record);
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('getWeeklySales error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/dashboard/sales-by-payment
exports.getSalesByPaymentMethod = async (req, res) => {
  try {
    const agg = await Sale.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$grandTotal' },
          invoices: { $sum: 1 }
        }
      },
      { $project: { method: '$_id', totalAmount: 1, invoices: 1, _id: 0 } }
    ]);

    res.json({ success: true, data: agg });
  } catch (err) {
    console.error('getSalesByPaymentMethod error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/dashboard/top-customers?limit=5
exports.getTopCustomers = async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit || '5', 10));

    const topCustomers = await Sale.aggregate([
      {
        $group: {
          _id: '$customer',
          totalBought: { $sum: '$grandTotal' },
          invoices: { $sum: 1 }
        }
      },
      { $sort: { totalBought: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          customerId: '$_id',
          name: '$customer.name',
          phone: '$customer.phone',
          totalBought: 1,
          invoices: 1
        }
      }
    ]);

    res.json({ success: true, data: topCustomers });
  } catch (err) {
    console.error('getTopCustomers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/dashboard/products-summary
exports.getProductsSummary = async (req, res) => {
  try {
    const lowThreshold = parseInt(req.query.lowThreshold || '5', 10);
    const [totalProducts, lowStockProducts, outOfStockCount] = await Promise.all([
      Product.countDocuments(),
      Product.find({ stockQuantity: { $lte: lowThreshold, $gt: 0 } }).select('name sku stockQuantity').lean(),
      Product.countDocuments({ stockQuantity: { $lte: 0 } })
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockProducts,
        outOfStockCount
      }
    });
  } catch (err) {
    console.error('getProductsSummary error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/dashboard/purchases-summary
exports.getPurchasesSummary = async (req, res) => {
  try {
    const monthStart = startOfMonth();
    const purchasesMonthAgg = await Purchase.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, invoices: { $sum: 1 } } }
    ]);

    const totalThisMonth = (purchasesMonthAgg.length) ? purchasesMonthAgg[0].total : 0;
    const invoicesThisMonth = (purchasesMonthAgg.length) ? purchasesMonthAgg[0].invoices : 0;

    const totalSuppliers = await Supplier.countDocuments();

    res.json({
      success: true,
      data: {
        totalThisMonth,
        invoicesThisMonth,
        totalSuppliers
      }
    });
  } catch (err) {
    console.error('getPurchasesSummary error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
