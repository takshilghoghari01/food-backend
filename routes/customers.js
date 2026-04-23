const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Customer = require("../models/Customer");

// Get all customers (users with role "customer")
router.get("/", async (req, res) => {
  try {
    const users = await User.find({ role: "customer" });
    const customersWithRatings = await Promise.all(
      users.map(async (user) => {
        const customer = await Customer.findOne({ phone: user.phone });
        const averageRating = customer ? customer.averageRating : 0;
        return {
          ...user.toObject(),
          averageRating: averageRating,
        };
      })
    );
    res.json(customersWithRatings);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a customer by ID
router.delete("/:id", async (req, res) => {
  try {
    const customer = await User.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
