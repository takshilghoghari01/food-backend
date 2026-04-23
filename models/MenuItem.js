const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    ratingsSum: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    availability: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

menuItemSchema.virtual("rating").get(function () {
  return this.ratingsCount > 0 ? this.ratingsSum / this.ratingsCount : 0;
});

menuItemSchema.set("toJSON", { virtuals: true });
menuItemSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("MenuItem", menuItemSchema);
