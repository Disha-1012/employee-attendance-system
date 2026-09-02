import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";

const isValidDateFormat = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00Z`);

  return !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date;
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
};

const getDatesBetween = (startDate, endDate) => {
  const dates = [];

  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return dates;
};

export const getEmployeeAttendanceSummary = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      search = "",
      department = "",
      page = 1,
      limit = 10
    } = req.query;

    /*
     * ----------------------------------------------------
     * 1. Validate date range
     * ----------------------------------------------------
     */

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "startDate and endDate are required."
      });
    }

    if (!isValidDateFormat(startDate) || !isValidDateFormat(endDate)) {
      return res.status(400).json({
        message: "Dates must be in YYYY-MM-DD format."
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        message: "startDate cannot be later than endDate."
      });
    }

    const rangeDates = getDatesBetween(startDate, endDate);

    /*
     * Prevent unnecessarily large report generation.
     */

    if (rangeDates.length > 366) {
      return res.status(400).json({
        message: "Date range cannot exceed 366 days."
      });
    }

    /*
     * ----------------------------------------------------
     * 2. Build employee filter
     * ----------------------------------------------------
     */

    const employeeFilter = {
      role: "employee"
    };

    if (department.trim()) {
      employeeFilter.department = department.trim();
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      employeeFilter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex }
      ];
    }

    /*
     * ----------------------------------------------------
     * 3. Get employees
     * ----------------------------------------------------
     */

    const employees = await User.find(employeeFilter)
      .select("_id name email employeeId department designation")
      .sort({ name: 1 })
      .lean();

    /*
     * If no employees match the search/filter.
     */

    if (employees.length === 0) {
      return res.status(200).json({
        success: true,
        summary: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          totalPages: 0
        }
      });
    }

    const employeeIds = employees.map((employee) => employee._id);

    /*
     * ----------------------------------------------------
     * 4. Get attendance records
     * ----------------------------------------------------
     */

    const attendanceRecords = await Attendance.find({
      employee: { $in: employeeIds },
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
     * ----------------------------------------------------
     * 5. Get approved leaves
     * ----------------------------------------------------
     */

    const approvedLeaves = await Leave.find({
      employee: { $in: employeeIds },
      status: "approved",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    })
      .select(
        "employee employeeId leaveType startDate endDate"
      )
      .lean();

    /*
     * ----------------------------------------------------
     * 6. Create employee/date attendance map
     * ----------------------------------------------------
     *
     * Structure:
     *
     * employeeId
     *      ↓
     * attendanceDate
     *      ↓
     * attendance record
     */

    const attendanceMap = new Map();

    for (const record of attendanceRecords) {
      const employeeKey = record.employee.toString();

      if (!attendanceMap.has(employeeKey)) {
        attendanceMap.set(employeeKey, new Map());
      }

      attendanceMap
        .get(employeeKey)
        .set(record.attendanceDate, record);
    }

    /*
     * ----------------------------------------------------
     * 7. Add approved leave dates
     * ----------------------------------------------------
     *
     * Important:
     *
     * Actual attendance takes precedence over leave.
     *
     * So if an employee has both:
     *
     * Attendance → Present
     * Leave      → Approved
     *
     * We count the day as attendance.
     */

    const leaveMap = new Map();

    for (const leave of approvedLeaves) {
      const employeeKey = leave.employee.toString();

      if (!leaveMap.has(employeeKey)) {
        leaveMap.set(employeeKey, new Map());
      }

      const leaveDates = leaveMap.get(employeeKey);

      const leaveStart =
        leave.startDate > startDate
          ? leave.startDate
          : startDate;

      const leaveEnd =
        leave.endDate < endDate
          ? leave.endDate
          : endDate;

      const dates = getDatesBetween(
        leaveStart,
        leaveEnd
      );

      for (const date of dates) {
        /*
         * Do not overwrite actual attendance.
         */

        if (!leaveDates.has(date)) {
          leaveDates.set(date, {
            status: "leave",
            leaveType: leave.leaveType
          });
        }
      }
    }

    /*
     * ----------------------------------------------------
     * 8. Generate employee-wise summaries
     * ----------------------------------------------------
     */

    const summary = employees.map((employee) => {
      const employeeKey = employee._id.toString();

      const employeeAttendance =
        attendanceMap.get(employeeKey) || new Map();

      const employeeLeaves =
        leaveMap.get(employeeKey) || new Map();

      /*
       * Merge attendance + leave.
       */

      const dailyRecords = new Map();

      /*
       * First add actual attendance.
       */

      for (const [date, record] of employeeAttendance) {
        dailyRecords.set(date, {
          type: "attendance",
          status: record.status,
          workingMinutes: record.workingMinutes || 0
        });
      }

      /*
       * Then add leave only where attendance
       * doesn't already exist.
       */

      for (const [date, leave] of employeeLeaves) {
        if (!dailyRecords.has(date)) {
          dailyRecords.set(date, {
            type: "leave",
            status: "leave",
            workingMinutes: 0,
            leaveType: leave.leaveType
          });
        }
      }

      /*
       * ------------------------------------------------
       * Calculate statistics
       * ------------------------------------------------
       */

      let present = 0;
      let late = 0;
      let halfDay = 0;
      let leave = 0;
      let totalWorkingMinutes = 0;

      for (const record of dailyRecords.values()) {
        if (record.status === "present") {
          present++;
        }

        if (record.status === "late") {
          late++;
        }

        if (record.status === "half-day") {
          halfDay++;
        }

        if (record.status === "leave") {
          leave++;
        }

        if (record.type === "attendance") {
          totalWorkingMinutes +=
            record.workingMinutes || 0;
        }
      }

      /*
       * Days where attendance was actually recorded.
       */

      const workedDays =
        present +
        late +
        halfDay;

      /*
       * We calculate attendance rate only against
       * recorded attendance + approved leave.
       *
       * Unrecorded days cannot automatically be
       * considered absent because the system does
       * not yet have a working-calendar/holiday model.
       */

      const eligibleDays =
        workedDays + leave;

      const attendanceRate =
        eligibleDays > 0
          ? Number(
              ((workedDays / eligibleDays) * 100).toFixed(1)
            )
          : 0;

      return {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department || "",
        designation: employee.designation || "",

        totalDays: dailyRecords.size,

        present,
        late,
        halfDay,
        leave,

        workedDays,

        totalWorkingMinutes,

        attendanceRate
      };
    });

    /*
     * ----------------------------------------------------
     * 9. Pagination
     * ----------------------------------------------------
     */

    const currentPage =
      Math.max(Number(page) || 1, 1);

    const pageLimit =
      Math.max(Number(limit) || 10, 1);

    const total = summary.length;

    const totalPages =
      Math.ceil(total / pageLimit);

    const startIndex =
      (currentPage - 1) * pageLimit;

    const paginatedSummary =
      summary.slice(
        startIndex,
        startIndex + pageLimit
      );

    /*
     * ----------------------------------------------------
     * 10. Response
     * ----------------------------------------------------
     */

    return res.status(200).json({
      success: true,

      summary: paginatedSummary,

      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages
      },

      dateRange: {
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error(
      "Employee attendance summary error:",
      error
    );

    return res.status(500).json({
      message: "Failed to generate employee attendance summary."
    });
  }
};
