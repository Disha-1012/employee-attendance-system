import express from "express";

import {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  getLeaveSummary
} from "../controllers/leaveController.js";

import {
  getMyLeaveBalance
} from "../controllers/leaveBalanceController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";


const router =
  express.Router();


/*
|--------------------------------------------------------------------------
| Employee Routes
|--------------------------------------------------------------------------
*/


/*
  Apply for leave
  POST /api/leaves
*/

router.post(
  "/",
  protect,
  authorize("employee"),
  applyLeave
);


/*
  Get my leaves
  GET /api/leaves/my
*/

router.get(
  "/my",
  protect,
  authorize("employee"),
  getMyLeaves
);

router.get(
  "/balance",
  protect,
  authorize("employee"),
  getMyLeaveBalance
);


/*
  Cancel pending leave
  PATCH /api/leaves/:id/cancel
*/

router.patch(
  "/:id/cancel",
  protect,
  authorize("employee"),
  cancelLeave
);


/*
|--------------------------------------------------------------------------
| HR Routes
|--------------------------------------------------------------------------
*/


/*
  Get leave summary
  GET /api/leaves/summary

  IMPORTANT:
  This route must come before /:id routes.
*/

router.get(
  "/summary",
  protect,
  authorize("hr"),
  getLeaveSummary
);


/*
  Get all leave requests
  GET /api/leaves
*/

router.get(
  "/",
  protect,
  authorize("hr"),
  getAllLeaves
);


/*
  Approve leave
  PATCH /api/leaves/:id/approve
*/

router.patch(
  "/:id/approve",
  protect,
  authorize("hr"),
  approveLeave
);


/*
  Reject leave
  PATCH /api/leaves/:id/reject
*/

router.patch(
  "/:id/reject",
  protect,
  authorize("hr"),
  rejectLeave
);


export default router;
