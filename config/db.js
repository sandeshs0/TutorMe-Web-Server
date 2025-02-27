const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  const dbUri =
    process.env.NODE_ENV === "test"
      ? "mongodb://localhost:27017/db_tutorme_test" // ✅ Use test database for testing
      : "mongodb://localhost:27017/db_tutorme"; // ✅ Use development database for development

  try {
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Connected to MongoDB: ${dbUri}`);
  } catch (e) {
    console.error("Error connecting to MongoDB:", e.message);
    process.exit(1);
  }
};

module.exports = connectDB;