require('dotenv').config(); // ◄--- MUST BE AT THE VERY TOP OF SERVER.JS

const express = require('express');
const cors = require('cors');

// Import Modularized Routes...


// Import Modularized Routes
const authRoutes = require('./Routes/authRoutes');
const productRoutes = require('./Routes/productRoutes');
const salesRoutes = require('./Routes/salesRoutes');

const app = express();

// 1. GLOBAL MIDDLEWARE
app.use(cors()); 
app.use(express.json()); 

// 2. GLOBAL BACKEND ROUTING RULE REDIRECTS (Handles /api prefix fallback)
app.use((req, res, next) => {
  if (!req.url.startsWith('/api/')) {
    if (req.url.startsWith('/products')) req.url = '/api' + req.url;
    if (req.url.startsWith('/sales')) req.url = '/api' + req.url;
  }
  next();
});

// 3. MOUNT ROUTING CONTROLLERS
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);

// 4. RUN SERVER ENGINE
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Clean Unified Backend active on port ${PORT}`));
