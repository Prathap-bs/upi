const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  upiId: { type: String, required: true, unique: true },
  isActive: { type: Boolean, required: true, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
