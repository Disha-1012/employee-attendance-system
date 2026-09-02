import User from "../models/User.js";

import Attendance from "../models/Attendance.js";


/*
|--------------------------------------------------------------------------
| Get Employees
|--------------------------------------------------------------------------
|
| Supports:
|
| GET /api/employees
|
| Query parameters:
|
| search
| department
| status
| page
| limit
|
|--------------------------------------------------------------------------
*/

export const getEmployees =
  async (req, res) => {

    try {

      const {
        search = "",
        department = "",
        status = "all",
        page = 1,
        limit = 10
      } = req.query;


      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const pageNumber =
        Math.max(
          Number(page),
          1
        );

      const limitNumber =
        Math.min(
          Math.max(
            Number(limit),
            1
          ),
          50
        );

      const skip =
        (pageNumber - 1) *
        limitNumber;


      /*
      |--------------------------------------------------------------------------
      | Base Query
      |--------------------------------------------------------------------------
      */

      const query = {
        role: "employee"
      };


      /*
      |--------------------------------------------------------------------------
      | Search
      |--------------------------------------------------------------------------
      |
      | Search by:
      |
      | Name
      | Email
      | Employee ID
      |
      |--------------------------------------------------------------------------
      */

      if (
        search &&
        search.trim()
      ) {

        const searchRegex =
          new RegExp(
            search.trim(),
            "i"
          );

        query.$or = [
          {
            name:
              searchRegex
          },

          {
            email:
              searchRegex
          },

          {
            employeeId:
              searchRegex
          }
        ];

      }


      /*
      |--------------------------------------------------------------------------
      | Department Filter
      |--------------------------------------------------------------------------
      */

      if (
        department &&
        department !== "all"
      ) {

        query.department =
          department;

      }


      /*
      |--------------------------------------------------------------------------
      | Active / Inactive Filter
      |--------------------------------------------------------------------------
      */

      if (
        status === "active"
      ) {

        query.isActive =
          true;

      }

      if (
        status === "inactive"
      ) {

        query.isActive =
          false;

      }


      /*
      |--------------------------------------------------------------------------
      | Fetch Employees
      |--------------------------------------------------------------------------
      */

      const [
        employees,
        total
      ] = await Promise.all([

        User.find(query)
          .select(
            "-password"
          )
          .sort({
            createdAt: -1
          })
          .skip(skip)
          .limit(
            limitNumber
          ),

        User.countDocuments(
          query
        )

      ]);


      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({

        success: true,

        employees,

        pagination: {

          page:
            pageNumber,

          limit:
            limitNumber,

          total,

          totalPages:
            Math.ceil(
              total /
                limitNumber
            )

        }

      });

    } catch (error) {

      console.error(
        "Get employees error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch employees"

      });

    }

  };


/*
|--------------------------------------------------------------------------
| Get Employee Details
|--------------------------------------------------------------------------
|
| GET /api/employees/:id
|
|--------------------------------------------------------------------------
*/

export const getEmployeeById =
  async (req, res) => {

    try {

      const {
        id
      } = req.params;


      /*
      |--------------------------------------------------------------------------
      | Find Employee
      |--------------------------------------------------------------------------
      */

      const employee =
        await User.findOne({
          _id: id,
          role: "employee"
        })
          .select(
            "-password"
          );


      if (!employee) {

        return res.status(404).json({

          success: false,

          message:
            "Employee not found"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Attendance Summary
      |--------------------------------------------------------------------------
      */

      const [
        totalAttendance,
        presentDays,
        lateDays,
        halfDays
      ] = await Promise.all([

        Attendance.countDocuments({
          employee:
            employee._id
        }),

        Attendance.countDocuments({
          employee:
            employee._id,

          status:
            "present"
        }),

        Attendance.countDocuments({
          employee:
            employee._id,

          status:
            "late"
        }),

        Attendance.countDocuments({
          employee:
            employee._id,

          status:
            "half-day"
        })

      ]);


      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({

        success: true,

        employee,

        attendanceSummary: {

          totalAttendance,

          presentDays,

          lateDays,

          halfDays

        }

      });

    } catch (error) {

      console.error(
        "Get employee details error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch employee details"

      });

    }

  };


/*
|--------------------------------------------------------------------------
| Update Employee Status
|--------------------------------------------------------------------------
|
| PATCH /api/employees/:id/status
|
| Body:
|
| {
|   "isActive": false
| }
|
|--------------------------------------------------------------------------
*/

export const updateEmployeeStatus =
  async (req, res) => {

    try {

      const {
        id
      } = req.params;


      const {
        isActive
      } = req.body;


      /*
      |--------------------------------------------------------------------------
      | Validate Boolean
      |--------------------------------------------------------------------------
      */

      if (
        typeof isActive !==
        "boolean"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "isActive must be a boolean"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Find Employee
      |--------------------------------------------------------------------------
      */

      const employee =
        await User.findOne({
          _id: id,
          role: "employee"
        });


      if (!employee) {

        return res.status(404).json({

          success: false,

          message:
            "Employee not found"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Update Status
      |--------------------------------------------------------------------------
      */

      employee.isActive =
        isActive;


      await employee.save();


      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({

        success: true,

        message:
          isActive
            ? "Employee activated successfully"
            : "Employee deactivated successfully",

        employee: {

          id:
            employee._id,

          name:
            employee.name,

          email:
            employee.email,

          employeeId:
            employee.employeeId,

          isActive:
            employee.isActive

        }

      });

    } catch (error) {

      console.error(
        "Update employee status error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to update employee status"

      });

    }

  };