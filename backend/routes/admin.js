const express = require('express');
const QRCode = require('qrcode');
const Account = require('../models/Account');
const PaymentRequest = require('../models/PaymentRequest');

const router = express.Router();

router.post('/accounts', async (req, res) => {
  try {
    const { name, upiId } = req.body;
    if (!name || !upiId) return res.status(400).json({ message: 'name and upiId are required' });

    const existing = await Account.findOne({ upiId });
    if (existing) return res.status(409).json({ message: 'UPI ID already exists' });

    const account = new Account({ name, upiId, isActive: false });
    await account.save();
    const accounts = await Account.find();
    res.json(accounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/accounts', async (req, res) => {
  try {
    const accounts = await Account.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/accounts/:id/select', async (req, res) => {
  try {
    const selected = await Account.findById(req.params.id);
    if (!selected) return res.status(404).json({ message: 'Account not found' });

    await Account.updateMany({}, { isActive: false });
    selected.isActive = true;
    await selected.save();

    const accounts = await Account.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/paymentrequests', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: 'Valid amount required' });

    const account = await Account.findOne({ isActive: true });
    if (!account) return res.status(400).json({ message: 'Please select at least one active UPI account' });

    const upiUri = `upi://pay?pa=${encodeURIComponent(account.upiId)}&pn=${encodeURIComponent(account.name)}&am=${amount}&cu=INR`;
    const qrCodeData = await QRCode.toDataURL(upiUri);

    const request = new PaymentRequest({ amount, upiAccount: { name: account.name, upiId: account.upiId }, qrCodeData, status: 'Waiting for Payment' });
    await request.save();

    const list = await PaymentRequest.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/paymentrequests', async (req, res) => {
  try {
    const list = await PaymentRequest.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/paymentrequests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Verified', 'Rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ message: `status must be ${allowed.join(' or ')}` });

    const request = await PaymentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    await request.save();

    const list = await PaymentRequest.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
