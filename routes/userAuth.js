const express = require("express");
const User = require("../models/User");

const router = express.Router();

// User Register
router.post("/register", async (req, res) => {
  const { username, phone, password, role = "customer" } = req.body;
  if (!username || !phone || !password) {
    return res
      .status(400)
      .json({ message: "Username, phone, and password are required" });
  }
  try {
    const existingUserByPhone = await User.findOne({ phone });
    if (existingUserByPhone) {
      return res
        .status(400)
        .json({ message: "Phone number already registered" });
    }
    const user = new User({ username, phone, password, role });
    await user.save();
    req.session.user = {
      id: user._id,
      username: user.username,
      phone: user.phone,
      role: user.role,
    };
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: err.message });
  }
});

// User Login
router.post("/login", async (req, res) => {
  const { phone, password } = req.body;
  console.log("Login attempt:", { phone, password: password ? "***" : null });
  try {
    // Find user by phone
    const user = await User.findOne({ phone, role: { $ne: "admin" } });
    console.log(
      "User found:",
      user
        ? {
            id: user._id,
            username: user.username,
            phone: user.phone,
            role: user.role,
          }
        : null
    );
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const passwordMatch = await user.comparePassword(password);
    console.log("Password match:", passwordMatch);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    user.lastLogin = new Date();
    await user.save();
    req.session.user = {
      id: user._id,
      username: user.username,
      phone: user.phone,
      role: user.role,
    };
    res.json({
      message: "User login successful",
      user: {
        username: user.username,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("User login error:", err);
    res.status(500).json({ message: err.message });
  }
});

// User Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("user.sid");
    res.json({ message: "User logout successful" });
  });
});

// User Profile
router.get("/profile", async (req, res) => {
  if (req.session && req.session.user) {
    try {
      const user = await User.findById(req.session.user.id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

// Update User Profile
router.put("/profile", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { username, phone } = req.body;
  if (!username || !phone) {
    return res.status(400).json({ message: "Username and phone are required" });
  }
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check if phone is changed and if it's unique
    if (phone !== user.phone) {
      const existingUser = await User.findOne({
        phone,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
      // For OTP, perhaps send OTP here, but for simplicity, assume no OTP or handle in frontend
    }
    user.username = username;
    user.phone = phone;
    await user.save();
    req.session.user.username = username;
    req.session.user.phone = phone;
    res.json({
      message: "Profile updated successfully",
      user: { username, phone },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
