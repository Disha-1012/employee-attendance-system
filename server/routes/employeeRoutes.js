import express from "express";

import {
  getEmployees,
  getEmployeeById,
  updateEmployeeStatus
} from "../controllers/employeeController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";


const router =
  express.Router();


/*
|--------------------------------------------------------------------------
| Get Employees
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  protect,
  authorize("hr"),
  getEmployees
);


/*
|--------------------------------------------------------------------------
| Get Employee Details
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  protect,
  authorize("hr"),
  getEmployeeById
);


/*
|--------------------------------------------------------------------------
| Activate / Deactivate Employee
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/status",
  protect,
  authorize("hr"),
  updateEmployeeStatus
);


export default router;
