const express = require("express");
const Availability = require("../models/Availability");
const User = require("../models/User");

const router = express.Router();

router.post("/book", async (req, res) => {
    const { studentId, professorId, date, startTime } = req.body;

    try {
        const professor = await User.findById(professorId);
        if (!professor || professor.role !== "Professor") {
            return res.status(400).json({ message: "Invalid professor" });
        }

        const availability = await Availability.findOne({
            professorId,
            date: { $gte: new Date(date).setUTCHours(0, 0, 0, 0), $lt: new Date(date).setUTCHours(23, 59, 59, 999) },
        });

        if (!availability) {
            return res.status(400).json({ message: "No availability found" });
        }

        const slot = availability.slots.find(
            (slot) => slot.startTime.toISOString() === new Date(startTime).toISOString() && !slot.isBooked
        );

        if (!slot) {
            return res.status(400).json({ message: "Slot not available or already booked" });
        }

        slot.isBooked = true;
        slot.studentId = studentId;

        await availability.save();

        res.status(200).json({ message: "Appointment booked successfully" });
    } catch (err) {
        console.error("Error booking appointment:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/cancel-appointment", async (req, res) => {
    const { professorId, studentId, date, startTime } = req.body;

    try {
        const professor = await User.findById(professorId);
        if (!professor || professor.role !== "Professor") {
            return res.status(400).json({ message: "Invalid professor" });
        }

        const availability = await Availability.findOne({
            professorId,
            date: { $gte: new Date(date).setUTCHours(0, 0, 0, 0), $lt: new Date(date).setUTCHours(23, 59, 59, 999) },
        });

        if (!availability) {
            return res.status(400).json({ message: "No availability found for the given date" });
        }

        const slot = availability.slots.find(
            (slot) =>
                slot.startTime.toISOString() === new Date(startTime).toISOString() &&
                slot.isBooked &&
                slot.studentId.toString() === studentId
        );

        if (!slot) {
            return res.status(400).json({ message: "No matching booked slot found" });
        }

        slot.isBooked = false;
        slot.studentId = null;

        await availability.save();

        res.status(200).json({ message: "Appointment cancelled successfully" });
    } catch (err) {
        console.error("Error canceling appointment:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/view-appointments/:studentId", async (req, res) => {
    const { studentId } = req.params;

    try {
        const student = await User.findById(studentId);
        if (!student || student.role !== "Student") {
            return res.status(400).json({ message: "Invalid student" });
        }

        const appointments = await Availability.find({
            "slots.studentId": studentId,
        }).select("date slots");

        const bookedAppointments = [];
        appointments.forEach((availability) => {
            availability.slots.forEach((slot) => {
                if (slot.studentId?.toString() === studentId) {
                    bookedAppointments.push({
                        date: availability.date,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                    });
                }
            });
        });

        res.status(200).json({ appointments: bookedAppointments });
    } catch (err) {
        console.error("Error fetching appointments:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
