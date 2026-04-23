const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
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
  },
  { timestamps: true }
);

customerSchema.virtual("averageRating").get(function () {
  return this.ratingsCount > 0 ? this.ratingsSum / this.ratingsCount : 0;
});

customerSchema.set("toJSON", { virtuals: true });
customerSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Customer", customerSchema);
