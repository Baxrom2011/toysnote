const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },

    sana: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Payment ||
  mongoose.model('Payment', paymentSchema);
