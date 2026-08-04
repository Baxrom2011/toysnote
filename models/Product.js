const mongoose = require('mongoose');

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
  // Agar artikul allaqachon mavjud bo'lsa, o'tkazib yuborish
  if (this.artikul) {
    return next();
  }
  
  try {
    // Barcha mahsulotlarni artikul bo'yicha tartiblab, oxirgisini olish
    const lastProduct = await mongoose.model('Product')
      .findOne({})
      .sort({ artikul: -1 })
      .select('artikul');
    
    let nextNumber = 1;
    
    if (lastProduct && lastProduct.artikul) {
      // ART-001 dan raqamni olish
      const match = lastProduct.artikul.match(/ART-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    // 3 xonali raqam formatida (001, 002, 003...)
    this.artikul = `ART-${String(nextNumber).padStart(3, '0')}`;
    
    console.log(`✅ Yangi artikul yaratildi: ${this.artikul}`);
    next();
    
  } catch (error) {
    console.error('Artikul yaratish xatosi:', error);
    // Xatolik bo'lsa vaqt bo'yicha unique raqam
    const timestamp = Date.now().toString().slice(-6);
    this.artikul = `ART-${timestamp}`;
    next();
  }
});

module.exports = mongoose.model('Product', ProductSchema);
