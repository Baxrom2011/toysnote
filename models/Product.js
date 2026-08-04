const mongoose = require('mongoose');
const Counter = require('./Counter');

const ProductSchema = new mongoose.Schema({
  artikul: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  narx: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ART-001 dan boshlab ketma-ket nomer berish
ProductSchema.pre('save', async function(next) {
  if (!this.artikul) {
    try {
      // Counter dan keyingi raqamni olish
      const counter = await Counter.findOneAndUpdate(
        { name: 'product_artikul' },
        { $inc: { value: 1 } },
        { upsert: true, new: true }
      );
      
      // 3 xonali raqam formatida (001, 002, 003...)
      this.artikul = `ART-${String(counter.value).padStart(3, '0')}`;
      
    } catch (error) {
      console.error('Artikul yaratish xatosi:', error);
      // Xatolik bo'lsa vaqt bo'yicha unique raqam
      this.artikul = `ART-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
