const express = require("express");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const router = express.Router();

// Get all orders (admin only)
router.get("/", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  try {
    const orders = await Order.find()
      .populate("customerId")
      .populate("items.itemId");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user orders (authenticated users)
router.get("/user", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const orders = await Order.find({ customerId: req.session.user.id })
      .populate("customerId")
      .populate("items.itemId");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get orders by status
router.get("/status/:status", async (req, res) => {
  try {
    const orders = await Order.find({ status: req.params.status })
      .populate("customerId")
      .populate("items.itemId");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId")
      .populate("items.itemId");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create order
router.post("/", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { items, tableNumber, paymentMethod, totalAmount } = req.body;
  try {
    // Use session user as customer
    const finalCustomerId = req.session.user.id;
    const customerName = req.session.user.username;
    const customerPhone = req.session.user.phone;

    // Generate unique orderId
    const lastOrder = await Order.findOne().sort({ orderId: -1 });
    const newOrderId = lastOrder ? lastOrder.orderId + 1 : 1;

    // Calculate totalAmount if not provided
    const calculatedTotal =
      totalAmount ||
      items.reduce((sum, item) => sum + item.quantity * item.priceAtOrder, 0);

    const order = new Order({
      orderId: newOrderId,
      customerId: finalCustomerId || null,
      customerName,
      tableNumber,
      items,
      paymentMethod: paymentMethod || "online",
      status: paymentMethod === "cash" ? "cash-pending" : "pending",
      totalAmount: calculatedTotal,
    });

    const newOrder = await order.save();

    // Handle payment creation for both online and cash
    if (finalCustomerId) {
      const lastPayment = await Payment.findOne().sort({ paymentId: -1 });
      const newPaymentId = lastPayment ? lastPayment.paymentId + 1 : 1;
      const newPayment = new Payment({
        paymentId: newPaymentId,
        customerId: finalCustomerId,
        orderId: newOrder.orderId,
        paymentMethod: paymentMethod === "online" ? "Card" : "Cash",
        totalAmount: calculatedTotal,
        tax: calculatedTotal * 0.05,
      });
      await newPayment.save();
    }

    const populatedOrder = await Order.findById(newOrder._id)
      .populate("customerId")
      .populate("items.itemId");
    res.status(201).json(populatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update order status
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete order
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
