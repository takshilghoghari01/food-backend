const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");

// Submit overall rating for an order
router.post("/order/:orderId", async (req, res) => {
  try {
    console.log(req.method, req.path);
    const { orderId } = req.params;
    const { overallRating } = req.body; // Expect { overallRating: number }

    if (
      typeof overallRating !== "number" ||
      overallRating < 1 ||
      overallRating > 5
    ) {
      return res
        .status(400)
        .json({ message: "overallRating must be a number between 1 and 5" });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if already rated
    if (order.overallRating) {
      return res.status(400).json({ message: "Order has already been rated" });
    }

    // Save overallRating to order
    order.overallRating = overallRating;
    await order.save();

    // Update ratings for each menu item in the order
    for (const item of order.items) {
      const menuItem = await MenuItem.findById(item.itemId);
      if (menuItem) {
        menuItem.ratingsSum += overallRating;
        menuItem.ratingsCount += 1;
        await menuItem.save();
      }
    }

    // Update customer's rating stats if customer exists
    if (order.customerId) {
      const Customer = require("../models/Customer");
      const customer = await Customer.findById(order.customerId);
      if (customer) {
        customer.ratingsSum += overallRating;
        customer.ratingsCount += 1;
        await customer.save();
      }
    }

    res.status(201).json({
      message: "Rating submitted successfully",
      orderId: order._id,
    });
  } catch (err) {
    console.error("Error submitting rating:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
