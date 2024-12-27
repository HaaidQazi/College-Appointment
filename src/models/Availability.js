const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  professorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  slots: [
    {
      startTime: { type: Date, required: true },
      endTime: { type: Date, required: true },
      isBooked: { type: Boolean, default: false },
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },
  ],
});

module.exports = mongoose.model("Availability", availabilitySchema);
