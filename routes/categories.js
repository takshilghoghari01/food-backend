const express = require("express");
const Category = require("../models/Category");
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

// Get all categories (public for customers)
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create category
router.post("/", upload.single("image"), auth, async (req, res) => {
  const categoryData = {
    name: req.body.name,
    image: req.file
      ? "uploads/" + req.file.filename
      : req.body.image || "https://placehold.co/200x200",
  };
  const category = new Category(categoryData);
  try {
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update category by ID
router.put("/:id", upload.single("image"), auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    category.name = req.body.name || category.name;
    category.image = req.file
      ? "uploads/" + req.file.filename
      : req.body.image || category.image;
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete category by ID
router.delete("/:id", auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    // Delete all menu items belonging to this category
    await MenuItem.deleteMany({ category: category.name });
    // Delete the category
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category and its menu items deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
