const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();


app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);


const connectDB = async () => {
  try {
    const connectionURI = process.env.MONGO_URI || 'mongodb://localhost:27017/test1';
    await mongoose.connect(connectionURI); // Simplified connection
    console.log("Database connected successfully");
  } catch (err) {
    console.error("DB Connection Error:", err.message);
  }
};

connectDB();

const PORT = process.env.PORT || 8000;


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; 
