import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const createHR = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const email = "attendify.hr@gmail.com";

    const existingHR = await User.findOne({
      email
    });

    if (existingHR) {
      console.log("HR account already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      process.env.DEMO_HR_PASSWORD,
      12
    );

    const hr = await User.create({
      name: "Attendify HR",
      email,
      password: hashedPassword,
      employeeId: "HR002",
      role: "hr",
      department: "Human Resources",
      designation: "HR Manager",
      salary: 0,
      paidLeaveQuota: 12,
      isActive: true
    });

    console.log("HR account created successfully.");
    console.log(`Email: ${hr.email}`);
    console.log(`Employee ID: ${hr.employeeId}`);

    process.exit(0);
  } catch (error) {
    console.error("Failed to create HR account:", error);
    process.exit(1);
  }
};

createHR();