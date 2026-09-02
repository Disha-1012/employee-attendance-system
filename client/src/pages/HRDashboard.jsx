import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Activity,
  CalendarCheck,
  CalendarDays,
  Clock3,
  LogOut,
  RefreshCw,
  Users
} from "lucide-react";

import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  Link
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";

import {
  getHRDashboardAnalytics
} from "../services/analyticsService";


/*
|--------------------------------------------------------------------------
| Local Date Helper
|--------------------------------------------------------------------------
*/

const getLocalDateString = (
  date
) => {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;

};


const getMonthStart = () => {

  const date =
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );


  return getLocalDateString(
    date
  );

};


const getToday = () => {

  return getLocalDateString(
    new Date()
  );

};


/*
|--------------------------------------------------------------------------
| Format Working Minutes
|--------------------------------------------------------------------------
*/

const formatWorkingMinutes = (
  minutes
) => {

  const totalMinutes =
    Number(minutes || 0);


  if (
    totalMinutes <= 0
  ) {
    return "0h 0m";
  }


  const hours =
    Math.floor(
      totalMinutes / 60
    );


  const remainingMinutes =
    totalMinutes % 60;


  return `${hours}h ${remainingMinutes}m`;

};


/*
|--------------------------------------------------------------------------
| HR Dashboard
|--------------------------------------------------------------------------
*/

const HRDashboard = () => {

  const {
    user,
    logout
  } = useAuth();


  /*
  |--------------------------------------------------------------------------
  | Date Filters
  |--------------------------------------------------------------------------
  */

  const [
    startDate,
    setStartDate
  ] = useState(
    getMonthStart()
  );


  const [
    endDate,
    setEndDate
  ] = useState(
    getToday()
  );


  /*
  |--------------------------------------------------------------------------
  | Analytics State
  |--------------------------------------------------------------------------
  */

  const [
    analytics,
    setAnalytics
  ] = useState(null);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Load Analytics
  |--------------------------------------------------------------------------
  */

  const loadAnalytics =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await getHRDashboardAnalytics({

            startDate,

            endDate

          });


        setAnalytics(
          response
        );

      } catch (err) {

        console.error(
          "HR dashboard analytics error:",
          err
        );


        setError(
          err
            ?.response
            ?.data
            ?.message ||
          "Unable to load HR dashboard analytics."
        );

      } finally {

        setLoading(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    loadAnalytics();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | Overview
  |--------------------------------------------------------------------------
  */

  const overview =
    analytics?.overview || {

      totalEmployees: 0,

      workingDays: 0,

      present: 0,

      late: 0,

      halfDay: 0,

      leave: 0,

      absent: 0,

      attendanceRate: 0,

      totalWorkingMinutes: 0,

      averageWorkingMinutes: 0

    };


  /*
  |--------------------------------------------------------------------------
  | Department Data
  |--------------------------------------------------------------------------
  */

  const departments =
    analytics?.departments || [];

  const trend =
  analytics?.trend || [];

  const attendanceDistribution = [
    {
      name: "Present",
      value: Number(
        overview.present || 0
      )
    },

    {
      name: "Late",
      value: Number(
        overview.late || 0
      )
    },

    {
      name: "Half-Day",
      value: Number(
        overview.halfDay || 0
      )
    },

    {
      name: "Leave",
      value: Number(
        overview.leave || 0
      )
    },

    {
      name: "Absent",
      value: Number(
        overview.absent || 0
      )
    }
  ];

  const departmentChartData =
    departments.map(
      (department) => ({

        department:
          department.department,

        attendanceRate:
          Number(
            department.attendanceRate || 0
          ),

        workingMinutes:
          Number(
            department.workingMinutes || 0
          ),

        employees:
          Number(
            department.employees || 0
          )

      })
    );


  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  const invalidDateRange =
    useMemo(
      () =>
        startDate &&
        endDate &&
        startDate > endDate,
      [
        startDate,
        endDate
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Apply Filters
  |--------------------------------------------------------------------------
  */

  const handleApplyFilters =
    () => {

      if (
        invalidDateRange
      ) {

        setError(
          "Start date cannot be after end date."
        );

        return;

      }


      loadAnalytics();

    };


  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh =
    () => {

      loadAnalytics();

    };


  return (

    <div className="dashboard-page">


      {/* ================================================================
          HEADER
      ================================================================ */}

      <header className="dashboard-header">

        <div>

          <p className="eyebrow">
            HR Administration
          </p>


          <h1>
            Welcome, {user?.name}
          </h1>


          <p className="muted">
            Monitor employee attendance,
            working hours and leave activity.
          </p>

        </div>


        <div
          className="hr-dashboard-header-actions"
        >

          <Link
            to="/hr/employees"
            className="secondary-button"
            style={{
              textDecoration:
                "none"
            }}
          >
            <Users size={17} />
            Employees
          </Link>


          <Link
            to="/hr/attendance"
            className="secondary-button"
            style={{
              textDecoration:
                "none"
            }}
          >
            <CalendarDays size={17} />
            Attendance
          </Link>


          <Link
            to="/hr/leaves"
            className="secondary-button"
            style={{
              textDecoration:
                "none"
            }}
          >
            Leave Management
          </Link>


          <button
            className="secondary-button"
            onClick={
              handleRefresh
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


          <button
            className="logout-button"
            onClick={logout}
          >

            <LogOut size={18} />

            Logout

          </button>

        </div>

      </header>



      {/* ================================================================
          DATE FILTERS
      ================================================================ */}

      <div
        className="hr-analytics-filter-card"
      >

        <div
          className="hr-analytics-filter-group"
        >

          <label>
            Start Date
          </label>


          <div
            className="hr-analytics-input"
          >

            <CalendarDays
              size={17}
            />


            <input
              type="date"
              value={startDate}
              onChange={
                (event) =>
                  setStartDate(
                    event.target.value
                  )
              }
            />

          </div>

        </div>


        <div
          className="hr-analytics-filter-group"
        >

          <label>
            End Date
          </label>


          <div
            className="hr-analytics-input"
          >

            <CalendarDays
              size={17}
            />


            <input
              type="date"
              value={endDate}
              onChange={
                (event) =>
                  setEndDate(
                    event.target.value
                  )
              }
            />

          </div>

        </div>


        <button
          className="primary-button"
          onClick={
            handleApplyFilters
          }
          disabled={
            loading
          }
        >

          <Activity size={17} />

          Apply Filters

        </button>

      </div>



      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (

        <div className="error-message">

          {error}

        </div>

      )}



      {/* ================================================================
          KPI CARDS
      ================================================================ */}

      <div
        className="hr-analytics-grid"
      >


        {/* Total Employees */}

        <div
          className="analytics-stat-card"
        >

          <div
            className="analytics-stat-icon"
          >

            <Users />

          </div>


          <div>

            <p>
              Total Employees
            </p>


            <strong>
              {
                loading
                  ? "..."
                  : overview.totalEmployees
              }
            </strong>

          </div>

        </div>



        {/* Attendance Rate */}

        <div
          className="analytics-stat-card"
        >

          <div
            className="analytics-stat-icon"
          >

            <Activity />

          </div>


          <div>

            <p>
              Attendance Rate
            </p>


            <strong>
              {
                loading
                  ? "..."
                  : `${overview.attendanceRate}%`
              }
            </strong>

          </div>

        </div>



        {/* Present */}

        <div
          className="analytics-stat-card"
        >

          <div
            className="analytics-stat-icon"
          >

            <CalendarCheck />

          </div>


          <div>

            <p>
              Present
            </p>


            <strong>
              {
                loading
                  ? "..."
                  : overview.present
              }
            </strong>

          </div>

        </div>



        {/* Late */}

        <div
          className="analytics-stat-card"
        >

          <div
            className="analytics-stat-icon"
          >

            <Clock3 />

          </div>


          <div>

            <p>
              Late
            </p>


            <strong>
              {
                loading
                  ? "..."
                  : overview.late
              }
            </strong>

          </div>

        </div>



        {/* Half Day */}

        <div
          className="analytics-stat-card"
        >

          <div
            className="analytics-stat-icon"
          >

            <Clock3 />

          </div>


          <div>

            <p>
              Half-Day
            </p>


            <strong>
              {
                loading
                  ? "..."
                  : overview.halfDay
              }
            </strong>

          </div>

        </div>



        {/* Leave */}

        <div
          className="analytics-stat-card"
        >

          <div
            className="analytics-stat-icon"
          >

            <CalendarDays />

          </div>


          <div>

            <p>
              Leave
            </p>


            <strong>
              {
                loading
                  ? "..."
                  : overview.leave
              }
            </strong>

          </div>

        </div>



        {/* Absent */}

        <div
          className="analytics-stat-card"
        >

          <div
            className="analytics-stat-icon"
          >

            <Users />

          </div>


          <div>

            <p>
              Absent
            </p>


            <strong>
              {
                loading
                  ? "..."
                  : overview.absent
              }
            </strong>

          </div>

        </div>



        {/* Average Working Hours */}

        <div
          className="analytics-stat-card"
        >

          <div
            className="analytics-stat-icon"
          >

            <Clock3 />

          </div>


          <div>

            <p>
              Avg. Working Time
            </p>


            <strong
              className="analytics-time-value"
            >
              {
                loading
                  ? "..."
                  : formatWorkingMinutes(
                      overview.averageWorkingMinutes
                    )
              }
            </strong>

          </div>

        </div>

      </div>



      {/* ================================================================
          ATTENDANCE OVERVIEW
      ================================================================ */}

      <div
        className="analytics-section-card"
      >

        <div
          className="analytics-section-header"
        >

          <div>

            <h2>
              Attendance Overview
            </h2>


            <p className="muted">
              Attendance activity for the
              selected date range.
            </p>

          </div>


          <div
            className="analytics-period"
          >
            {startDate} → {endDate}
          </div>

        </div>


        <div
          className="attendance-overview-grid"
        >


          <div
            className="overview-metric"
          >

            <span>
              Present
            </span>

            <strong>
              {
                overview.present
              }
            </strong>

          </div>


          <div
            className="overview-metric"
          >

            <span>
              Late
            </span>

            <strong>
              {
                overview.late
              }
            </strong>

          </div>


          <div
            className="overview-metric"
          >

            <span>
              Half-Day
            </span>

            <strong>
              {
                overview.halfDay
              }
            </strong>

          </div>


          <div
            className="overview-metric"
          >

            <span>
              Leave
            </span>

            <strong>
              {
                overview.leave
              }
            </strong>

          </div>


          <div
            className="overview-metric"
          >

            <span>
              Absent
            </span>

            <strong>
              {
                overview.absent
              }
            </strong>

          </div>

        </div>

      </div>



      {/* ================================================================
          WORKING HOURS
      ================================================================ */}

      <div
        className="analytics-two-column"
      >

        <div
          className="analytics-section-card"
        >

          <div
            className="analytics-section-header"
          >

            <div>

              <h2>
                Working Hours
              </h2>


              <p className="muted">
                Overall working-time statistics.
              </p>

            </div>

          </div>


          <div
            className="working-hours-summary"
          >

            <div>

              <span>
                Total Working Time
              </span>


              <strong>
                {
                  formatWorkingMinutes(
                    overview.totalWorkingMinutes
                  )
                }
              </strong>

            </div>


            <div>

              <span>
                Average per Attended Day
              </span>


              <strong>
                {
                  formatWorkingMinutes(
                    overview.averageWorkingMinutes
                  )
                }
              </strong>

            </div>


            <div>

              <span>
                Working Days in Range
              </span>


              <strong>
                {
                  overview.workingDays
                }
              </strong>

            </div>

          </div>

        </div>



        {/* Attendance Rate */}

        <div
          className="analytics-section-card"
        >

          <div
            className="analytics-section-header"
          >

            <div>

              <h2>
                Overall Attendance Rate
              </h2>


              <p className="muted">
                Leave days are excluded from
                expected attendance.
              </p>

            </div>

          </div>


          <div
            className="large-attendance-rate"
          >

            <strong>
              {
                overview.attendanceRate
              }%
            </strong>


            <div
              className="large-attendance-rate-bar"
            >

              <div
                className="large-attendance-rate-fill"
                style={{
                  width: `${Math.min(
                    Number(
                      overview.attendanceRate
                    ) || 0,
                    100
                  )}%`
                }}
              />

            </div>

          </div>

        </div>

      </div>



      {/* ================================================================
          DEPARTMENT ANALYTICS
      ================================================================ */}

      <div
        className="analytics-section-card"
      >

        <div
          className="analytics-section-header"
        >

          {/* ================================================================
    CHARTS
================================================================ */}

<div className="hr-charts-grid">


  {/* ============================================================
      ATTENDANCE DISTRIBUTION
  ============================================================ */}

  <div className="analytics-section-card chart-card">

    <div className="analytics-section-header">

      <div>

        <h2>
          Attendance Distribution
        </h2>

        <p className="muted">
          Overall attendance status for the
          selected date range.
        </p>

      </div>

    </div>


    <div className="chart-container">

      {
        loading ? (

          <div className="chart-empty-state">
            Loading chart...
          </div>

        ) : (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={
                  attendanceDistribution
                }
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={105}
                innerRadius={55}
                paddingAngle={2}
                label
              >

                {
                  attendanceDistribution.map(
                    (entry, index) => (

                      <Cell
                        key={
                          `cell-${index}`
                        }
                      />

                    )
                  )
                }

              </Pie>


              <Tooltip />


              <Legend />

            </PieChart>

          </ResponsiveContainer>

        )
      }

    </div>

  </div>



  {/* ============================================================
      DEPARTMENT ATTENDANCE RATE
  ============================================================ */}

  <div className="analytics-section-card chart-card">

    <div className="analytics-section-header">

      <div>

        <h2>
          Department Attendance Rate
        </h2>

        <p className="muted">
          Attendance rate comparison by department.
        </p>

      </div>

    </div>


    <div className="chart-container">

      {
        loading ? (

          <div className="chart-empty-state">
            Loading chart...
          </div>

        ) : departmentChartData.length === 0 ? (

          <div className="chart-empty-state">
            No department data available.
          </div>

        ) : (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={
                departmentChartData
              }
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 45
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="department"
                angle={-25}
                textAnchor="end"
                interval={0}
              />

              <YAxis
                domain={[
                  0,
                  100
                ]}
                tickFormatter={
                  (value) =>
                    `${value}%`
                }
              />

              <Tooltip
                formatter={
                  (value) =>
                    `${value}%`
                }
              />

              <Bar
                dataKey="attendanceRate"
                name="Attendance Rate"
                radius={[
                  6,
                  6,
                  0,
                  0
                ]}
              />

            </BarChart>

          </ResponsiveContainer>

        )
      }

    </div>

  </div>

</div>

{/* ============================================================
    DEPARTMENT WORKING HOURS
============================================================ */}

<div className="analytics-section-card chart-card">

  <div className="analytics-section-header">

    <div>

      <h2>
        Department Working Hours
      </h2>

      <p className="muted">
        Total working time recorded by department.
      </p>

    </div>

  </div>


  <div className="chart-container">

    {
      loading ? (

        <div className="chart-empty-state">
          Loading chart...
        </div>

      ) : departmentChartData.length === 0 ? (

        <div className="chart-empty-state">
          No working-hour data available.
        </div>

      ) : (

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <BarChart
            data={
              departmentChartData.map(
                (department) => ({

                  ...department,

                  workingHours:
                    Number(
                      (
                        department.workingMinutes /
                        60
                      ).toFixed(2)
                    )

                })
              )
            }
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 45
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="department"
              angle={-25}
              textAnchor="end"
              interval={0}
            />

            <YAxis
              tickFormatter={
                (value) =>
                  `${value}h`
              }
            />

            <Tooltip
              formatter={
                (value) =>
                  `${value} hours`
              }
            />

            <Bar
              dataKey="workingHours"
              name="Working Hours"
              radius={[
                6,
                6,
                0,
                0
              ]}
            />

          </BarChart>

        </ResponsiveContainer>

      )
    }

  </div>

</div>



{/* ================================================================
    ATTENDANCE TREND
================================================================ */}

<div className="analytics-section-card chart-card chart-card-wide">

  <div className="analytics-section-header">

    <div>

      <h2>
        Attendance Trend
      </h2>

      <p className="muted">
        Daily attendance activity across the
        selected date range.
      </p>

    </div>

  </div>


  <div className="chart-container chart-container-large">

    {
      loading ? (

        <div className="chart-empty-state">
          Loading attendance trend...
        </div>

      ) : trend.length === 0 ? (

        <div className="chart-empty-state">
          No attendance trend data available.
        </div>

      ) : (

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart
            data={trend}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 5
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="date"
            />

            <YAxis />

            <Tooltip />

            <Legend />


            <Line
              type="monotone"
              dataKey="present"
              name="Present"
              strokeWidth={2}
              dot={{
                r: 3
              }}
            />


            <Line
              type="monotone"
              dataKey="late"
              name="Late"
              strokeWidth={2}
              dot={{
                r: 3
              }}
            />


            <Line
              type="monotone"
              dataKey="halfDay"
              name="Half-Day"
              strokeWidth={2}
              dot={{
                r: 3
              }}
            />


            <Line
              type="monotone"
              dataKey="leave"
              name="Leave"
              strokeWidth={2}
              dot={{
                r: 3
              }}
            />


            <Line
              type="monotone"
              dataKey="absent"
              name="Absent"
              strokeWidth={2}
              dot={{
                r: 3
              }}
            />

          </LineChart>

        </ResponsiveContainer>

      )
    }

  </div>

</div>

          <div>

            <h2>
              Department Performance
            </h2>


            <p className="muted">
              Compare attendance performance
              across departments.
            </p>

          </div>

        </div>


        {
          loading ? (

            <div
              className="analytics-empty-state"
            >
              Loading department analytics...
            </div>

          ) : departments.length === 0 ? (

            <div
              className="analytics-empty-state"
            >
              No department analytics available.
            </div>

          ) : (

            <div
              className="department-table-wrapper"
            >

              <table
                className="department-analytics-table"
              >

                <thead>

                  <tr>

                    <th>
                      Department
                    </th>

                    <th>
                      Employees
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
                      Absent
                    </th>

                    <th>
                      Attendance Rate
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {
                    departments.map(
                      (department) => (

                        <tr
                          key={
                            department.department
                          }
                        >

                          <td>

                            <strong>
                              {
                                department.department
                              }
                            </strong>

                          </td>


                          <td>
                            {
                              department.employees
                            }
                          </td>


                          <td>
                            {
                              department.present
                            }
                          </td>


                          <td>
                            {
                              department.late
                            }
                          </td>


                          <td>
                            {
                              department.halfDay
                            }
                          </td>


                          <td>
                            {
                              department.leave
                            }
                          </td>


                          <td>
                            {
                              department.absent
                            }
                          </td>


                          <td>

                            <div
                              className="department-rate"
                            >

                              <strong>
                                {
                                  department.attendanceRate
                                }%
                              </strong>


                              <div
                                className="department-rate-bar"
                              >

                                <div
                                  className="department-rate-fill"
                                  style={{
                                    width:
                                      `${Math.min(
                                        Number(
                                          department.attendanceRate
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
                    )
                  }

                </tbody>

              </table>

            </div>

          )
        }

      </div>



      {/* ================================================================
          HR ACCOUNT
      ================================================================ */}

      <div
        className="analytics-account-card"
      >

        <div>

          <h2>
            HR Account
          </h2>


          <p className="muted">
            {
              user?.email
            }
          </p>

        </div>


        <div
          className="analytics-account-actions"
        >

          <Link
            to="/hr/employees"
            className="secondary-button"
            style={{
              textDecoration:
                "none"
            }}
          >
            Manage Employees
          </Link>


          <Link
            to="/hr/attendance/summary"
            className="secondary-button"
            style={{
              textDecoration:
                "none"
            }}
          >
            Employee Summary
          </Link>

        </div>

      </div>

    </div>

  );

};


export default HRDashboard;
