const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    user.lastLogin = new Date();
    console.log("Setting lastLogin for user:", user.username, user.lastLogin);
    await user.save();
    console.log("User saved with lastLogin:", user.lastLogin);
    req.session.user = {
      id: user._id,
      username: user.username,
      phone: user.phone,
      role: user.role,
    };
    res.json({
      message: "Login successful",
      user: {
        username: user.username,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Register new user
router.post("/register", async (req, res) => {
  const { username, phone, password, role } = req.body;
  if (!username || !phone || !password) {
    return res
      .status(400)
      .json({ message: "Username, phone, and password are required" });
  }
  try {
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const existingUserByPhone = await User.findOne({ phone });
    if (existingUserByPhone) {
      return res
        .status(400)
        .json({ message: "Phone number already registered" });
    }
    const newUser = new User({
      username,
      phone,
      password,
      role: role || "customer",
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: err.message });
  }
});

const authSession = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Get user profile
router.get("/profile", authSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
});

module.exports = router;
