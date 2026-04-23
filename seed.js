const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Admin = require("./models/Admin");
const Customer = require("./models/Customer");
const MenuItem = require("./models/MenuItem");
const Category = require("./models/Category");
const Order = require("./models/Order");
const Payment = require("./models/Payment");

const connectDB = async () => {
  const connStr =
    process.env.MONGO_URI || "mongodb://localhost:27017/food-admin";
  await mongoose.connect(connStr);
  console.log("MongoDB connected for seeding");
};

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Admin.deleteMany({});
  await Customer.deleteMany({});
  await MenuItem.deleteMany({});
  await Order.deleteMany({});
  await Payment.deleteMany({});

  // Create sample customers
  const customers = [
    // Removed seeded customers to avoid confusion with real customers
  ];
  const savedCustomers = [];

  // No sample orders or payments since no customers are seeded

  console.log("Database seeded successfully");
  process.exit(0);
};

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
