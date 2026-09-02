import {
  useEffect,
  useState
} from "react";

import {
  CalendarCheck,
  Clock3,
  FileText,
  CalendarDays,
  LogOut,
  ArrowRight,
  RefreshCw
} from "lucide-react";

import {
  Link
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";

import {
  getTodayAttendance
} from "../services/attendanceService";

import {
  formatWorkingMinutes
} from "../utils/formatWorkingMinutes";

import useLiveWorkingMinutes
  from "../utils/useLiveWorkingMinutes";


const EmployeeDashboard =
  () => {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    const {
      user,
      logout
    } = useAuth();


    /*
    |--------------------------------------------------------------------------
    | Attendance State
    |--------------------------------------------------------------------------
    */

    const [
      attendance,
      setAttendance
    ] = useState(null);


    const [
      attendanceLoading,
      setAttendanceLoading
    ] = useState(true);


    const [
      attendanceError,
      setAttendanceError
    ] = useState("");

    /*
    |--------------------------------------------------------------------------
    | Live Working Minutes
    |--------------------------------------------------------------------------
    |
    | This value continuously updates while the employee is checked in.
    |
    */

    const liveWorkingMinutes =
      useLiveWorkingMinutes(
        attendance?.checkIn,
        attendance?.checkOut,
        attendance?.workingMinutes
      );


    /*
    |--------------------------------------------------------------------------
    | Fetch Today's Attendance
    |--------------------------------------------------------------------------
    |
    | This gets the employee's attendance record from:
    |
    | GET /api/attendance/today
    |
    */

    const loadTodayAttendance =
      async () => {

        try {

          setAttendanceLoading(
            true
          );

          setAttendanceError(
            ""
          );


          const response =
            await getTodayAttendance();


          /*
          |--------------------------------------------------------------------------
          | Store Attendance
          |--------------------------------------------------------------------------
          |
          | If the employee has not checked in:
          |
          | response.attendance = null
          |
          | If the employee has checked in:
          |
          | response.attendance = {...}
          |
          */

          setAttendance(
            response.attendance
          );

        } catch (error) {

          console.error(
            "Employee dashboard attendance error:",
            error
          );


          setAttendanceError(
            error.response?.data
              ?.message ||
            "Unable to load attendance"
          );

        } finally {

          setAttendanceLoading(
            false
          );

        }

      };


    /*
    |--------------------------------------------------------------------------
    | Load Attendance When Dashboard Opens
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

      loadTodayAttendance();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Determine Attendance Status For Dashboard
    |--------------------------------------------------------------------------
    */

    const getDisplayStatus =
      () => {

        /*
        |--------------------------------------------------------------------------
        | No Attendance Record
        |--------------------------------------------------------------------------
        */

        if (!attendance) {

          return "Not Checked In";

        }


        /*
        |--------------------------------------------------------------------------
        | Checked In But Not Checked Out
        |--------------------------------------------------------------------------
        */

        if (
          attendance.checkIn &&
          !attendance.checkOut
        ) {

          return "Checked In";

        }


        /*
        |--------------------------------------------------------------------------
        | Checked Out
        |--------------------------------------------------------------------------
        |
        | Backend status can be:
        |
        | present
        | late
        | half-day
        |
        */

        return attendance.status
          ?.replace(
            "-",
            " "
          )
          .toUpperCase() ||
          "COMPLETED";

      };


    /*
    |--------------------------------------------------------------------------
    | Get Working Minutes
    |--------------------------------------------------------------------------
    */

    const getWorkingMinutes =
    () => {

      if (!attendance) {

        return 0;

      }


      return liveWorkingMinutes;

    };


    /*
    |--------------------------------------------------------------------------
    | Refresh Attendance
    |--------------------------------------------------------------------------
    */

    const handleRefreshAttendance =
      async () => {

        await loadTodayAttendance();

      };


    return (

      <div className="dashboard-page">


        {/* ---------------------------------------------------------------- */}
        {/* Dashboard Header */}
        {/* ---------------------------------------------------------------- */}

        <header className="dashboard-header">

          <div>

            <p className="eyebrow">
              Employee Portal
            </p>


            <h1>
              Welcome,{" "}
              {user?.name}
            </h1>


            <p className="muted">

              {user?.designation}
              {" · "}
              {user?.department}

            </p>

          </div>


          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >

            {/* ------------------------------------------------------------ */}
            {/* Refresh Attendance */}
            {/* ------------------------------------------------------------ */}

            <button
              className="logout-button"
              onClick={
                handleRefreshAttendance
              }
              disabled={
                attendanceLoading
              }
              title="Refresh attendance"
            >

              <RefreshCw
                size={17}
              />

              Refresh

            </button>


            {/* ------------------------------------------------------------ */}
            {/* Logout */}
            {/* ------------------------------------------------------------ */}

            <button
              className="logout-button"
              onClick={logout}
            >

              <LogOut
                size={18}
              />

              Logout

            </button>

          </div>

        </header>


        {/* ---------------------------------------------------------------- */}
        {/* Attendance Error */}
        {/* ---------------------------------------------------------------- */}

        {attendanceError && (

          <div className="error">

            {attendanceError}

          </div>

        )}


        {/* ---------------------------------------------------------------- */}
        {/* Dashboard Statistics */}
        {/* ---------------------------------------------------------------- */}

        <div className="dashboard-grid">


          {/* ============================================================ */}
          {/* Today's Status */}
          {/* ============================================================ */}

          <div className="stat-card">

            <div className="stat-icon">

              <CalendarCheck />

            </div>


            <h3>
              Today's Status
            </h3>


            <strong>

              {attendanceLoading
                ? "Loading..."
                : getDisplayStatus()}

            </strong>

          </div>


          {/* ============================================================ */}
          {/* Working Hours */}
          {/* ============================================================ */}

          <div className="stat-card">

            <div className="stat-icon">

              <Clock3 />

            </div>


            <h3>
              Working Hours
            </h3>


            <strong>

              {attendanceLoading
                ? "Loading..."
                : formatWorkingMinutes(
                    getWorkingMinutes()
                  )}

            </strong>

          </div>


          {/* ============================================================ */}
          {/* Leave Balance */}
          {/* ============================================================ */}

          <div className="stat-card">

            <div className="stat-icon">

              <FileText />

            </div>


            <h3>
              Leave Balance
            </h3>


            <strong>

              {user?.paidLeaveQuota ??
                0}{" "}
              days

            </strong>

          </div>

        </div>


        {/* ---------------------------------------------------------------- */}
        {/* Account Information */}
        {/* ---------------------------------------------------------------- */}

        <div className="info-card">

          <h2>
            Account Information
          </h2>


          <div className="profile-grid">


            <div>

              <span>
                Employee ID
              </span>


              <strong>
                {user?.employeeId}
              </strong>

            </div>


            <div>

              <span>
                Email
              </span>


              <strong>
                {user?.email}
              </strong>

            </div>


            <div>

              <span>
                Department
              </span>


              <strong>
                {user?.department}
              </strong>

            </div>


            <div>

              <span>
                Designation
              </span>


              <strong>
                {user?.designation}
              </strong>

            </div>

          </div>

        </div>


        {/* ---------------------------------------------------------------- */}
        {/* Attendance Navigation */}
        {/* ---------------------------------------------------------------- */}

        <div
          className="info-card attendance-link-card"
        >

          <div>

            <h2>
              Attendance
            </h2>


            <p className="muted">

              Check in, check out and
              view your daily attendance.

            </p>

          </div>


          <Link
            to="/employee/attendance"
            className="attendance-page-link"
          >

            Manage Attendance


            <ArrowRight
              size={18}
            />

          </Link>

        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Leave Management Navigation */}
        {/* ---------------------------------------------------------------- */}

        <div
          className="info-card attendance-link-card"
        >
          <div>

            <h2>
              Leave Management
            </h2>

            <p className="muted">

              Apply for leave and
              view your leave requests.

            </p>

          </div>

          <Link
            to="/employee/leave"
            className="attendance-page-link"
          >

            Manage Leave

            <CalendarDays
              size={18}
            />

          </Link>

        </div>


      </div>

    );

  };


export default EmployeeDashboard;
