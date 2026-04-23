const express = require("express");
const User = require("../models/User");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const router = express.Router();

// Get dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month counts
    const totalCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfThisMonth },
    });
    const totalItems = await MenuItem.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });
    const totalRevenueAgg = await Order.aggregate([
      {
        $match: { status: "completed", createdAt: { $gte: startOfThisMonth } },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue =
      totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

    // Last month counts
    const lastMonthCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthItems = await MenuItem.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthRevenueAgg = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const lastMonthRevenue =
      lastMonthRevenueAgg.length > 0 ? lastMonthRevenueAgg[0].total : 0;

    // Calculate percentage changes
    const calcChange = (current, previous) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return ((current - previous) / previous) * 100;
    };

    const customersChange = calcChange(totalCustomers, lastMonthCustomers);
    const itemsChange = calcChange(totalItems, lastMonthItems);
    const ordersChange = calcChange(totalOrders, lastMonthOrders);
    const revenueChange = calcChange(totalRevenue, lastMonthRevenue);

    res.json({
      totalCustomers,
      totalRevenue,
      totalOrders,
      totalItems,
      customersChange,
      itemsChange,
      ordersChange,
      revenueChange,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get popular item (simplified, just first item)
router.get("/popular-item", async (req, res) => {
  try {
    const item = await MenuItem.findOne().sort({ rating: -1 });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
