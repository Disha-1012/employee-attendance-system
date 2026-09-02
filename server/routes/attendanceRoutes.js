import express from "express";

import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getAttendanceForDate
} from "../controllers/attendanceController.js";

import {
  getEmployeeAttendanceSummary
} from "../controllers/attendanceReportController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";

import {
  getMonthlyAttendanceReport
} from "../controllers/monthlyAttendanceController.js";

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Employee Attendance
|--------------------------------------------------------------------------
*/

router.post(
  "/check-in",
  protect,
  authorize("employee"),
  checkIn
);

router.post(
  "/check-out",
  protect,
  authorize("employee"),
  checkOut
);

router.get(
  "/today",
  protect,
  authorize("employee"),
  getTodayAttendance
);

router.get(
  "/my-history",
  protect,
  authorize("employee"),
  getMyAttendance
);

/*
|--------------------------------------------------------------------------
| HR Attendance
|--------------------------------------------------------------------------
*/

router.get(
  "/hr",
  protect,
  authorize("hr"),
  getAttendanceForDate
);

router.get(
  "/hr/summary",
  protect,
  authorize("hr"),
  getEmployeeAttendanceSummary
);

router.get(
  "/hr/monthly-report",
  protect,
  authorize("hr"),
  getMonthlyAttendanceReport
);

export default router;