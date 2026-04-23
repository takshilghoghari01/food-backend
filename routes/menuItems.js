const express = require("express");
const MenuItem = require("../models/MenuItem");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Get all menu items (public for customers)
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    if (req.query.sort === "rating") {
      // Use aggregation to sort by computed rating
      const menuItems = await MenuItem.aggregate([
        {
          $addFields: {
            rating: {
              $cond: {
                if: { $gt: ["$ratingsCount", 0] },
                then: { $divide: ["$ratingsSum", "$ratingsCount"] },
                else: 0,
              },
            },
          },
        },
        { $sort: { rating: -1 } },
        { $limit: limit },
      ]);
      res.json(menuItems);
    } else {
      const menuItems = await MenuItem.find().limit(limit);
      res.json(menuItems);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get menu item by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem)
      return res.status(404).json({ message: "Menu item not found" });
    res.json(menuItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create menu item
router.post("/", upload.single("image"), auth, async (req, res) => {
  const menuItemData = {
    ...req.body,
    image: req.file ? "uploads/" + req.file.filename : req.body.image,
  };
  const menuItem = new MenuItem(menuItemData);
  try {
    const newMenuItem = await menuItem.save();
    res.status(201).json(newMenuItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update menu item
router.put("/:id", upload.single("image"), auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem)
      return res.status(404).json({ message: "Menu item not found" });

    const updateData = {
      ...req.body,
      image: req.file
        ? "uploads/" + req.file.filename
        : req.body.image || menuItem.image,
    };

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
      }
    );
    res.json(updatedMenuItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete menu item
router.delete("/:id", auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem)
      return res.status(404).json({ message: "Menu item not found" });
    res.json({ message: "Menu item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
