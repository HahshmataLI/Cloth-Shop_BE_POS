const express = require('express');
const router = express.Router();
const custCtrl = require('../controllers/customerController');
const { protect, authorize } = require('../middlewares/auth');

// Routes
router.get('/', protect, custCtrl.getCustomers);
router.post('/', protect, custCtrl.createCustomer);
router.get('/:id', protect, custCtrl.getCustomerById);
router.put('/:id', protect, custCtrl.updateCustomer);
router.delete('/:id', protect, custCtrl.deleteCustomer);

module.exports = router;
