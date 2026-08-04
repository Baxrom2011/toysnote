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

// Static fayllar (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// ============ ROUTES ============
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');        // ⬅️ FAQAT BIR MARTA
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const saleRoutes = require('./routes/sales');
const paymentRoutes = require('./routes/payments');
const statisticRoutes = require('./routes/statistics');

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);                  // ⬅️ BIR MARTA ISHLATILGAN
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statistics', statisticRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Frontend route (SPA uchun)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB ulanish
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toys_note';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB ga ulanish muvaffaqiyatli');
    
    const User = require('./models/User');
    User.findOne({ login: 'baxrom' }).then(user => {
      if (!user) {
        const admin = new User({
          login: 'baxrom',
          password: '14042011',
          role: 'admin'
        });
        admin.save().then(() => {
          console.log('✅ Admin yaratildi: baxrom / 14042011');
        });
      }
    });
  })
  .catch(err => {
    console.error('❌ MongoDB ulanish xatosi:', err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portda ishlamoqda`);
  console.log(`📍 http://localhost:${PORT}`);
});
