const express = require('express');
const PaymentRequest = require('../models/PaymentRequest');

const router = express.Router();

router.get('/paymentrequests', async (req, res) => {
  try {
    const list = await PaymentRequest.find().sort({ createdAt: -1 });
    if (list.length === 0) return res.json({ message: 'No payment requests yet', data: [] });
    res.json({ data: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/paymentrequests/:id/claim', async (req, res) => {
  try {
    const request = await PaymentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Waiting for Payment') {
      return res.status(400).json({ message: 'Only waiting requests can be claimed' });
    }

    request.status = 'Customer Claimed Payment';
    await request.save();

    const list = await PaymentRequest.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
