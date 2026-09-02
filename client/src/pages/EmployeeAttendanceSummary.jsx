import {
  useEffect,
  useState
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Search,
  Users
} from "lucide-react";

import {
  Link
} from "react-router-dom";

import {
  getEmployeeAttendanceSummary
} from "../services/attendanceService";

import {
  formatWorkingMinutes
} from "../utils/formatWorkingMinutes";

const EmployeeAttendanceSummary = () => {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const firstDayOfMonth =
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];

  const [startDate, setStartDate] =
    useState(firstDayOfMonth);

  const [endDate, setEndDate] =
    useState(today);

  const [search, setSearch] =
    useState("");

  const [department, setDepartment] =
    useState("");

  const [summary, setSummary] =
    useState([]);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadSummary = async (
    requestedPage = pagination.page
  ) => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getEmployeeAttendanceSummary({
          startDate,
          endDate,
          search,
          department,
          page: requestedPage,
          limit: 10
        });

      setSummary(
        response?.summary || []
      );

      setPagination(
        response?.pagination || {
          page: requestedPage,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      );

    } catch (err) {
      console.error(
        "Employee attendance summary error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to load employee attendance summary."
      );

      setSummary([]);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary(1);
  }, []);

  const handleApplyFilters = () => {
    loadSummary(1);
  };

  const handlePreviousPage = () => {
    if (pagination.page <= 1) {
      return;
    }

    loadSummary(
      pagination.page - 1
    );
  };

  const handleNextPage = () => {
    if (
      pagination.page >=
      pagination.totalPages
    ) {
      return;
    }

    loadSummary(
      pagination.page + 1
    );
  };

  return (
    <div className="dashboard-page">

      {/* ---------------------------------- */}
      {/* Header */}
      {/* ---------------------------------- */}

      <header className="dashboard-header">

        <div>
          <p className="eyebrow">
            HR Administration
          </p>

          <h1>
            Employee Attendance Summary
          </h1>

          <p className="muted">
            Review attendance performance
            employee-wise across a selected date range.
          </p>
        </div>

        <div className="attendance-summary-header-actions">

          <Link
            to="/hr/attendance"
            className="secondary-button"
            style={{
              textDecoration: "none"
            }}
          >
            Attendance Records
          </Link>

          <button
            className="secondary-button"
            onClick={() =>
              loadSummary(pagination.page)
            }
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading ? "spin" : ""
              }
            />

            Refresh
          </button>

        </div>

      </header>

      {/* ---------------------------------- */}
      {/* Error */}
      {/* ---------------------------------- */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ---------------------------------- */}
      {/* Filters */}
      {/* ---------------------------------- */}

      <div className="summary-filter-card">

        <div className="summary-filter-group">

          <label>
            Start Date
          </label>

          <div className="summary-input-wrapper">

            <CalendarDays size={17} />

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
            />

          </div>

        </div>

        <div className="summary-filter-group">

          <label>
            End Date
          </label>

          <div className="summary-input-wrapper">

            <CalendarDays size={17} />

            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />

          </div>

        </div>

        <div className="summary-filter-group">

          <label>
            Search Employee
          </label>

          <div className="summary-input-wrapper">

            <Search size={17} />

            <input
              type="text"
              placeholder="Name, email or employee ID"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

        </div>

        <div className="summary-filter-group">

          <label>
            Department
          </label>

          <input
            type="text"
            placeholder="e.g. IT"
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value)
            }
          />

        </div>

        <button
          className="primary-button summary-filter-button"
          onClick={handleApplyFilters}
          disabled={loading}
        >
          Apply Filters
        </button>

      </div>

      {/* ---------------------------------- */}
      {/* Overview */}
      {/* ---------------------------------- */}

      <div className="dashboard-grid">

        <div className="stat-card">

          <div className="stat-icon">
            <Users />
          </div>

          <h3>
            Employees
          </h3>

          <strong>
            {loading
              ? "..."
              : pagination.total}
          </strong>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <CalendarDays />
          </div>

          <h3>
            Date Range
          </h3>

          <strong className="summary-date-value">
            {startDate} → {endDate}
          </strong>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <Clock3 />
          </div>

          <h3>
            Page
          </h3>

          <strong>
            {pagination.totalPages === 0
              ? 0
              : `${pagination.page} / ${pagination.totalPages}`}
          </strong>

        </div>

      </div>

      {/* ---------------------------------- */}
    {/* Employee Summary Table */}
    {/* ---------------------------------- */}

    <div className="info-card employee-summary-card">

    {/* Table Header */}

    <div className="employee-summary-title">

        <div>

        <p className="eyebrow">
            Attendance Analytics
        </p>

        <h2>
            Employee-wise Attendance Summary
        </h2>

        <p className="muted">
            Attendance, approved leave and working-hour
            statistics for the selected date range.
        </p>

        </div>

    </div>


    {/* Loading */}

    {loading ? (

        <div className="page-loader">

        <div className="loader" />

        <p>
            Generating attendance summary...
        </p>

        </div>

    ) : summary.length === 0 ? (

        /* Empty State */

        <div className="empty-state">

        <Users
            size={40}
        />

        <h3>
            No Employee Data Found
        </h3>

        <p>
            No employee attendance data was found
            for the selected filters.
        </p>

        </div>

    ) : (

        /* Table */

        <div className="employee-summary-table-container">

        <table className="employee-summary-table">

            <thead>

            <tr>

                <th className="employee-column">
                Employee
                </th>

                <th className="department-column">
                Department
                </th>

                <th className="number-column">
                Present
                </th>

                <th className="number-column">
                Late
                </th>

                <th className="number-column">
                Half-Day
                </th>

                <th className="number-column">
                Leave
                </th>

                <th className="hours-column">
                Working Hours
                </th>

                <th className="rate-column">
                Attendance Rate
                </th>

            </tr>

            </thead>


            <tbody>

            {summary.map(
                (employee) => (

                <tr
                    key={
                    employee.id
                    }
                >

                    {/* -------------------------------- */}
                    {/* Employee */}
                    {/* -------------------------------- */}

                    <td className="employee-column">

                    <div className="employee-summary-profile">

                        <div className="employee-summary-avatar">

                        {
                            employee.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "?"
                        }

                        </div>


                        <div className="employee-summary-details">

                        <strong>
                            {
                            employee.name ||
                            "Unknown Employee"
                            }
                        </strong>


                        <span>
                            {
                            employee.employeeId ||
                            "--"
                            }
                        </span>


                        <small>
                            {
                            employee.email ||
                            ""
                            }
                        </small>

                        </div>

                    </div>

                    </td>


                    {/* -------------------------------- */}
                    {/* Department */}
                    {/* -------------------------------- */}

                    <td className="department-column">

                    <div className="department-cell">

                        <strong>
                        {
                            employee.department ||
                            "—"
                        }
                        </strong>


                        {employee.designation && (

                        <span>
                            {
                            employee.designation
                            }
                        </span>

                        )}

                    </div>

                    </td>


                    {/* -------------------------------- */}
                    {/* Present */}
                    {/* -------------------------------- */}

                    <td className="number-column">

                    <span className="summary-count present">

                        {
                        employee.present ??
                        0
                        }

                    </span>

                    </td>


                    {/* -------------------------------- */}
                    {/* Late */}
                    {/* -------------------------------- */}

                    <td className="number-column">

                    <span className="summary-count late">

                        {
                        employee.late ??
                        0
                        }

                    </span>

                    </td>


                    {/* -------------------------------- */}
                    {/* Half Day */}
                    {/* -------------------------------- */}

                    <td className="number-column">

                    <span className="summary-count half-day">

                        {
                        employee.halfDay ??
                        0
                        }

                    </span>

                    </td>


                    {/* -------------------------------- */}
                    {/* Leave */}
                    {/* -------------------------------- */}

                    <td className="number-column">

                    <span className="summary-count leave">

                        {
                        employee.leave ??
                        0
                        }

                    </span>

                    </td>


                    {/* -------------------------------- */}
                    {/* Working Hours */}
                    {/* -------------------------------- */}

                    <td className="hours-column">

                    <strong className="working-hours-value">

                        {
                        formatWorkingMinutes(
                            employee.totalWorkingMinutes
                        )
                        }

                    </strong>

                    </td>


                    {/* -------------------------------- */}
                    {/* Attendance Rate */}
                    {/* -------------------------------- */}

                    <td className="rate-column">

                    <div className="attendance-rate-cell">

                        <div className="attendance-rate-header">

                        <strong>
                            {
                            employee.attendanceRate ??
                            0
                            }%
                        </strong>

                        </div>


                        <div className="attendance-rate-bar">

                        <div
                            className="attendance-rate-fill"
                            style={{
                            width: `${Math.min(
                                Number(
                                employee.attendanceRate
                                ) || 0,
                                100
                            )}%`
                            }}
                        />

                        </div>

                    </div>

                    </td>

                </tr>

                )
            )}

            </tbody>

        </table>

        </div>

    )}


    {/* ---------------------------------- */}
    {/* Pagination */}
    {/* ---------------------------------- */}

    {pagination.totalPages > 0 && (

        <div className="pagination">

        <button
            className="secondary-button"
            onClick={
            handlePreviousPage
            }
            disabled={
            loading ||
            pagination.page <= 1
            }
        >

            <ChevronLeft
            size={17}
            />

            Previous

        </button>


        <span className="pagination-info">

            Page{" "}
            <strong>
            {pagination.page}
            </strong>
            {" "}of{" "}
            <strong>
            {pagination.totalPages}
            </strong>

        </span>


        <button
            className="secondary-button"
            onClick={
            handleNextPage
            }
            disabled={
            loading ||
            pagination.page >=
                pagination.totalPages
            }
        >

            Next

            <ChevronRight
            size={17}
            />

        </button>

        </div>

    )}

    </div>

    </div>
  );
};

export default EmployeeAttendanceSummary;
