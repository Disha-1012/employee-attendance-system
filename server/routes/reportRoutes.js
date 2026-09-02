import express from "express";

import {
  exportAttendanceReport
} from "../controllers/reportController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";

const router = express.Router();


/*
  HR-only attendance report export
*/

router.get(
  "/attendance/export",
  protect,
  authorize("hr"),
  exportAttendanceReport
);


export default router;
