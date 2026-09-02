import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "./config/db.js";
import User from "./models/User.js";

dotenv.config();

const seedHR = async () => {
  try {
    await connectDB();

    const existingHR =
      await User.findOne({
        email:
          "admin@attendify.com"
      });

    if (existingHR) {
      console.log(
        "HR account already exists."
      );

      process.exit(0);
    }

    const hashedPassword =
      await bcrypt.hash(
        "Admin@123",
        12
      );

    await User.create({
      name: "HR Administrator",
      email:
        "admin@attendify.com",
      password: hashedPassword,
      employeeId: "HR001",
      role: "hr",
      department:
        "Human Resources",
      designation:
        "HR Manager",
      salary: 0,
      paidLeaveQuota: 0
    });

    console.log(
      "HR account created successfully."
    );

    console.log(
      "Email: admin@attendify.com"
    );

    console.log(
      "Password: Admin@123"
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "HR seed failed:",
      error
    );

    process.exit(1);
  }
};

seedHR();
