const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.post('/', salesController.processCheckout);
router.get('/stats', salesController.getStats);
router.get('/history', salesController.getHistory);

module.exports = router;