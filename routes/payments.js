const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// Get all payments with tableNumber from related order
const Order = require('../models/Order');

router.get('/', async (req, res) => {
  try {
    // Fetch payments
    const payments = await Payment.find().sort({ createdAt: -1 });

    // Fetch related orders for each payment's orderId
    const orderIds = payments.map(p => p.orderId);
    const orders = await Order.find({ orderId: { $in: orderIds } });

    // Map orderId to tableNumber
    const orderTableMap = {};
    orders.forEach(order => {
      orderTableMap[order.orderId] = order.tableNumber;
    });

    // Add tableNumber to each payment object
    const paymentsWithTable = payments.map(payment => {
      const paymentObj = payment.toObject();
      paymentObj.tableNumber = orderTableMap[payment.orderId] || null;
      return paymentObj;
    });

    res.json(paymentsWithTable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single payment
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create payment
router.post('/', async (req, res) => {
  const payment = new Payment({
    paymentId: req.body.paymentId,
    customerId: req.body.customerId,
    orderId: req.body.orderId,
    paymentMethod: req.body.paymentMethod,
    totalAmount: req.body.totalAmount,
    tax: req.body.tax
  });

  try {
    const newPayment = await payment.save();
    res.status(201).json(newPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (req.body.paymentId != null) payment.paymentId = req.body.paymentId;
    if (req.body.customerId != null) payment.customerId = req.body.customerId;
    if (req.body.orderId != null) payment.orderId = req.body.orderId;
    if (req.body.paymentMethod != null) payment.paymentMethod = req.body.paymentMethod;
    if (req.body.totalAmount != null) payment.totalAmount = req.body.totalAmount;
    if (req.body.tax != null) payment.tax = req.body.tax;

    const updatedPayment = await payment.save();
    res.json(updatedPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    await payment.deleteOne();
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
