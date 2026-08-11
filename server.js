const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ ROUTES ============
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');        // ✅ QO'SHILDI!
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const saleRoutes = require('./routes/sales');
const paymentRoutes = require('./routes/payments');
const statisticRoutes = require('./routes/statistics');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);                   // ✅ QO'SHILDI!
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statistics', statisticRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint topilmadi' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toys_note';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB ga ulanish muvaffaqiyatli');
    
    const User = require('./models/User');
    const adminLogin = process.env.ADMIN_LOGIN;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminLogin && adminPassword) {
      const admin = await User.findOne({ login: adminLogin });
      if (!admin) {
        const newAdmin = new User({
          login: adminLogin,
          password: adminPassword,
          role: 'admin'
        });
        await newAdmin.save();
        console.log(`✅ Admin yaratildi: ${adminLogin}`);
      }
    } else {
      console.warn('⚠️ ADMIN_LOGIN va ADMIN_PASSWORD .env faylida berilmagan. Avtomatik admin yaratilmaydi.');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB ulanish xatosi:', err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portda ishlamoqda`);
});
