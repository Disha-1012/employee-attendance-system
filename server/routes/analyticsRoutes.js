import express from "express";

import {
  getHRDashboardAnalytics
} from "../controllers/analyticsController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";


const router =
  express.Router();


/*
|--------------------------------------------------------------------------
| HR Dashboard Analytics
|--------------------------------------------------------------------------
*/

router.get(
  "/hr-dashboard",
  protect,
  authorize("hr"),
  getHRDashboardAnalytics
);


export default router;
