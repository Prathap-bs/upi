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

router.get('/transactions', async (req, res) => {
  try {
    const { upiId, startDate, endDate } = req.query;
    const query = {};

    if (upiId && upiId !== 'all') {
      query['upiAccount.upiId'] = upiId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const transactions = await PaymentRequest.find(query).sort({ createdAt: -1 });

    const groupedMap = transactions.reduce((acc, tx) => {
      const key = tx.upiAccount?.upiId || 'unknown@upi';
      if (!acc[key]) {
        acc[key] = {
          upiId: key,
          accountName: tx.upiAccount?.name || 'Unknown Account',
          totalAmount: 0,
          transactionCount: 0,
          statusCounts: {
            waiting: 0,
            claimed: 0,
            verified: 0,
            rejected: 0,
          },
          transactions: [],
        };
      }

      acc[key].totalAmount += tx.amount;
      acc[key].transactionCount += 1;
      if (tx.status === 'Waiting for Payment') acc[key].statusCounts.waiting += 1;
      if (tx.status === 'Customer Claimed Payment') acc[key].statusCounts.claimed += 1;
      if (tx.status === 'Verified') acc[key].statusCounts.verified += 1;
      if (tx.status === 'Rejected') acc[key].statusCounts.rejected += 1;
      acc[key].transactions.push(tx);

      return acc;
    }, {});

    const groupedTransactions = Object.values(groupedMap);
    res.json({ transactions, groupedTransactions });
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
