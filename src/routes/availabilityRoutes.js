const express = require("express");
const Availability = require("../models/Availability");
const User = require("../models/User");

const router = express.Router();

router.post("/view-availability", async (req, res) => {
    const { professorId, date } = req.body;

    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const availability = await Availability.findOne({
            professorId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        if (!availability) {
            return res.status(404).json({ message: "No availability found" });
        }

        res.status(200).json({ slots: availability.slots });
    } catch (err) {
        console.error("Error fetching availability:", err);
        res.status(500).json({ message: "An error occurred" });
    }
});

router.post("/set-availability", async (req, res) => {
    const { professorId, date, slots } = req.body;

    try {
        const professor = await User.findById(professorId);
        if (!professor || professor.role !== "Professor") {
            return res.status(400).json({ message: "Invalid professor" });
        }

        const existingAvailability = await Availability.findOne({ professorId, date });
        if (existingAvailability) {
            for (const newSlot of slots) {
                for (const existingSlot of existingAvailability.slots) {
                    const newStart = new Date(newSlot.startTime);
                    const newEnd = new Date(newSlot.endTime);
                    const existingStart = new Date(existingSlot.startTime);
                    const existingEnd = new Date(existingSlot.endTime);

                    const isOverlap =
                        (newStart >= existingStart && newStart < existingEnd) ||
                        (newEnd > existingStart && newEnd <= existingEnd) ||
                        (newStart <= existingStart && newEnd >= existingEnd);

                    if (isOverlap) {
                        return res.status(400).json({ message: "Slot overlaps with existing availability" });
                    }
                }
            }
        }

        const availability = new Availability({
            professorId,
            date,
            slots,
        });

        await availability.save();

        res.status(201).json({ message: "Availability set successfully" });
    } catch (err) {
        console.error("Error setting availability:", err);
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
