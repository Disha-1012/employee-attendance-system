import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false
    },

    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      uppercase: true,
      trim: true
    },

    role: {
      type: String,
      enum: ["employee", "hr"],
      default: "employee"
    },

    department: {
      type: String,
      required: true,
      trim: true
    },

    designation: {
      type: String,
      required: true,
      trim: true
    },

    salary: {
      type: Number,
      default: 0,
      min: 0
    },

    paidLeaveQuota: {
      type: Number,
      default: 2,
      min: 0
    },

    joiningDate: {
      type: Date,
      default: Date.now
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({
  department: 1
});

userSchema.index({
  role: 1,
  isActive: 1
});

const User = mongoose.model(
  "User",
  userSchema
);

export default User;
