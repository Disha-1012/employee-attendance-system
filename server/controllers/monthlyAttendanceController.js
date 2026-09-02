import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";


const isValidMonth = (month) => {

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return false;
  }

  const [
    year,
    monthNumber
  ] = month.split("-").map(Number);

  return (
    year >= 2000 &&
    monthNumber >= 1 &&
    monthNumber <= 12
  );

};


const getMonthDateRange = (month) => {

  const [
    year,
    monthNumber
  ] = month.split("-").map(Number);

  const startDate =
    `${year}-${String(monthNumber).padStart(2, "0")}-01`;

  const lastDay =
    new Date(
      year,
      monthNumber,
      0
    ).getDate();

  const endDate =
    `${year}-${String(monthNumber).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return {
    startDate,
    endDate
  };

};


const addDays = (
  dateString,
  days
) => {

  const date =
    new Date(
      `${dateString}T00:00:00Z`
    );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date
    .toISOString()
    .slice(0, 10);

};


const getDatesBetween = (
  startDate,
  endDate
) => {

  const dates = [];

  let currentDate =
    startDate;

  while (
    currentDate <=
    endDate
  ) {

    dates.push(
      currentDate
    );

    currentDate =
      addDays(
        currentDate,
        1
      );

  }

  return dates;

};


export const getMonthlyAttendanceReport =
  async (
    req,
    res
  ) => {

    try {

      const {
        month,
        search = "",
        department = "",
        page = 1,
        limit = 10
      } = req.query;


      /*
      |--------------------------------------------------------------------------
      | Validate Month
      |--------------------------------------------------------------------------
      */

      if (!month) {

        return res.status(400).json({
          message:
            "month is required in YYYY-MM format."
        });

      }


      if (!isValidMonth(month)) {

        return res.status(400).json({
          message:
            "Month must be in YYYY-MM format."
        });

      }


      /*
      |--------------------------------------------------------------------------
      | Get Month Range
      |--------------------------------------------------------------------------
      */

      const {
        startDate,
        endDate
      } =
        getMonthDateRange(
          month
        );


      /*
      |--------------------------------------------------------------------------
      | Employee Filter
      |--------------------------------------------------------------------------
      */

      const employeeFilter = {
        role: "employee"
      };


      if (
        department.trim()
      ) {

        employeeFilter.department =
          department.trim();

      }


      if (
        search.trim()
      ) {

        const searchRegex =
          new RegExp(
            search.trim(),
            "i"
          );

        employeeFilter.$or = [
          {
            name: searchRegex
          },
          {
            email: searchRegex
          },
          {
            employeeId: searchRegex
          }
        ];

      }


      /*
      |--------------------------------------------------------------------------
      | Get Employees
      |--------------------------------------------------------------------------
      */

      const employees =
        await User.find(
          employeeFilter
        )
          .select(
            "_id name email employeeId department designation"
          )
          .sort({
            name: 1
          })
          .lean();


      if (
        employees.length === 0
      ) {

        return res.status(200).json({

          success: true,

          report: [],

          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPages: 0
          },

          month

        });

      }


      const employeeIds =
        employees.map(
          (employee) =>
            employee._id
        );


      /*
      |--------------------------------------------------------------------------
      | Attendance Records
      |--------------------------------------------------------------------------
      */

      const attendanceRecords =
        await Attendance.find({

          employee: {
            $in: employeeIds
          },

          attendanceDate: {
            $gte: startDate,
            $lte: endDate
          }

        })
          .select(
            "employee employeeId attendanceDate workingMinutes status checkIn checkOut"
          )
          .sort({
            attendanceDate: 1
          })
          .lean();


      /*
      |--------------------------------------------------------------------------
      | Approved Leaves
      |--------------------------------------------------------------------------
      */

      const approvedLeaves =
        await Leave.find({

          employee: {
            $in: employeeIds
          },

          status: "approved",

          startDate: {
            $lte: endDate
          },

          endDate: {
            $gte: startDate
          }

        })
          .select(
            "employee employeeId leaveType startDate endDate"
          )
          .lean();


      /*
      |--------------------------------------------------------------------------
      | Attendance Map
      |--------------------------------------------------------------------------
      */

      const attendanceMap =
        new Map();


      for (
        const record
        of attendanceRecords
      ) {

        const employeeKey =
          record.employee.toString();


        if (
          !attendanceMap.has(
            employeeKey
          )
        ) {

          attendanceMap.set(
            employeeKey,
            new Map()
          );

        }


        attendanceMap
          .get(employeeKey)
          .set(
            record.attendanceDate,
            record
          );

      }


      /*
      |--------------------------------------------------------------------------
      | Leave Map
      |--------------------------------------------------------------------------
      */

      const leaveMap =
        new Map();


      for (
        const leave
        of approvedLeaves
      ) {

        const employeeKey =
          leave.employee.toString();


        if (
          !leaveMap.has(
            employeeKey
          )
        ) {

          leaveMap.set(
            employeeKey,
            new Map()
          );

        }


        const leaveStart =
          leave.startDate >
          startDate
            ? leave.startDate
            : startDate;


        const leaveEnd =
          leave.endDate <
          endDate
            ? leave.endDate
            : endDate;


        const leaveDates =
          getDatesBetween(
            leaveStart,
            leaveEnd
          );


        for (
          const date
          of leaveDates
        ) {

          /*
           * Actual attendance always
           * takes precedence.
           */

          const employeeAttendance =
            attendanceMap.get(
              employeeKey
            );


          if (
            employeeAttendance?.has(
              date
            )
          ) {
            continue;
          }


          leaveMap
            .get(employeeKey)
            .set(
              date,
              {
                status: "leave",
                leaveType:
                  leave.leaveType
              }
            );

        }

      }


      /*
      |--------------------------------------------------------------------------
      | Generate Monthly Reports
      |--------------------------------------------------------------------------
      */

      const report =
        employees.map(
          (employee) => {

            const employeeKey =
              employee._id.toString();


            const employeeAttendance =
              attendanceMap.get(
                employeeKey
              ) || new Map();


            const employeeLeaves =
              leaveMap.get(
                employeeKey
              ) || new Map();


            /*
             * Daily report.
             */

            const dailyRecords = [];


            for (
              const date
              of getDatesBetween(
                startDate,
                endDate
              )
            ) {

              if (
                employeeAttendance.has(
                  date
                )
              ) {

                const record =
                  employeeAttendance.get(
                    date
                  );

                dailyRecords.push({

                  date,

                  status:
                    record.status,

                  checkIn:
                    record.checkIn ||
                    null,

                  checkOut:
                    record.checkOut ||
                    null,

                  workingMinutes:
                    record.workingMinutes ||
                    0,

                  leaveType:
                    null

                });

              } else if (
                employeeLeaves.has(
                  date
                )
              ) {

                const leaveRecord =
                  employeeLeaves.get(
                    date
                  );

                dailyRecords.push({

                  date,

                  status: "leave",

                  checkIn: null,

                  checkOut: null,

                  workingMinutes: 0,

                  leaveType:
                    leaveRecord.leaveType

                });

              }

            }


            /*
             * Statistics.
             */

            let present = 0;

            let late = 0;

            let halfDay = 0;

            let leave = 0;

            let totalWorkingMinutes = 0;


            for (
              const record
              of dailyRecords
            ) {

              if (
                record.status ===
                "present"
              ) {
                present++;
              }


              if (
                record.status ===
                "late"
              ) {
                late++;
              }


              if (
                record.status ===
                "half-day"
              ) {
                halfDay++;
              }


              if (
                record.status ===
                "leave"
              ) {
                leave++;
              }


              if (
                record.status !==
                "leave"
              ) {

                totalWorkingMinutes +=
                  Number(
                    record.workingMinutes
                  ) || 0;

              }

            }


            const workedDays =
              present +
              late +
              halfDay;


            const eligibleDays =
              workedDays +
              leave;


            const attendanceRate =
              eligibleDays > 0
                ? Number(
                    (
                      (
                        workedDays /
                        eligibleDays
                      ) *
                      100
                    ).toFixed(1)
                  )
                : 0;


            return {

              id:
                employee._id,

              employeeId:
                employee.employeeId,

              name:
                employee.name,

              email:
                employee.email,

              department:
                employee.department ||
                "",

              designation:
                employee.designation ||
                "",

              month,

              totalDays:
                dailyRecords.length,

              present,

              late,

              halfDay,

              leave,

              workedDays,

              totalWorkingMinutes,

              attendanceRate,

              dailyRecords

            };

          }
        );


      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const currentPage =
        Math.max(
          Number(page) || 1,
          1
        );


      const pageLimit =
        Math.max(
          Number(limit) || 10,
          1
        );


      const total =
        report.length;


      const totalPages =
        Math.ceil(
          total /
          pageLimit
        );


      const startIndex =
        (
          currentPage - 1
        ) *
        pageLimit;


      const paginatedReport =
        report.slice(
          startIndex,
          startIndex +
            pageLimit
        );


      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({

        success: true,

        month,

        dateRange: {
          startDate,
          endDate
        },

        report:
          paginatedReport,

        pagination: {

          page:
            currentPage,

          limit:
            pageLimit,

          total,

          totalPages

        }

      });

    } catch (error) {

      console.error(
        "Monthly attendance report error:",
        error
      );


      return res.status(500).json({

        message:
          "Failed to generate monthly attendance report."

      });

    }

  };