const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ ROUTES ============
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const saleRoutes = require('./routes/sales');
const paymentRoutes = require('./routes/payments');
const statisticRoutes = require('./routes/statistics');

// API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statistics', statisticRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Frontend route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint topilmadi' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ MONGODB ============
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toys_note';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB ga ulanish muvaffaqiyatli');
    
    // Counter yaratish
    const Counter = require('./models/Counter');
    const counter = await Counter.findOne({ name: 'product_artikul' });
    if (!counter) {
      const newCounter = new Counter({ name: 'product_artikul', value: 0 });
      await newCounter.save();
      console.log('✅ Counter yaratildi');
    }
    
    // Admin foydalanuvchi yaratish
    const User = require('./models/User');
    const admin = await User.findOne({ login: 'baxrom' });
    if (!admin) {
      const newAdmin = new User({
        login: 'baxrom',
        password: '14042011',
        role: 'admin'
      });
      await newAdmin.save();
      console.log('✅ Admin yaratildi: baxrom / 14042011');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB ulanish xatosi:', err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portda ishlamoqda`);
  console.log(`📍 http://localhost:${PORT}`);
});
