import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  RefreshCw,
  Users,
  Download
} from "lucide-react";

import {
  Link
} from "react-router-dom";

import {
  getHRAttendance
} from "../services/hrAttendanceService";

import {
  formatWorkingMinutes
} from "../utils/formatWorkingMinutes";

import {
  exportAttendanceReport
} from "../services/reportService";


const HRAttendance = () => {

  /*
  |--------------------------------------------------------------------------
  | Get Today's Date
  |--------------------------------------------------------------------------
  */

  const getToday = () => {

    const date = new Date();

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${year}-${month}-${day}`;
  };


  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [
    selectedDate,
    setSelectedDate
  ] = useState(
    getToday()
  );


  const [
    selectedStatus,
    setSelectedStatus
  ] = useState(
    "all"
  );


  const [
    attendance,
    setAttendance
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  const [
    exporting,
    setExporting
  ] = useState(false);


  const [
    exportError,
    setExportError
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Load Attendance
  |--------------------------------------------------------------------------
  */

  const loadAttendance = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await getHRAttendance(
          selectedDate
        );

      setAttendance(
        response?.attendance || []
      );

    } catch (error) {

      console.error(
        "HR attendance error:",
        error
      );

      setError(
        error?.response?.data?.message ||
        "Unable to load attendance."
      );

      setAttendance([]);

    } finally {

      setLoading(false);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | Load When Date Changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    loadAttendance();

  }, [
    selectedDate
  ]);


  /*
  |--------------------------------------------------------------------------
  | Filter Attendance
  |--------------------------------------------------------------------------
  */

  const filteredAttendance =
    useMemo(() => {

      if (
        selectedStatus === "all"
      ) {
        return attendance;
      }

      return attendance.filter(
        (record) =>
          record.status ===
          selectedStatus
      );

    }, [
      attendance,
      selectedStatus
    ]);


  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const statistics =
    useMemo(() => {

      const present =
        attendance.filter(
          (record) =>
            record.status ===
            "present"
        ).length;


      const late =
        attendance.filter(
          (record) =>
            record.status ===
            "late"
        ).length;


      const halfDay =
        attendance.filter(
          (record) =>
            record.status ===
            "half-day"
        ).length;


      const leave =
        attendance.filter(
          (record) =>
            record.status ===
            "leave"
        ).length;


      const absent =
        attendance.filter(
          (record) =>
            record.status ===
            "absent"
        ).length;


      const total =
        attendance.length;


      /*
      |--------------------------------------------------------------------------
      | Employees Who Actually Worked
      |--------------------------------------------------------------------------
      */

      const workedRecords =
        attendance.filter(
          (record) =>
            record.status !==
            "leave" &&
            record.status !==
            "absent"
        );


      const workedCount =
        workedRecords.length;


      /*
      |--------------------------------------------------------------------------
      | Attendance Rate
      |--------------------------------------------------------------------------
      |
      | Employees on approved leave are
      | excluded from the denominator.
      |
      */

      const eligibleEmployees =
        total - leave;


      const attendanceRate =
        eligibleEmployees > 0
          ? (
              (
                present +
                late +
                halfDay
              ) /
              eligibleEmployees
            ) * 100
          : 0;


      /*
      |--------------------------------------------------------------------------
      | Total Working Minutes
      |--------------------------------------------------------------------------
      */

      const totalWorkingMinutes =
        workedRecords.reduce(
          (
            totalMinutes,
            record
          ) => {

            return (
              totalMinutes +
              (
                Number(
                  record.workingMinutes
                ) || 0
              )
            );

          },
          0
        );


      /*
      |--------------------------------------------------------------------------
      | Average Working Minutes
      |--------------------------------------------------------------------------
      */

      const averageWorkingMinutes =
        workedCount > 0
          ? Math.round(
              totalWorkingMinutes /
              workedCount
            )
          : 0;


      return {

        total,

        present,

        late,

        halfDay,

        leave,

        absent,

        workedCount,

        attendanceRate,

        totalWorkingMinutes,

        averageWorkingMinutes

      };

    }, [
      attendance
    ]);


  /*
  |--------------------------------------------------------------------------
  | Export Attendance Report
  |--------------------------------------------------------------------------
  |
  | This page represents one selected date.
  | Therefore startDate and endDate are both
  | the selected date.
  |
  */

  const handleExport = async () => {

    try {

      setExporting(true);

      setExportError("");


      const response =
        await exportAttendanceReport({
          startDate: selectedDate,
          endDate: selectedDate,
          status: selectedStatus
        });


      const blob =
        new Blob(
          [response.data],
          {
            type:
              "text/csv;charset=utf-8;"
          }
        );


      const url =
        window.URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href = url;


      link.download =
        `attendance-report-${selectedDate}.csv`;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      window.URL.revokeObjectURL(
        url
      );

    } catch (error) {

      console.error(
        "Attendance export error:",
        error
      );


      let message =
        "Failed to export attendance report.";


      try {

        /*
        |--------------------------------------------------------------------------
        | Axios may return a Blob even when
        | backend sends an error response.
        |--------------------------------------------------------------------------
        */

        if (
          error?.response?.data
            instanceof Blob
        ) {

          const text =
            await error.response.data.text();


          const parsed =
            JSON.parse(text);


          message =
            parsed?.message ||
            message;

        } else {

          message =
            error?.response?.data?.message ||
            message;

        }

      } catch {

        // Keep default error message

      }


      setExportError(
        message
      );

    } finally {

      setExporting(false);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | Format Time
  |--------------------------------------------------------------------------
  */

  const formatTime = (
    value
  ) => {

    if (!value) {
      return "--:--";
    }


    return new Date(
      value
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  };


  /*
  |--------------------------------------------------------------------------
  | Format Percentage
  |--------------------------------------------------------------------------
  */

  const formatPercentage = (
    value
  ) => {

    return `${value.toFixed(1)}%`;

  };


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (

    <div className="dashboard-page">


      {/* ================================================================
          HEADER
      ================================================================ */}

      <header className="dashboard-header">

        <div>

          <p className="eyebrow">
            HR Management
          </p>


          <h1>
            Attendance Management
          </h1>


          <p className="muted">
            Monitor employee attendance
            for a selected date.
          </p>

        </div>


        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >

          <Link
            to="/hr/attendance/summary"
            className="secondary-button"
            style={{
              textDecoration: "none"
            }}
          >
            Employee Summary
          </Link>


          <Link
            to="/hr/attendance/monthly"
            className="secondary-button"
            style={{
              textDecoration: "none"
            }}
          >
            Monthly Report
          </Link>


          <button
            type="button"
            className="primary-button"
            onClick={handleExport}
            disabled={
              exporting ||
              loading ||
              !selectedDate
            }
          >

            <Download
              size={17}
            />


            {exporting
              ? "Exporting..."
              : "Export CSV"}

          </button>


          <button
            type="button"
            className="secondary-button"
            onClick={
              loadAttendance
            }
            disabled={
              loading
            }
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? "spin"
                  : ""
              }
            />


            Refresh

          </button>

        </div>

      </header>


      {/* ================================================================
          EXPORT ERROR
      ================================================================ */}

      {exportError && (

        <div className="error-message">

          {exportError}

        </div>

      )}


      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (

        <div className="error">

          {error}

        </div>

      )}


      {/* ================================================================
          DATE + STATUS FILTER
      ================================================================ */}

      <div className="attendance-filter-card">


        {/* Date Filter */}

        <div className="filter-group">

          <label
            htmlFor="attendance-date"
          >
            Select Date
          </label>


          <div className="date-input-wrapper">

            <CalendarDays
              size={18}
            />


            <input
              id="attendance-date"
              type="date"
              value={
                selectedDate
              }
              onChange={
                (event) =>
                  setSelectedDate(
                    event.target.value
                  )
              }
            />

          </div>

        </div>


        {/* Status Filter */}

        <div className="filter-group">

          <label
            htmlFor="attendance-status"
          >
            Status
          </label>


          <select
            id="attendance-status"
            value={
              selectedStatus
            }
            onChange={
              (event) =>
                setSelectedStatus(
                  event.target.value
                )
            }
          >

            <option value="all">
              All Statuses
            </option>


            <option value="present">
              Present
            </option>


            <option value="late">
              Late
            </option>


            <option value="half-day">
              Half-Day
            </option>


            <option value="leave">
              Leave
            </option>


            <option value="absent">
              Absent
            </option>

          </select>

        </div>

      </div>


      {/* ================================================================
          STATISTICS - FIRST ROW
      ================================================================ */}

      <div className="dashboard-grid">


        {/* Total Records */}

        <div className="stat-card">

          <div className="stat-icon">
            <Users />
          </div>


          <h3>
            Total Records
          </h3>


          <strong>
            {loading
              ? "..."
              : statistics.total}
          </strong>

        </div>


        {/* Present */}

        <div className="stat-card">

          <div className="stat-icon">
            <CalendarDays />
          </div>


          <h3>
            Present
          </h3>


          <strong>
            {loading
              ? "..."
              : statistics.present}
          </strong>

        </div>


        {/* Late */}

        <div className="stat-card">

          <div className="stat-icon">
            <Clock3 />
          </div>


          <h3>
            Late
          </h3>


          <strong>
            {loading
              ? "..."
              : statistics.late}
          </strong>

        </div>


        {/* Half Day */}

        <div className="stat-card">

          <div className="stat-icon">
            <Clock3 />
          </div>


          <h3>
            Half-Day
          </h3>


          <strong>
            {loading
              ? "..."
              : statistics.halfDay}
          </strong>

        </div>


        {/* Leave */}

        <div className="stat-card">

          <div className="stat-icon">
            <CalendarDays />
          </div>


          <h3>
            Leave
          </h3>


          <strong>
            {loading
              ? "..."
              : statistics.leave}
          </strong>

        </div>


        {/* Absent */}

        <div className="stat-card">

          <div className="stat-icon">
            <Users />
          </div>


          <h3>
            Absent
          </h3>


          <strong>
            {loading
              ? "..."
              : statistics.absent}
          </strong>

        </div>


        {/* Attendance Rate */}

        <div className="stat-card">

          <div className="stat-icon">
            <CalendarCheck />
          </div>


          <h3>
            Attendance Rate
          </h3>


          <strong>
            {loading
              ? "..."
              : formatPercentage(
                  statistics.attendanceRate
                )}
          </strong>

        </div>

      </div>


      {/* ================================================================
          WORKING HOURS
      ================================================================ */}

      <div className="dashboard-grid">


        {/* Total Working Hours */}

        <div className="stat-card">

          <div className="stat-icon">
            <Clock3 />
          </div>


          <h3>
            Total Working Hours
          </h3>


          <strong>
            {loading
              ? "..."
              : formatWorkingMinutes(
                  statistics.totalWorkingMinutes
                )}
          </strong>


          <p className="muted">
            Across employees who worked
          </p>

        </div>


        {/* Average Working Hours */}

        <div className="stat-card">

          <div className="stat-icon">
            <Clock3 />
          </div>


          <h3>
            Average Working Hours
          </h3>


          <strong>
            {loading
              ? "..."
              : formatWorkingMinutes(
                  statistics.averageWorkingMinutes
                )}
          </strong>


          <p className="muted">
            Per employee who worked
          </p>

        </div>


        {/* Employees Worked */}

        <div className="stat-card">

          <div className="stat-icon">
            <Users />
          </div>


          <h3>
            Employees Worked
          </h3>


          <strong>
            {loading
              ? "..."
              : statistics.workedCount}
          </strong>


          <p className="muted">
            Excludes approved leave
            and absence
          </p>

        </div>

      </div>


      {/* ================================================================
          ATTENDANCE TABLE
      ================================================================ */}

      <div className="info-card">


        <div className="history-heading">

          <div>

            <h2>
              Attendance Records
            </h2>


            <p className="muted">
              Attendance for{" "}
              {selectedDate}
            </p>

          </div>


          <CalendarDays
            size={24}
          />

        </div>


        {loading ? (

          <div className="table-loader">

            <div className="loader" />


            <p>
              Loading attendance...
            </p>

          </div>

        ) : filteredAttendance.length === 0 ? (

          <div className="attendance-empty-state">

            <Clock3
              size={35}
            />


            <h3>
              No attendance records
            </h3>


            <p>
              No attendance records match
              the selected status.
            </p>

          </div>

        ) : (

          <div className="attendance-table-wrapper">

            <table className="attendance-table">

              <thead>

                <tr>

                  <th>
                    Employee
                  </th>


                  <th>
                    Employee ID
                  </th>


                  <th>
                    Department
                  </th>


                  <th>
                    Check In
                  </th>


                  <th>
                    Check Out
                  </th>


                  <th>
                    Working Hours
                  </th>


                  <th>
                    Status
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredAttendance.map(
                  (record) => (

                    <tr
                      key={
                        record.id
                      }
                    >

                      {/* Employee */}

                      <td>

                        <div className="employee-cell">

                          <strong>
                            {
                              record
                                .employee
                                ?.name ||
                              "Unknown"
                            }
                          </strong>


                          <span>
                            {
                              record
                                .employee
                                ?.email ||
                              ""
                            }
                          </span>

                        </div>

                      </td>


                      {/* Employee ID */}

                      <td>

                        {
                          record
                            .employee
                            ?.employeeId ||
                          record.employeeId ||
                          "--"
                        }

                      </td>


                      {/* Department */}

                      <td>

                        {
                          record
                            .employee
                            ?.department ||
                          "--"
                        }

                      </td>


                      {/* Check In */}

                      <td>

                        {
                          record.status ===
                          "leave"
                            ? "Leave"
                            : record.status ===
                              "absent"
                              ? "--:--"
                              : formatTime(
                                  record.checkIn
                                )
                        }

                      </td>


                      {/* Check Out */}

                      <td>

                        {
                          record.status ===
                          "leave"
                            ? "Leave"
                            : record.status ===
                              "absent"
                              ? "--:--"
                              : formatTime(
                                  record.checkOut
                                )
                        }

                      </td>


                      {/* Working Hours */}

                      <td>

                        {
                          record.status ===
                            "leave" ||
                          record.status ===
                            "absent"
                            ? "0h 00m"
                            : formatWorkingMinutes(
                                record.workingMinutes
                              )
                        }

                      </td>


                      {/* Status */}

                      <td>

                        <span
                          className={`status-badge ${record.status}`}
                        >

                          {
                            record.status
                              ?.replace(
                                "-",
                                " "
                              )
                              .toUpperCase()
                          }

                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  );

};


export default HRAttendance;