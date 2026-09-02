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
  getMonthlyAttendanceReport
} from "../services/attendanceService";

import {
  formatWorkingMinutes
} from "../utils/formatWorkingMinutes";


const MonthlyAttendanceReport = () => {

  const currentDate =
    new Date();


  const defaultMonth =
    `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;


  const [
    month,
    setMonth
  ] = useState(
    defaultMonth
  );


  const [
    search,
    setSearch
  ] = useState("");


  const [
    department,
    setDepartment
  ] = useState("");


  const [
    report,
    setReport
  ] = useState([]);


  const [
    pagination,
    setPagination
  ] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  const loadReport =
    async (
      requestedPage = 1
    ) => {

      try {

        setLoading(true);

        setError("");


        const response =
          await getMonthlyAttendanceReport({

            month,

            search,

            department,

            page:
              requestedPage,

            limit: 10

          });


        setReport(
          response?.report ||
          []
        );


        setPagination(
          response?.pagination || {
            page:
              requestedPage,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        );

      } catch (err) {

        console.error(
          "Monthly attendance report error:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to load monthly attendance report."
        );


        setReport([]);

      } finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    loadReport(1);

  }, []);


  const handleApplyFilters =
    () => {

      loadReport(1);

    };


  const handlePrevious =
    () => {

      if (
        pagination.page <= 1
      ) {
        return;
      }


      loadReport(
        pagination.page - 1
      );

    };


  const handleNext =
    () => {

      if (
        pagination.page >=
        pagination.totalPages
      ) {
        return;
      }


      loadReport(
        pagination.page + 1
      );

    };


  return (

    <div className="dashboard-page">


      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}

      <header className="dashboard-header">

        <div>

          <p className="eyebrow">
            HR Administration
          </p>


          <h1>
            Monthly Attendance Report
          </h1>


          <p className="muted">
            Review employee attendance
            performance for an entire month.
          </p>

        </div>


        <div
          style={{
            display: "flex",
            gap: "10px"
          }}
        >

          <Link
            to="/hr/attendance"
            className="secondary-button"
            style={{
              textDecoration: "none"
            }}
          >
            Attendance Records
          </Link>


          <Link
            to="/hr/attendance/summary"
            className="secondary-button"
            style={{
              textDecoration: "none"
            }}
          >
            Employee Summary
          </Link>


          <button
            className="secondary-button"
            onClick={() =>
              loadReport(
                pagination.page
              )
            }
            disabled={loading}
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


      {/* ================================================================ */}
      {/* ERROR */}
      {/* ================================================================ */}

      {error && (

        <div className="error">
          {error}
        </div>

      )}


      {/* ================================================================ */}
      {/* FILTERS */}
      {/* ================================================================ */}

      <div className="summary-filter-card">


        {/* Month */}

        <div className="summary-filter-group">

          <label>
            Select Month
          </label>


          <div className="summary-input-wrapper">

            <CalendarDays
              size={17}
            />


            <input
              type="month"
              value={month}
              onChange={
                (event) =>
                  setMonth(
                    event.target.value
                  )
              }
            />

          </div>

        </div>


        {/* Search */}

        <div className="summary-filter-group">

          <label>
            Search Employee
          </label>


          <div className="summary-input-wrapper">

            <Search
              size={17}
            />


            <input
              type="text"
              placeholder="Name, email or employee ID"
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
            />

          </div>

        </div>


        {/* Department */}

        <div className="summary-filter-group">

          <label>
            Department
          </label>


          <input
            type="text"
            placeholder="e.g. IT"
            value={department}
            onChange={
              (event) =>
                setDepartment(
                  event.target.value
                )
            }
          />

        </div>


        {/* Apply */}

        <button
          className="primary-button summary-filter-button"
          onClick={
            handleApplyFilters
          }
          disabled={loading}
        >
          Apply Filters
        </button>

      </div>


      {/* ================================================================ */}
      {/* OVERVIEW */}
      {/* ================================================================ */}

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
            Report Month
          </h3>


          <strong>
            {month}
          </strong>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <Clock3 />
          </div>


          <h3>
            Pages
          </h3>


          <strong>
            {pagination.totalPages}
          </strong>

        </div>

      </div>


      {/* ================================================================ */}
      {/* MONTHLY TABLE */}
      {/* ================================================================ */}

      <div className="info-card">


        <div className="history-heading">

          <div>

            <h2>
              Monthly Employee Report
            </h2>


            <p className="muted">
              Attendance summary for{" "}
              {month}
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
              Generating monthly report...
            </p>

          </div>

        ) : report.length === 0 ? (

          <div className="attendance-empty-state">

            <Users
              size={35}
            />


            <h3>
              No employee records
            </h3>


            <p>
              No employees match the
              selected filters.
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
                    Department
                  </th>

                  <th>
                    Present
                  </th>

                  <th>
                    Late
                  </th>

                  <th>
                    Half-Day
                  </th>

                  <th>
                    Leave
                  </th>

                  <th>
                    Working Hours
                  </th>

                  <th>
                    Attendance Rate
                  </th>

                </tr>

              </thead>


              <tbody>

                {report.map(
                  (employee) => (

                    <tr
                      key={
                        employee.id
                      }
                    >


                      {/* Employee */}

                      <td>

                        <div className="employee-cell">

                          <strong>
                            {employee.name}
                          </strong>


                          <span>
                            {employee.employeeId}
                          </span>


                          <small>
                            {employee.email}
                          </small>

                        </div>

                      </td>


                      {/* Department */}

                      <td>

                        <strong>
                          {
                            employee.department ||
                            "--"
                          }
                        </strong>


                        {employee.designation && (

                          <small className="table-subtext">
                            {employee.designation}
                          </small>

                        )}

                      </td>


                      {/* Present */}

                      <td>

                        <span className="summary-count present">
                          {employee.present}
                        </span>

                      </td>


                      {/* Late */}

                      <td>

                        <span className="summary-count late">
                          {employee.late}
                        </span>

                      </td>


                      {/* Half Day */}

                      <td>

                        <span className="summary-count half-day">
                          {employee.halfDay}
                        </span>

                      </td>


                      {/* Leave */}

                      <td>

                        <span className="summary-count leave">
                          {employee.leave}
                        </span>

                      </td>


                      {/* Hours */}

                      <td>

                        <strong>
                          {formatWorkingMinutes(
                            employee.totalWorkingMinutes
                          )}
                        </strong>

                      </td>


                      {/* Rate */}

                      <td>

                        <strong>
                          {
                            employee.attendanceRate
                          }%
                        </strong>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}


        {/* ================================================================ */}
        {/* PAGINATION */}
        {/* ================================================================ */}

        {pagination.totalPages > 0 && (

          <div className="pagination">


            <button
              className="secondary-button"
              onClick={
                handlePrevious
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
              {pagination.page}
              {" "}of{" "}
              {pagination.totalPages}

            </span>


            <button
              className="secondary-button"
              onClick={
                handleNext
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


export default MonthlyAttendanceReport;