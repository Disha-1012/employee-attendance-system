import Attendance from "../models/Attendance.js";

import Leave from "../models/Leave.js";

import {
  getAttendanceDate
} from "../utils/dateUtils.js";


/*
|--------------------------------------------------------------------------
| Attendance Configuration
|--------------------------------------------------------------------------
*/

const SHIFT_START_HOUR = 9;

const SHIFT_START_MINUTE = 30;

const GRACE_PERIOD_MINUTES = 15;

const HALF_DAY_MINUTES = 240;


/*
|--------------------------------------------------------------------------
| Calculate Working Minutes
|--------------------------------------------------------------------------
*/

const calculateWorkingMinutes = (
  checkIn,
  checkOut
) => {

  const difference =
    checkOut.getTime() -
    checkIn.getTime();


  const minutes =
    Math.floor(
      difference /
      (1000 * 60)
    );


  return Math.max(
    minutes,
    0
  );

};


/*
|--------------------------------------------------------------------------
| Determine Attendance Status
|--------------------------------------------------------------------------
*/

const determineStatus = (
  checkIn,
  workingMinutes
) => {

  /*
  |--------------------------------------------------------------------------
  | Half Day
  |--------------------------------------------------------------------------
  */

  if (
    workingMinutes <
    HALF_DAY_MINUTES
  ) {

    return "half-day";

  }


  /*
  |--------------------------------------------------------------------------
  | Late Threshold
  |--------------------------------------------------------------------------
  */

  const lateThreshold =
    new Date(
      checkIn
    );


  lateThreshold.setHours(
    SHIFT_START_HOUR,
    SHIFT_START_MINUTE +
      GRACE_PERIOD_MINUTES,
    0,
    0
  );


  /*
  |--------------------------------------------------------------------------
  | Late
  |--------------------------------------------------------------------------
  */

  if (
    checkIn >
    lateThreshold
  ) {

    return "late";

  }


  /*
  |--------------------------------------------------------------------------
  | Present
  |--------------------------------------------------------------------------
  */

  return "present";

};


/*
|--------------------------------------------------------------------------
| Format Attendance
|--------------------------------------------------------------------------
*/

const formatAttendance = (
  attendance
) => ({

  id:
    attendance._id,

  employeeId:
    attendance.employeeId,

  attendanceDate:
    attendance.attendanceDate,

  checkIn:
    attendance.checkIn,

  checkOut:
    attendance.checkOut,

  workingMinutes:
    attendance.workingMinutes,

  status:
    attendance.status,

  remarks:
    attendance.remarks,

  createdAt:
    attendance.createdAt,

  updatedAt:
    attendance.updatedAt

});


/*
|--------------------------------------------------------------------------
| Format Virtual Leave Attendance
|--------------------------------------------------------------------------
|
| Approved leave does not create an Attendance document.
| Instead, we create a temporary attendance-like object
| when sending attendance information to the frontend.
|--------------------------------------------------------------------------
*/

const formatLeaveAsAttendance = (
  leave
) => ({

  id:
    `leave-${leave._id}`,

  employeeId:
    leave.employeeId,

  attendanceDate:
    leave.startDate,

  checkIn:
    null,

  checkOut:
    null,

  workingMinutes:
    0,

  status:
    "leave",

  remarks:
    leave.reason ||
    "Approved leave",

  createdAt:
    leave.createdAt,

  updatedAt:
    leave.updatedAt,

  leaveType:
    leave.leaveType,

  leaveId:
    leave._id,

  isLeave:
    true

});


/*
|--------------------------------------------------------------------------
| Check In
|--------------------------------------------------------------------------
*/

export const checkIn =
  async (
    req,
    res
  ) => {

    try {

      const user =
        req.user;


      const attendanceDate =
        getAttendanceDate();


      /*
      |--------------------------------------------------------------------------
      | Check Approved Leave
      |--------------------------------------------------------------------------
      */

      const approvedLeave =
        await Leave.findOne({

          employee:
            user._id,

          status:
            "approved",

          startDate:
            {
              $lte:
                attendanceDate
            },

          endDate:
            {
              $gte:
                attendanceDate
            }

        });


      /*
      |--------------------------------------------------------------------------
      | Employee Is On Approved Leave
      |--------------------------------------------------------------------------
      */

      if (
        approvedLeave
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "You are on approved leave today and cannot check in."

          });

      }


      /*
      |--------------------------------------------------------------------------
      | Check Existing Attendance
      |--------------------------------------------------------------------------
      */

      const existingAttendance =
        await Attendance.findOne({

          employee:
            user._id,

          attendanceDate

        });


      if (
        existingAttendance
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "You have already checked in today"

          });

      }


      /*
      |--------------------------------------------------------------------------
      | Create Attendance
      |--------------------------------------------------------------------------
      */

      const attendance =
        await Attendance.create({

          employee:
            user._id,

          employeeId:
            user.employeeId,

          attendanceDate,

          checkIn:
            new Date(),

          status:
            "present"

        });


      return res
        .status(201)
        .json({

          success:
            true,

          message:
            "Checked in successfully",

          attendance:
            formatAttendance(
              attendance
            )

        });

    } catch (
      error
    ) {

      console.error(
        "Check-in error:",
        error
      );


      /*
      |--------------------------------------------------------------------------
      | Duplicate Attendance
      |--------------------------------------------------------------------------
      */

      if (
        error.code ===
        11000
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "Attendance already exists for today"

          });

      }


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Unable to check in"

        });

    }

  };


/*
|--------------------------------------------------------------------------
| Check Out
|--------------------------------------------------------------------------
*/

export const checkOut =
  async (
    req,
    res
  ) => {

    try {

      const user =
        req.user;


      const attendanceDate =
        getAttendanceDate();


      /*
      |--------------------------------------------------------------------------
      | Check Approved Leave
      |--------------------------------------------------------------------------
      */

      const approvedLeave =
        await Leave.findOne({

          employee:
            user._id,

          status:
            "approved",

          startDate:
            {
              $lte:
                attendanceDate
            },

          endDate:
            {
              $gte:
                attendanceDate
            }

        });


      if (
        approvedLeave
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "You are on approved leave today."

          });

      }


      /*
      |--------------------------------------------------------------------------
      | Find Attendance
      |--------------------------------------------------------------------------
      */

      const attendance =
        await Attendance.findOne({

          employee:
            user._id,

          attendanceDate

        });


      if (
        !attendance
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "You must check in before checking out"

          });

      }


      /*
      |--------------------------------------------------------------------------
      | Already Checked Out
      |--------------------------------------------------------------------------
      */

      if (
        attendance.checkOut
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "You have already checked out today"

          });

      }


      /*
      |--------------------------------------------------------------------------
      | Calculate Working Time
      |--------------------------------------------------------------------------
      */

      const checkOutTime =
        new Date();


      const workingMinutes =
        calculateWorkingMinutes(
          attendance.checkIn,
          checkOutTime
        );


      const status =
        determineStatus(
          attendance.checkIn,
          workingMinutes
        );


      /*
      |--------------------------------------------------------------------------
      | Update Attendance
      |--------------------------------------------------------------------------
      */

      attendance.checkOut =
        checkOutTime;

      attendance.workingMinutes =
        workingMinutes;

      attendance.status =
        status;


      await attendance.save();


      return res
        .status(200)
        .json({

          success:
            true,

          message:
            "Checked out successfully",

          attendance:
            formatAttendance(
              attendance
            )

        });

    } catch (
      error
    ) {

      console.error(
        "Check-out error:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Unable to check out"

        });

    }

  };


/*
|--------------------------------------------------------------------------
| Get Today's Attendance
|--------------------------------------------------------------------------
*/

export const getTodayAttendance =
  async (
    req,
    res
  ) => {

    try {

      const user =
        req.user;


      const attendanceDate =
        getAttendanceDate();


      /*
      |--------------------------------------------------------------------------
      | First Check Actual Attendance
      |--------------------------------------------------------------------------
      */

      const attendance =
        await Attendance.findOne({

          employee:
            user._id,

          attendanceDate

        });


      /*
      |--------------------------------------------------------------------------
      | Actual Attendance Has Priority
      |--------------------------------------------------------------------------
      */

      if (
        attendance
      ) {

        return res
          .status(200)
          .json({

            success:
              true,

            attendance:
              formatAttendance(
                attendance
              )

          });

      }


      /*
      |--------------------------------------------------------------------------
      | Check Approved Leave
      |--------------------------------------------------------------------------
      */

      const approvedLeave =
        await Leave.findOne({

          employee:
            user._id,

          status:
            "approved",

          startDate:
            {
              $lte:
                attendanceDate
            },

          endDate:
            {
              $gte:
                attendanceDate
            }

        });


      /*
      |--------------------------------------------------------------------------
      | Return Leave As Attendance
      |--------------------------------------------------------------------------
      */

      if (
        approvedLeave
      ) {

        return res
          .status(200)
          .json({

            success:
              true,

            attendance:
              formatLeaveAsAttendance(
                approvedLeave
              )

          });

      }


      /*
      |--------------------------------------------------------------------------
      | No Attendance / Leave
      |--------------------------------------------------------------------------
      */

      return res
        .status(200)
        .json({

          success:
            true,

          attendance:
            null

        });

    } catch (
      error
    ) {

      console.error(
        "Get today's attendance error:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Unable to fetch today's attendance"

        });

    }

  };


/*
|--------------------------------------------------------------------------
| Get My Attendance History
|--------------------------------------------------------------------------
*/

export const getMyAttendance =
  async (
    req,
    res
  ) => {

    try {

      const user =
        req.user;


      const {
        page = 1,
        limit = 10
      } = req.query;


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


      /*
      |--------------------------------------------------------------------------
      | Get Actual Attendance
      |--------------------------------------------------------------------------
      */

      const attendance =
        await Attendance.find({

          employee:
            user._id

        });


      /*
      |--------------------------------------------------------------------------
      | Get Approved Leaves
      |--------------------------------------------------------------------------
      */

      const approvedLeaves =
        await Leave.find({

          employee:
            user._id,

          status:
            "approved"

        });


      /*
      |--------------------------------------------------------------------------
      | Convert Attendance To Response Format
      |--------------------------------------------------------------------------
      */

      const attendanceRecords =
        attendance.map(
          formatAttendance
        );


      /*
      |--------------------------------------------------------------------------
      | Convert Leave To Attendance-Like Records
      |--------------------------------------------------------------------------
      */

      const leaveRecords = [];


      approvedLeaves.forEach(
        (
          leave
        ) => {

          const start =
            new Date(
              `${leave.startDate}T00:00:00`
            );


          const end =
            new Date(
              `${leave.endDate}T00:00:00`
            );


          for (
            let current =
              new Date(start);

            current <= end;

            current.setDate(
              current.getDate() + 1
            )
          ) {

            const date =
              current
                .toISOString()
                .split("T")[0];


            /*
            |--------------------------------------------------------------------------
            | Don't Show Leave Over Existing Attendance
            |--------------------------------------------------------------------------
            */

            const hasAttendance =
              attendanceRecords.some(
                (
                  record
                ) =>
                  record.attendanceDate ===
                  date
              );


            if (
              !hasAttendance
            ) {

              leaveRecords.push({

                ...formatLeaveAsAttendance(
                  leave
                ),

                attendanceDate:
                  date

              });

            }

          }

        }
      );


      /*
      |--------------------------------------------------------------------------
      | Combine Attendance + Leave
      |--------------------------------------------------------------------------
      */

      const combinedRecords =
        [
          ...attendanceRecords,
          ...leaveRecords
        ];


      /*
      |--------------------------------------------------------------------------
      | Sort Newest First
      |--------------------------------------------------------------------------
      */

      combinedRecords.sort(
        (
          first,
          second
        ) =>
          second.attendanceDate.localeCompare(
            first.attendanceDate
          )
      );


      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const total =
        combinedRecords.length;


      const skip =
        (
          pageNumber - 1
        ) *
        limitNumber;


      const paginatedRecords =
        combinedRecords.slice(
          skip,
          skip + limitNumber
        );


      return res
        .status(200)
        .json({

          success:
            true,

          attendance:
            paginatedRecords,

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

    } catch (
      error
    ) {

      console.error(
        "Get attendance history error:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Unable to fetch attendance history"

        });

    }

  };


/*
|--------------------------------------------------------------------------
| Get Attendance For HR
|--------------------------------------------------------------------------
*/

export const getAttendanceForDate =
  async (
    req,
    res
  ) => {

    try {

      const {
        date
      } = req.query;


      const attendanceDate =
        date ||
        getAttendanceDate();


      /*
      |--------------------------------------------------------------------------
      | Validate Date
      |--------------------------------------------------------------------------
      */

      const dateRegex =
        /^\d{4}-\d{2}-\d{2}$/;


      if (
        !dateRegex.test(
          attendanceDate
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Invalid date format. Use YYYY-MM-DD"

          });

      }


      /*
      |--------------------------------------------------------------------------
      | Get Actual Attendance
      |--------------------------------------------------------------------------
      */

      const attendance =
        await Attendance.find({

          attendanceDate

        })
        .populate(
          "employee",
          "name email employeeId department designation"
        )
        .sort({

          createdAt:
            1

        });


      /*
      |--------------------------------------------------------------------------
      | Format Actual Attendance
      |--------------------------------------------------------------------------
      */

      const formattedAttendance =
        attendance.map(
          (
            record
          ) => ({

            ...formatAttendance(
              record
            ),

            employee:
              record.employee
                ? {

                    id:
                      record.employee._id,

                    name:
                      record.employee.name,

                    email:
                      record.employee.email,

                    employeeId:
                      record.employee.employeeId,

                    department:
                      record.employee.department,

                    designation:
                      record.employee.designation

                  }
                : null

          })
        );


      /*
      |--------------------------------------------------------------------------
      | Get Approved Leave For Date
      |--------------------------------------------------------------------------
      */

      const approvedLeaves =
        await Leave.find({

          status:
            "approved",

          startDate:
            {
              $lte:
                attendanceDate
            },

          endDate:
            {
              $gte:
                attendanceDate
            }

        })
        .populate(
          "employee",
          "name email employeeId department designation"
        );


      /*
      |--------------------------------------------------------------------------
      | Existing Attendance Employee IDs
      |--------------------------------------------------------------------------
      */

      const attendanceEmployeeIds =
        new Set(

          formattedAttendance
            .map(
              (
                record
              ) =>
                String(
                  record.employee?.id ||
                  ""
                )
            )

        );


      /*
      |--------------------------------------------------------------------------
      | Add Leave Records
      |--------------------------------------------------------------------------
      */

      const leaveAttendance =
        approvedLeaves
          .filter(
            (
              leave
            ) =>
              !attendanceEmployeeIds.has(
                String(
                  leave.employee?._id ||
                  leave.employee?.id ||
                  ""
                )
              )
          )
          .map(
            (
              leave
            ) => ({

              ...formatLeaveAsAttendance(
                leave
              ),

              attendanceDate,

              employee:
                leave.employee
                  ? {

                      id:
                        leave.employee._id,

                      name:
                        leave.employee.name,

                      email:
                        leave.employee.email,

                      employeeId:
                        leave.employee.employeeId,

                      department:
                        leave.employee.department,

                      designation:
                        leave.employee.designation

                    }
                  : null

            })
          );


      /*
      |--------------------------------------------------------------------------
      | Combine Actual Attendance + Leave
      |--------------------------------------------------------------------------
      */

      const formatted =
        [
          ...formattedAttendance,
          ...leaveAttendance
        ];


      /*
      |--------------------------------------------------------------------------
      | Sort
      |--------------------------------------------------------------------------
      */

      formatted.sort(
        (
          first,
          second
        ) => {

          if (
            first.status ===
            "leave"
          ) {

            return 1;

          }


          return -1;

        }
      );


      return res
        .status(200)
        .json({

          success:
            true,

          date:
            attendanceDate,

          count:
            formatted.length,

          attendance:
            formatted

        });

    } catch (
      error
    ) {

      console.error(
        "HR attendance error:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Unable to fetch attendance records"

        });

    }

  };