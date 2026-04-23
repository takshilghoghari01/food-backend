const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  priceAtOrder: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: Number,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    customerName: {
      type: String,
      required: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    items: [orderItemSchema],
    itemRatings: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
      },
    ],
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "online",
      required: true,
    },
    status: {
      type: String,
      enum: ["cash-pending", "pending", "processing", "completed"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
