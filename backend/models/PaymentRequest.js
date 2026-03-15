const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  upiAccount: {
    name: String,
    upiId: String
  },
  qrCodeData: { type: String },
  status: {
    type: String,
    enum: ['Waiting for Payment', 'Customer Claimed Payment', 'Verified', 'Rejected'],
    default: 'Waiting for Payment'
  },
  customerNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
