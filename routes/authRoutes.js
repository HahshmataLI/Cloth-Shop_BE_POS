const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

// Public routes
router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);

module.exports = router;
