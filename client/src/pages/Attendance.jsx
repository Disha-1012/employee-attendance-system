import {
  useEffect,
  useState
} from "react";


import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw
} from "lucide-react";


import {
  Link
} from "react-router-dom";


import {
  checkIn,
  checkOut,
  getTodayAttendance
} from "../services/attendanceService";


import {
  formatWorkingMinutes
} from "../utils/formatWorkingMinutes";


const Attendance = () => {

  const [
    attendance,
    setAttendance
  ] = useState(null);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    actionLoading,
    setActionLoading
  ] = useState(false);


  const [
    error,
    setError
  ] = useState("");


  const [
    success,
    setSuccess
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Fetch Today's Attendance
  |--------------------------------------------------------------------------
  */

  const loadAttendance =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await getTodayAttendance();


        setAttendance(
          response.attendance
        );

      } catch (
        error
      ) {

        console.error(
          error
        );


        setError(
          error.response?.data
            ?.message ||
            "Unable to load attendance"
        );

      } finally {

        setLoading(false);

      }

    };


  useEffect(
    () => {

      loadAttendance();

    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | Check In
  |--------------------------------------------------------------------------
  */

  const handleCheckIn =
    async () => {

      try {

        setActionLoading(true);

        setError("");

        setSuccess("");


        const response =
          await checkIn();


        setAttendance(
          response.attendance
        );


        setSuccess(
          "You have successfully checked in."
        );

      } catch (
        error
      ) {

        setError(
          error.response?.data
            ?.message ||
            "Unable to check in"
        );

      } finally {

        setActionLoading(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Check Out
  |--------------------------------------------------------------------------
  */

  const handleCheckOut =
    async () => {

      try {

        setActionLoading(true);

        setError("");

        setSuccess("");


        const response =
          await checkOut();


        setAttendance(
          response.attendance
        );


        setSuccess(
          "You have successfully checked out."
        );

      } catch (
        error
      ) {

        setError(
          error.response?.data
            ?.message ||
            "Unable to check out"
        );

      } finally {

        setActionLoading(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (
    loading
  ) {

    return (

      <div className="page-loader">

        <div className="loader" />

        <p>
          Loading attendance...
        </p>

      </div>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | Determine State
  |--------------------------------------------------------------------------
  */

  const isOnLeave =
    attendance?.status ===
    "leave";


  const hasCheckedIn =
    Boolean(
      attendance &&
      !isOnLeave
    );


  const hasCheckedOut =
    Boolean(
      attendance?.checkOut
    );


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (

    <div className="dashboard-page">


      {/* ---------------------------------------------------------------- */}
      {/* HEADER */}
      {/* ---------------------------------------------------------------- */}

      <header className="dashboard-header">

        <div>

          <p className="eyebrow">
            Attendance
          </p>


          <h1>
            Today's Attendance
          </h1>


          <p className="muted">
            Track your daily
            attendance and working
            hours.
          </p>

        </div>


        <button
          className="logout-button"
          onClick={
            loadAttendance
          }
          disabled={
            actionLoading
          }
        >

          <RefreshCw
            size={17}
          />

          Refresh

        </button>

      </header>


      {/* ---------------------------------------------------------------- */}
      {/* ALERTS */}
      {/* ---------------------------------------------------------------- */}

      {error && (

        <div className="error">
          {error}
        </div>

      )}


      {success && (

        <div className="success">
          {success}
        </div>

      )}


      {/* ---------------------------------------------------------------- */}
      {/* LEAVE STATE */}
      {/* ---------------------------------------------------------------- */}

      {isOnLeave ? (

        <div className="attendance-main-card">

          <div className="attendance-status-icon">

            <CalendarDays
              size={32}
            />

          </div>


          <h2>
            You are on Leave
          </h2>


          <p className="muted">

            You have an approved
            {attendance.leaveType ===
            "paid"
              ? " paid "
              : " unpaid "}
            leave for today.

          </p>


          <div className="attendance-actions">

            <div className="completed-badge">

              ✓ Approved Leave

            </div>

          </div>

        </div>

      ) : (

        <div className="attendance-main-card">

          <div className="attendance-status-icon">

            <CalendarCheck
              size={32}
            />

          </div>


          <h2>

            {attendance
              ? "Attendance Recorded"
              : "You haven't checked in yet"}

          </h2>


          <p className="muted">

            {attendance
              ? attendance.attendanceDate
              : "Start your workday by checking in."}

          </p>


          <div className="attendance-actions">

            {!hasCheckedIn && !isOnLeave && (

              <button
                className="attendance-button check-in"
                onClick={
                  handleCheckIn
                }
                disabled={
                  actionLoading
                }
              >

                <LogIn
                  size={19}
                />


                {actionLoading
                  ? "Checking in..."
                  : "Check In"}

              </button>

            )}


            {hasCheckedIn &&
              !hasCheckedOut && (

                <button
                  className="attendance-button check-out"
                  onClick={
                    handleCheckOut
                  }
                  disabled={
                    actionLoading
                  }
                >

                  <LogOut
                    size={19}
                  />


                  {actionLoading
                    ? "Checking out..."
                    : "Check Out"}

                </button>

              )}


            {hasCheckedOut && (

              <div className="completed-badge">

                ✓ Attendance
                completed

              </div>

            )}

          </div>

        </div>

      )}


      {/* ---------------------------------------------------------------- */}
      {/* ATTENDANCE / LEAVE DETAILS */}
      {/* ---------------------------------------------------------------- */}

      {attendance && (

        <div className="dashboard-grid">


          {/* Check In */}

          <div className="stat-card">

            <div className="stat-icon">

              <LogIn />

            </div>


            <h3>
              Check In
            </h3>


            <strong>

              {isOnLeave
                ? "Leave"
                : attendance.checkIn
                  ? new Date(
                      attendance.checkIn
                    ).toLocaleTimeString(
                      "en-IN",
                      {
                        hour:
                          "2-digit",
                        minute:
                          "2-digit"
                      }
                    )
                  : "--:--"}

            </strong>

          </div>


          {/* Check Out */}

          <div className="stat-card">

            <div className="stat-icon">

              <LogOut />

            </div>


            <h3>
              Check Out
            </h3>


            <strong>

              {isOnLeave
                ? "Leave"
                : attendance.checkOut
                  ? new Date(
                      attendance.checkOut
                    ).toLocaleTimeString(
                      "en-IN",
                      {
                        hour:
                          "2-digit",
                        minute:
                          "2-digit"
                      }
                    )
                  : "--:--"}

            </strong>

          </div>


          {/* Working Hours */}

          <div className="stat-card">

            <div className="stat-icon">

              <Clock3 />

            </div>


            <h3>
              Working Hours
            </h3>


            <strong>

              {isOnLeave
                ? "0h 00m"
                : formatWorkingMinutes(
                    attendance.workingMinutes
                  )}

            </strong>

          </div>

        </div>

      )}


      {/* ---------------------------------------------------------------- */}
      {/* STATUS */}
      {/* ---------------------------------------------------------------- */}

      {attendance && (

        <div className="info-card">

          <h2>

            {isOnLeave
              ? "Leave Status"
              : "Attendance Status"}

          </h2>


          <div className="attendance-detail-row">

            <span>
              Current Status
            </span>


            <span
              className={`status-badge ${
                attendance.status
              }`}
            >

              {attendance.status
                ?.replace(
                  "-",
                  " "
                )
                .toUpperCase()}

            </span>

          </div>


          <div className="attendance-detail-row">

            <span>
              Date
            </span>


            <strong>
              {
                attendance.attendanceDate
              }
            </strong>

          </div>


          {isOnLeave &&
            attendance.remarks && (

              <div className="attendance-detail-row">

                <span>
                  Reason
                </span>


                <strong>
                  {attendance.remarks}
                </strong>

              </div>

            )}

        </div>

      )}


      {/* ---------------------------------------------------------------- */}
      {/* HISTORY LINK */}
      {/* ---------------------------------------------------------------- */}

      <div
        className="attendance-history-link"
      >

        <Link
          to="/employee/attendance/history"
        >

          View Attendance History →

        </Link>

      </div>


    </div>

  );

};


export default Attendance;
