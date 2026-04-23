const express = require("express");
const Admin = require("../models/Admin");

const router = express.Router();

// Admin Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid admin credentials" });
    }
    admin.lastLogin = new Date();
    await admin.save();
    req.session.user = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    };
    res.json({ message: "Admin login successful" });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Admin Register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }],
    });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Email or username already exists" });
    }
    const admin = new Admin({ username, email, password });
    await admin.save();
    req.session.user = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    };
    res.json({ message: "Admin registration successful" });
  } catch (err) {
    console.error("Admin registration error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Admin Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("admin.sid");
    res.json({ message: "Admin logout successful" });
  });
});

const authSession = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === "admin") {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Get admin profile
router.get("/profile", authSession, async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.user.id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
