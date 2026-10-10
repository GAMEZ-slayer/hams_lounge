const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesaController');

// Initiate STK Push
router.post('/stkpush', mpesaController.initiateSTKPush);

// M-Pesa Callback (Safaricom will call this)
router.post('/callback', mpesaController.handleCallback);

// Check payment status
router.get('/status/:checkoutRequestId', mpesaController.checkPaymentStatus);

module.exports = router;
