import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import User from "../models/User.js";

/*
  Convert YYYY-MM-DD to a Date at local midnight.
*/
const parseDate = (dateString) => {
  if (!dateString) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
};


/*
  Format Date object as YYYY-MM-DD.
*/
const formatDate = (date) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


/*
  Escape values for CSV.

  Example:
  John, Doe

  becomes:

  "John, Doe"
*/
const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};


/*
  Convert working minutes into readable hours/minutes.
*/
const formatWorkingMinutes = (minutes) => {
  const totalMinutes = Number(minutes) || 0;

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return `${hours}h ${remainingMinutes}m`;
};


/*
  Get every date between startDate and endDate.
*/
const getDateRange = (startDate, endDate) => {
  const dates = [];

  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));

    current.setDate(current.getDate() + 1);
  }

  return dates;
};


/*
  GET /api/reports/attendance/export
*/
export const exportAttendanceReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status = "all"
    } = req.query;

    /*
      -------------------------
      1. Validate dates
      -------------------------
    */

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Start date and end date are required."
      });
    }

    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);

    if (!parsedStartDate || !parsedEndDate) {
      return res.status(400).json({
        message: "Dates must be in YYYY-MM-DD format."
      });
    }

    if (parsedStartDate > parsedEndDate) {
      return res.status(400).json({
        message: "Start date cannot be after end date."
      });
    }

    /*
      Prevent accidentally generating extremely
      large reports.
    */

    const differenceInMilliseconds =
      parsedEndDate.getTime() - parsedStartDate.getTime();

    const differenceInDays =
      Math.floor(
        differenceInMilliseconds / (1000 * 60 * 60 * 24)
      ) + 1;

    if (differenceInDays > 366) {
      return res.status(400).json({
        message: "Attendance report range cannot exceed 366 days."
      });
    }


    /*
      -------------------------
      2. Validate status
      -------------------------
    */

    const allowedStatuses = [
      "all",
      "present",
      "late",
      "half-day",
      "leave",
      "absent"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid attendance status."
      });
    }


    /*
      -------------------------
      3. Get employees
      -------------------------
    */

    const employees = await User.find({
      role: "employee",
      isActive: true
    })
      .select("_id employeeId name email department")
      .sort({ employeeId: 1 })
      .lean();


    /*
      -------------------------
      4. Get actual attendance
      -------------------------
    */

    const attendanceRecords = await Attendance.find({
      attendanceDate: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate(
        "employee",
        "employeeId name email department"
      )
      .sort({
        attendanceDate: 1
      })
      .lean();


    /*
      -------------------------
      5. Get approved leaves
      -------------------------
    */

    const approvedLeaves = await Leave.find({
      status: "approved",

      startDate: {
        $lte: endDate
      },

      endDate: {
        $gte: startDate
      }
    })
      .populate(
        "employee",
        "employeeId name email department"
      )
      .lean();


    /*
      -------------------------
      6. Create lookup maps
      -------------------------
    */

    const attendanceMap = new Map();

    attendanceRecords.forEach((record) => {
      const employeeId =
        record.employee?._id?.toString();

      if (!employeeId) {
        return;
      }

      const key =
        `${employeeId}_${record.attendanceDate}`;

      attendanceMap.set(key, record);
    });


    const leaveMap = new Map();

    approvedLeaves.forEach((leave) => {
      const employeeId =
        leave.employee?._id?.toString();

      if (!employeeId) {
        return;
      }

      const leaveStart = parseDate(leave.startDate);
      const leaveEnd = parseDate(leave.endDate);

      if (!leaveStart || !leaveEnd) {
        return;
      }

      const leaveDates =
        getDateRange(leaveStart, leaveEnd);

      leaveDates.forEach((date) => {
        const formattedDate = formatDate(date);

        if (
          formattedDate < startDate ||
          formattedDate > endDate
        ) {
          return;
        }

        const key =
          `${employeeId}_${formattedDate}`;

        /*
          Actual attendance will have priority later.
        */

        if (!leaveMap.has(key)) {
          leaveMap.set(key, leave);
        }
      });
    });


    /*
      -------------------------
      7. Generate report rows
      -------------------------
    */

    const reportRows = [];

    const dateRange =
      getDateRange(
        parsedStartDate,
        parsedEndDate
      );


    for (const employee of employees) {
      const employeeObjectId =
        employee._id.toString();

      for (const date of dateRange) {
        const attendanceDate =
          formatDate(date);

        /*
          Skip weekends.

          Attendance/absence is calculated only
          for working days.
        */

        const dayOfWeek =
          date.getDay();

        const isWeekend =
          dayOfWeek === 0 ||
          dayOfWeek === 6;

        if (isWeekend) {
          continue;
        }


        const key =
          `${employeeObjectId}_${attendanceDate}`;


        /*
          Actual attendance takes priority.
        */

        const attendance =
          attendanceMap.get(key);


        let row;


        if (attendance) {
          row = {
            employeeId:
              attendance.employee?.employeeId ||
              employee.employeeId,

            employeeName:
              attendance.employee?.name ||
              employee.name,

            department:
              attendance.employee?.department ||
              employee.department ||
              "—",

            date: attendanceDate,

            checkIn:
              attendance.checkIn
                ? new Date(attendance.checkIn)
                    .toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                : "—",

            checkOut:
              attendance.checkOut
                ? new Date(attendance.checkOut)
                    .toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                : "—",

            workingHours:
              formatWorkingMinutes(
                attendance.workingMinutes
              ),

            status:
              attendance.status,

            remarks:
              attendance.remarks || ""
          };
        } else {
          /*
            No attendance record.
            Check whether employee is on
            approved leave.
          */

          const leave =
            leaveMap.get(key);


          if (leave) {
            row = {
              employeeId:
                leave.employee?.employeeId ||
                employee.employeeId,

              employeeName:
                leave.employee?.name ||
                employee.name,

              department:
                leave.employee?.department ||
                employee.department ||
                "—",

              date: attendanceDate,

              checkIn: "—",

              checkOut: "—",

              workingHours: "0h 0m",

              status: "leave",

              remarks:
                `Approved ${leave.leaveType} leave`
            };
          } else {
            /*
              No attendance + no approved leave
              = absent.
            */

            row = {
              employeeId:
                employee.employeeId,

              employeeName:
                employee.name,

              department:
                employee.department || "—",

              date: attendanceDate,

              checkIn: "—",

              checkOut: "—",

              workingHours: "0h 0m",

              status: "absent",

              remarks: ""
            };
          }
        }


        /*
          Apply status filter.
        */

        if (
          status !== "all" &&
          row.status !== status
        ) {
          continue;
        }


        reportRows.push(row);
      }
    }


    /*
      -------------------------
      8. Create CSV
      -------------------------
    */

    const headers = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Date",
      "Check In",
      "Check Out",
      "Working Hours",
      "Status",
      "Remarks"
    ];


    const csvRows = [
      headers.map(escapeCsvValue).join(",")
    ];


    reportRows.forEach((row) => {
      csvRows.push(
        [
          row.employeeId,
          row.employeeName,
          row.department,
          row.date,
          row.checkIn,
          row.checkOut,
          row.workingHours,
          row.status,
          row.remarks
        ]
          .map(escapeCsvValue)
          .join(",")
      );
    });


    /*
      Add UTF-8 BOM so Excel handles
      the CSV correctly.
    */

    const csvContent =
      "\uFEFF" + csvRows.join("\r\n");


    /*
      -------------------------
      9. Send CSV file
      -------------------------
    */

    const filename =
      `attendance-report-${startDate}-to-${endDate}.csv`;

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    return res.status(200).send(csvContent);

  } catch (error) {
    console.error(
      "Attendance report export error:",
      error
    );

    return res.status(500).json({
      message: "Failed to export attendance report."
    });
  }
};
