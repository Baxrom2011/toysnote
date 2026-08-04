const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const saleRoutes = require('./routes/sales');
const paymentRoutes = require('./routes/payments');
const statisticRoutes = require('./routes/statistics');

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statistics', statisticRoutes);

// MongoDB ulanish
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB ga ulanish muvaffaqiyatli');
  // Admin foydalanuvchi yaratish (agar mavjud bo'lmasa)
  const User = require('./models/User');
  User.findOne({ login: 'baxrom' }).then(user => {
    if (!user) {
      const admin = new User({
        login: 'baxrom',
        password: '14042011',
        role: 'admin'
      });
      admin.save().then(() => {
        console.log('Admin foydalanuvchi yaratildi');
      });
    }
  });
})
.catch(err => {
  console.error('MongoDB ulanish xatosi:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishlamoqda`);
});