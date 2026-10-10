const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication login endpoint
router.post('/login', authController.login);

// Change credentials endpoint (supports both PUT and POST)
router.put('/change-password', authController.changePassword);
router.post('/change-password', authController.changePassword);

module.exports = router;
