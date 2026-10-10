require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

// Import Modularized Routes
const authRoutes = require('./Routes/authRoutes');
const productRoutes = require('./Routes/productRoutes');
const salesRoutes = require('./Routes/salesRoutes');
const mpesaRoutes = require('./routes/mpesaRoutes');

const app = express();

// 1. GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));

// 2. GLOBAL BACKEND ROUTING RULE REDIRECTS (Handles /api prefix fallback)
app.use((req, res, next) => {
  if (!req.url.startsWith('/api/')) {
    if (req.url.startsWith('/products')) req.url = '/api' + req.url;
    if (req.url.startsWith('/sales')) req.url = '/api' + req.url;
    if (req.url.startsWith('/auth')) req.url = '/api' + req.url;
    if (req.url.startsWith('/mpesa')) req.url = '/api' + req.url;
  }
  next();
});

// 3. MOUNT ROUTING CONTROLLERS
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/mpesa', mpesaRoutes);

// 4. RUN SERVER ENGINE
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Clean Unified Backend active on port ${PORT}`));
