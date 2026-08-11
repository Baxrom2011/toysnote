const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  sana: {
    type: String,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  soni: {
    type: Number,
    required: true,
    min: 1
  },
  narx: {
    type: Number,
    required: true
  },
  jami: {
    type: Number,
    required: true
  },
  tolangan: {
    type: Number,
    default: 0
  },
  qarz: {
    type: Number,
    default: 0,
    min: 0
  },
  // Sotuvdan ortiqcha to'langan pul bilan bog'liq payment
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', SaleSchema);
