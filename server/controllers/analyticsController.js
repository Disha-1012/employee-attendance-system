import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const isValidDateFormat = (date) => {
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return false;
  }

  const parsed = new Date(
    `${date}T00:00:00`
  );

  return !Number.isNaN(
    parsed.getTime()
  );
};


const getDateDifference = (
  startDate,
  endDate
) => {

  const start =
    new Date(
      `${startDate}T00:00:00`
    );

  const end =
    new Date(
      `${endDate}T00:00:00`
    );

  return Math.floor(
    (
      end.getTime() -
      start.getTime()
    ) /
    (1000 * 60 * 60 * 24)
  );
};


const getDateList = (
  startDate,
  endDate
) => {

  const dates = [];

  const current =
    new Date(
      `${startDate}T00:00:00`
    );

  const end =
    new Date(
      `${endDate}T00:00:00`
    );


  while (
    current <= end
  ) {

    const year =
      current.getFullYear();

    const month =
      String(
        current.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        current.getDate()
      ).padStart(2, "0");


    dates.push(
      `${year}-${month}-${day}`
    );


    current.setDate(
      current.getDate() + 1
    );

  }


  return dates;

};


const isWeekday = (
  dateString
) => {

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  const day =
    date.getDay();

  return (
    day !== 0 &&
    day !== 6
  );

};


const calculatePercentage = (
  value,
  total
) => {

  if (!total) {
    return 0;
  }

  return Number(
    (
      (value / total) *
      100
    ).toFixed(2)
  );

};


/*
|--------------------------------------------------------------------------
| HR Dashboard Analytics
|--------------------------------------------------------------------------
*/

export const getHRDashboardAnalytics =
  async (
    req,
    res
  ) => {

    try {

      const today =
        new Date();

      const todayString =
        [
          today.getFullYear(),
          String(
            today.getMonth() + 1
          ).padStart(2, "0"),
          String(
            today.getDate()
          ).padStart(2, "0")
        ].join("-");


      /*
      |--------------------------------------------------------------------------
      | Default Date Range
      |--------------------------------------------------------------------------
      |
      | Current month.
      |
      */

      const defaultStart =
        [
          today.getFullYear(),
          String(
            today.getMonth() + 1
          ).padStart(2, "0"),
          "01"
        ].join("-");


      const startDate =
        req.query.startDate ||
        defaultStart;


      const endDate =
        req.query.endDate ||
        todayString;


      /*
      |--------------------------------------------------------------------------
      | Validate Dates
      |--------------------------------------------------------------------------
      */

      if (
        !isValidDateFormat(
          startDate
        ) ||
        !isValidDateFormat(
          endDate
        )
      ) {

        return res.status(400).json({

          message:
            "Invalid date format. Use YYYY-MM-DD."

        });

      }


      if (
        startDate > endDate
      ) {

        return res.status(400).json({

          message:
            "Start date cannot be after end date."

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Prevent Extremely Large Queries
      |--------------------------------------------------------------------------
      */

      const dateDifference =
        getDateDifference(
          startDate,
          endDate
        );


      if (
        dateDifference > 366
      ) {

        return res.status(400).json({

          message:
            "Analytics date range cannot exceed 1 year."

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Fetch Active Employees
      |--------------------------------------------------------------------------
      */

      const employees =
        await User.find({

          role: "employee",

          isActive: true

        })
          .select(
            "_id name employeeId email department designation"
          )
          .sort({
            name: 1
          })
          .lean();


      /*
      |--------------------------------------------------------------------------
      | Fetch Attendance
      |--------------------------------------------------------------------------
      */

      const attendance =
        await Attendance.find({

          attendanceDate: {
            $gte: startDate,
            $lte: endDate
          }

        })
          .select(
            "employee employeeId attendanceDate workingMinutes status"
          )
          .lean();


      /*
      |--------------------------------------------------------------------------
      | Fetch Approved Leave
      |--------------------------------------------------------------------------
      |
      | Leave is virtual in attendance.
      | Therefore we calculate leave days here rather than
      | looking for fake Attendance documents.
      |
      */

      const approvedLeaves =
        await Leave.find({

          status: "approved",

          startDate: {
            $lte: endDate
          },

          endDate: {
            $gte: startDate
          }

        })
          .select(
            "employee employeeId leaveType startDate endDate totalDays"
          )
          .lean();


      /*
      |--------------------------------------------------------------------------
      | Create Employee Map
      |--------------------------------------------------------------------------
      */

      const employeeMap =
        new Map();

      employees.forEach(
        (employee) => {

          employeeMap.set(
            String(employee._id),
            employee
          );

        }
      );


      /*
      |--------------------------------------------------------------------------
      | Create Attendance Map
      |--------------------------------------------------------------------------
      */

      const attendanceMap =
        new Map();


      attendance.forEach(
        (record) => {

          const key =
            `${String(record.employee)}_${record.attendanceDate}`;

          attendanceMap.set(
            key,
            record
          );

        }
      );


      /*
      |--------------------------------------------------------------------------
      | Create Approved Leave Day Map
      |--------------------------------------------------------------------------
      */

      const leaveMap =
        new Map();


      approvedLeaves.forEach(
        (leave) => {

          const leaveDates =
            getDateList(
              leave.startDate,
              leave.endDate
            );


          leaveDates.forEach(
            (date) => {

              /*
              | Actual attendance takes precedence over leave.
              | We only need to store the leave here.
              */

              const key =
                `${String(leave.employee)}_${date}`;

              leaveMap.set(
                key,
                {
                  leaveType:
                    leave.leaveType,

                  leaveId:
                    leave._id
                }
              );

            }
          );

        }
      );


      /*
      |--------------------------------------------------------------------------
      | Date Range
      |--------------------------------------------------------------------------
      */

      const allDates =
        getDateList(
          startDate,
          endDate
        );


      const workingDates =
        allDates.filter(
          isWeekday
        );


      /*
      |--------------------------------------------------------------------------
      | Overall Metrics
      |--------------------------------------------------------------------------
      */

      let totalPresent = 0;

      let totalLate = 0;

      let totalHalfDay = 0;

      let totalLeave = 0;

      let totalAbsent = 0;

      let totalWorkingMinutes = 0;

      let totalExpectedDays = 0;


      /*
      |--------------------------------------------------------------------------
      | Department Analytics
      |--------------------------------------------------------------------------
      */

      const departmentMap =
        new Map();


      /*
      |--------------------------------------------------------------------------
      | Employee-wise Calculation
      |--------------------------------------------------------------------------
      */

      employees.forEach(
        (employee) => {

          let present = 0;

          let late = 0;

          let halfDay = 0;

          let leave = 0;

          let absent = 0;

          let workingMinutes = 0;

          let expectedDays = 0;


          workingDates.forEach(
            (date) => {

              const employeeKey =
                `${String(employee._id)}_${date}`;


              const attendanceRecord =
                attendanceMap.get(
                  employeeKey
                );


              const leaveRecord =
                leaveMap.get(
                  employeeKey
                );


              /*
              |--------------------------------------------------------------------------
              | Actual Attendance Has Priority
              |--------------------------------------------------------------------------
              */

              if (
                attendanceRecord
              ) {

                switch (
                  attendanceRecord.status
                ) {

                  case "present":

                    present++;

                    break;


                  case "late":

                    late++;

                    break;


                  case "half-day":

                    halfDay++;

                    break;


                  default:

                    break;

                }


                workingMinutes +=
                  Number(
                    attendanceRecord.workingMinutes ||
                    0
                  );


                expectedDays++;

                return;

              }


              /*
              |--------------------------------------------------------------------------
              | Approved Leave
              |--------------------------------------------------------------------------
              */

              if (
                leaveRecord
              ) {

                leave++;

                return;

              }


              /*
              |--------------------------------------------------------------------------
              | No Attendance / No Leave = Absent
              |--------------------------------------------------------------------------
              */

              absent++;

              expectedDays++;

            }
          );


          const attendedDays =
            present +
            late +
            halfDay;


          const attendanceRate =
            calculatePercentage(
              attendedDays,
              expectedDays
            );


          totalPresent +=
            present;

          totalLate +=
            late;

          totalHalfDay +=
            halfDay;

          totalLeave +=
            leave;

          totalAbsent +=
            absent;

          totalWorkingMinutes +=
            workingMinutes;

          totalExpectedDays +=
            expectedDays;


          /*
          |--------------------------------------------------------------------------
          | Department
          |--------------------------------------------------------------------------
          */

          const department =
            employee.department ||
            "Unassigned";


          if (
            !departmentMap.has(
              department
            )
          ) {

            departmentMap.set(
              department,
              {
                department,
                employees: 0,
                present: 0,
                late: 0,
                halfDay: 0,
                leave: 0,
                absent: 0,
                workingMinutes: 0,
                expectedDays: 0
              }
            );

          }


          const departmentData =
            departmentMap.get(
              department
            );


          departmentData.employees++;

          departmentData.present +=
            present;

          departmentData.late +=
            late;

          departmentData.halfDay +=
            halfDay;

          departmentData.leave +=
            leave;

          departmentData.absent +=
            absent;

          departmentData.workingMinutes +=
            workingMinutes;

          departmentData.expectedDays +=
            expectedDays;

        }
      );


      /*
      |--------------------------------------------------------------------------
      | Overall Attendance Rate
      |--------------------------------------------------------------------------
      */

      const totalAttended =
        totalPresent +
        totalLate +
        totalHalfDay;


      const attendanceRate =
        calculatePercentage(
          totalAttended,
          totalExpectedDays
        );


      /*
      |--------------------------------------------------------------------------
      | Average Working Minutes
      |--------------------------------------------------------------------------
      */

      const averageWorkingMinutes =
        totalAttended > 0
          ? Math.round(
              totalWorkingMinutes /
              totalAttended
            )
          : 0;


      /*
      |--------------------------------------------------------------------------
      | Department Result
      |--------------------------------------------------------------------------
      */

      const departments =
        Array.from(
          departmentMap.values()
        )
          .map(
            (department) => {

              const attended =
                department.present +
                department.late +
                department.halfDay;


              return {

                department:
                  department.department,

                employees:
                  department.employees,

                present:
                  department.present,

                late:
                  department.late,

                halfDay:
                  department.halfDay,

                leave:
                  department.leave,

                absent:
                  department.absent,

                workingMinutes:
                  department.workingMinutes,

                attendanceRate:
                  calculatePercentage(
                    attended,
                    department.expectedDays
                  )

              };

            }
          )
          .sort(
            (a, b) =>
              b.attendanceRate -
              a.attendanceRate
          );

          /*
        |--------------------------------------------------------------------------
        | Daily Attendance Trend
        |--------------------------------------------------------------------------
        */

        const trend = allDates.map(
        (date) => {

            let present = 0;
            let late = 0;
            let halfDay = 0;
            let leave = 0;
            let absent = 0;

            employees.forEach(
            (employee) => {

                const employeeKey =
                `${String(employee._id)}_${date}`;

                const attendanceRecord =
                attendanceMap.get(
                    employeeKey
                );

                const leaveRecord =
                leaveMap.get(
                    employeeKey
                );


                /*
                |--------------------------------------------------------------------------
                | Actual Attendance Has Priority
                |--------------------------------------------------------------------------
                */

                if (attendanceRecord) {

                switch (
                    attendanceRecord.status
                ) {

                    case "present":
                    present++;
                    break;

                    case "late":
                    late++;
                    break;

                    case "half-day":
                    halfDay++;
                    break;

                    default:
                    break;

                }

                return;
                }


                /*
                |--------------------------------------------------------------------------
                | Approved Leave
                |--------------------------------------------------------------------------
                */

                if (leaveRecord) {

                leave++;

                return;

                }


                /*
                |--------------------------------------------------------------------------
                | No Attendance / Leave
                |--------------------------------------------------------------------------
                */

                if (
                isWeekday(date)
                ) {

                absent++;

                }

            }
            );


            return {

            date,

            present,

            late,

            halfDay,

            leave,

            absent

            };

        }
        );


      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({

        success: true,

        filters: {

          startDate,

          endDate

        },

        overview: {

          totalEmployees:
            employees.length,

          workingDays:
            workingDates.length,

          present:
            totalPresent,

          late:
            totalLate,

          halfDay:
            totalHalfDay,

          leave:
            totalLeave,

          absent:
            totalAbsent,

          attendanceRate,

          totalWorkingMinutes,

          averageWorkingMinutes

        },

        departments,
        
        trend

      });

    } catch (error) {

      console.error(
        "HR dashboard analytics error:",
        error
      );


      return res.status(500).json({

        message:
          "Failed to load HR dashboard analytics."

      });

    }

  };