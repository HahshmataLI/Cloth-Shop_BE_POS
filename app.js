const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');


dotenv.config();
const supplierRoutes = require('./routes/supplierRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subCategoryRoutes = require('./routes/subCategory');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const saleRoutes = require('./routes/saleRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./config/logger');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

const path = require('path');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' })); // adjust limit for image buffers
app.use(express.urlencoded({ extended: true }));


if (process.env.NODE_ENV === 'development') {
app.use(morgan('dev'));
}


// routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/subcategories', subCategoryRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/v1/dashboard', dashboardRoutes);
// health check
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));


// centralized error handler (must be last)
app.use(errorHandler);


module.exports = app;