const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/signup", async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: "Email is already in use" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, role });
        await user.save();

        res.status(201).json({ message: "User created successfully", _id: user._id });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(400).json({ error: err.message });
    }
});

router.post("/login", async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const user = await User.findOne({ email, role });

        if (!user) {
            return res.status(400).json({ message: "User not found or role mismatch" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "testsecretkey",
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: `User logged in successfully as ${role}`,
            token,
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
