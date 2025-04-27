import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // 1. Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10); // generate random salt
    const hashedPassword = await bcrypt.hash(password, salt); // hash password

    // 4. Save new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // 5. Send success response
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ message: "Server error" });
  }
};
