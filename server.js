require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const path = require("path");

const app = express();

// ✅ Required for Render (trust proxy for cookies)
app.set("trust proxy", 1);

// ✅ CORS (temporary open - will restrict later)
app.use(
  cors({
    origin: true,   // 🔥 allow all (for now)
    credentials: true,
  })
);
// ✅ Session base config
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  proxy: true, // 🔥 ADD THIS
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  },
};

// ✅ Separate sessions
const adminSession = session({
  ...sessionConfig,
  name: "admin.sid",
});

const userSession = session({
  ...sessionConfig,
  name: "user.sid",
});

// ✅ Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES ================= //

// 🔐 Admin Routes
app.use("/api/admin/customers", adminSession, require("./routes/customers"));
app.use("/api/admin/categories", adminSession, require("./routes/categories"));
app.use("/api/admin/menu-items", adminSession, require("./routes/menuItems"));
app.use("/api/admin/payments", adminSession, require("./routes/payments"));
app.use("/api/admin/orders", adminSession, require("./routes/orders"));
app.use("/api/admin/dashboard", adminSession, require("./routes/dashboard"));
app.use("/api/admin/auth", adminSession, require("./routes/adminAuth"));

// 👤 User Routes
app.use("/api/auth", userSession, require("./routes/userAuth"));
app.use("/api/orders", userSession, require("./routes/orders"));

// 🌐 Public Routes
app.use("/api/categories", require("./routes/categories"));
app.use("/api/menu-items", require("./routes/menuItems"));
app.use("/api/ratings", require("./routes/ratings"));

// ✅ Default Route
app.get("/", (req, res) => {
  res.send("Food Admin Backend API");
});

// ================= SERVER ================= //

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // ✅ Connect MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    // ✅ Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

startServer();