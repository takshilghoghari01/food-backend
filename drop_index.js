const mongoose = require("mongoose");

async function dropIndex() {
  try {
    await mongoose.connect("mongodb://localhost:27017/food-admin", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    const result = await mongoose.connection.db
      .collection("users")
      .dropIndex("username_1");
    console.log("Index dropped:", result);

    await mongoose.connection.close();
    console.log("Disconnected");
  } catch (err) {
    console.error("Error dropping index:", err);
    process.exit(1);
  }
}

dropIndex();
