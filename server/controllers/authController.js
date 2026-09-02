import bcrypt from "bcryptjs";

import User from "../models/User.js";

import generateToken from "../utils/generateToken.js";

/*
|--------------------------------------------------------------------------
| Helper: Generate Safe User Response
|--------------------------------------------------------------------------
*/

const getSafeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    employeeId: user.employeeId,
    role: user.role,
    department: user.department,
    designation: user.designation,
    salary: user.salary,
    paidLeaveQuota: user.paidLeaveQuota,
    joiningDate: user.joiningDate,
    isActive: user.isActive
  };
};

/*
|--------------------------------------------------------------------------
| Register Employee
|--------------------------------------------------------------------------
*/

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      department,
      designation,
      salary
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate Required Fields
    |--------------------------------------------------------------------------
    */

    if (
      !name ||
      !email ||
      !password ||
      !employeeId ||
      !department ||
      !designation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Existing User
    |--------------------------------------------------------------------------
    */

    const existingUser =
      await User.findOne({
        $or: [
          {
            email: email.toLowerCase()
          },
          {
            employeeId:
              employeeId.toUpperCase()
          }
        ]
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "Email or Employee ID already exists"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Hash Password
    |--------------------------------------------------------------------------
    */

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    /*
    |--------------------------------------------------------------------------
    | Create Employee
    |--------------------------------------------------------------------------
    */

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      employeeId:
        employeeId.toUpperCase(),
      department,
      designation,
      salary:
        Number(salary) || 0,
      role: "employee"
    });

    /*
    |--------------------------------------------------------------------------
    | Generate Token
    |--------------------------------------------------------------------------
    */

    const token =
      generateToken(user);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      message:
        "Employee registered successfully",
      token,
      user: getSafeUser(user)
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Registration failed"
    });
  }
};

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate Input
    |--------------------------------------------------------------------------
    */

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find User
    |
    | Password is normally hidden because
    | User model uses select: false.
    |
    | Here we explicitly request it.
    |--------------------------------------------------------------------------
    */

    const user =
      await User.findOne({
        email:
          email.toLowerCase()
      }).select("+password");

    /*
    |--------------------------------------------------------------------------
    | Prevent User Enumeration
    |--------------------------------------------------------------------------
    */

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Account Status
    |--------------------------------------------------------------------------
    */

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Compare Password
    |--------------------------------------------------------------------------
    */

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate JWT
    |--------------------------------------------------------------------------
    */

    const token =
      generateToken(user);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message:
        "Login successful",
      token,
      user: getSafeUser(user)
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Login failed"
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Current User
|--------------------------------------------------------------------------
*/

export const getCurrentUser = async (
  req,
  res
) => {
  try {
    return res.status(200).json({
      success: true,
      user: getSafeUser(req.user)
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch user information"
    });
  }
};
