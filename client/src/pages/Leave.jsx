import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  XCircle,
  RefreshCw
} from "lucide-react";

import {
  useAuth
} from "../context/AuthContext";

import {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getMyLeaveBalance
} from "../services/leaveService";


/*
|--------------------------------------------------------------------------
| Calculate Leave Days
|--------------------------------------------------------------------------
*/

const calculateDays = (
  startDate,
  endDate
) => {

  if (
    !startDate ||
    !endDate
  ) {
    return 0;
  }


  const start =
    new Date(
      `${startDate}T00:00:00`
    );

  const end =
    new Date(
      `${endDate}T00:00:00`
    );


  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return 0;
  }


  if (
    end < start
  ) {
    return 0;
  }


  const difference =
    end.getTime() -
    start.getTime();


  return (
    Math.floor(
      difference /
      (1000 * 60 * 60 * 24)
    ) + 1
  );

};


/*
|--------------------------------------------------------------------------
| Format Date
|--------------------------------------------------------------------------
*/

const formatDate = (
  date
) => {

  if (!date) {
    return "-";
  }


  const parsedDate =
    new Date(
      `${date}T00:00:00`
    );


  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

};


/*
|--------------------------------------------------------------------------
| Status Badge Class
|--------------------------------------------------------------------------
*/

const getStatusClass = (
  status
) => {

  switch (status) {

    case "approved":
      return "leave-status approved";

    case "rejected":
      return "leave-status rejected";

    case "cancelled":
      return "leave-status cancelled";

    case "pending":
    default:
      return "leave-status pending";

  }

};


/*
|--------------------------------------------------------------------------
| Leave Page
|--------------------------------------------------------------------------
*/

const Leave = () => {

  const {
    user
  } = useAuth();


  /*
  |--------------------------------------------------------------------------
  | Form State
  |--------------------------------------------------------------------------
  */

  const [
    leaveType,
    setLeaveType
  ] = useState("paid");


  const [
    startDate,
    setStartDate
  ] = useState("");


  const [
    endDate,
    setEndDate
  ] = useState("");


  const [
    reason,
    setReason
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Leave Data
  |--------------------------------------------------------------------------
  */

  const [
    leaves,
    setLeaves
  ] = useState([]);


  /*
  |--------------------------------------------------------------------------
  | Leave Balance
  |--------------------------------------------------------------------------
  */

  const [
    leaveBalance,
    setLeaveBalance
  ] = useState({

    annualPaidLeave: 12,

    usedPaidLeave: 0,

    remainingPaidLeave: 12,

    usedUnpaidLeave: 0

  });


  /*
  |--------------------------------------------------------------------------
  | UI State
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    submitting,
    setSubmitting
  ] = useState(false);


  const [
    cancellingId,
    setCancellingId
  ] = useState(null);


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
  | Calculate Current Request Duration
  |--------------------------------------------------------------------------
  */

  const totalDays =
    useMemo(
      () =>
        calculateDays(
          startDate,
          endDate
        ),
      [
        startDate,
        endDate
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Calculate Pending Paid Leave
  |--------------------------------------------------------------------------
  |
  | Pending leave is NOT deducted from the official backend balance.
  |
  | However, pending paid leave must still be considered when the
  | employee tries to submit another paid leave request.
  |
  */

  const pendingPaidLeaveDays =
    useMemo(
      () => {

        return leaves
          .filter(
            (leave) =>
              leave.leaveType ===
                "paid" &&
              leave.status ===
                "pending"
          )
          .reduce(
            (
              total,
              leave
            ) =>
              total +
              Number(
                leave.totalDays || 0
              ),
            0
          );

      },
      [
        leaves
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Official Leave Balance
  |--------------------------------------------------------------------------
  */

  const paidLeaveQuota =
    Number(
      leaveBalance.annualPaidLeave || 0
    );


  const approvedPaidLeaveDays =
    Number(
      leaveBalance.usedPaidLeave || 0
    );


  const remainingPaidLeave =
    Math.max(
      Number(
        leaveBalance.remainingPaidLeave || 0
      ) -
      pendingPaidLeaveDays,
      0
    );


  /*
  |--------------------------------------------------------------------------
  | Load Leave Data
  |--------------------------------------------------------------------------
  |
  | Loads:
  | 1. Leave request history
  | 2. Official leave balance
  |
  */

  const loadLeaveData =
    async () => {

      try {

        setLoading(true);

        setError("");


        const [
          leaveResponse,
          balanceResponse
        ] = await Promise.all([

          getMyLeaves(),

          getMyLeaveBalance()

        ]);


        setLeaves(
          leaveResponse?.leaves ||
          []
        );


        setLeaveBalance(
          balanceResponse?.balance ||
          {
            annualPaidLeave: 12,
            usedPaidLeave: 0,
            remainingPaidLeave: 12,
            usedUnpaidLeave: 0
          }
        );

      } catch (err) {

        console.error(
          "Leave data error:",
          err
        );


        setError(
          err
            ?.response
            ?.data
            ?.message ||
          "Unable to load leave information."
        );

      } finally {

        setLoading(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Load Leaves When Page Opens
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    loadLeaveData();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | Submit Leave Application
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      setError("");

      setSuccess("");


      /*
      |--------------------------------------------------------------------------
      | Paid Leave Balance Check
      |--------------------------------------------------------------------------
      */

      if (
        leaveType === "paid" &&
        remainingPaidLeave === 0
      ) {

        window.alert(
          "You cannot apply for Paid Leave because your Paid Leave balance is 0."
        );

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | Basic Validation
      |--------------------------------------------------------------------------
      */

      if (
        !startDate ||
        !endDate ||
        !reason.trim()
      ) {

        setError(
          "Please fill in all leave details."
        );

        return;

      }


      if (
        totalDays <= 0
      ) {

        setError(
          "Please select a valid date range."
        );

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | Frontend Paid Leave Check
      |--------------------------------------------------------------------------
      */

      if (
        leaveType === "paid" &&
        totalDays >
          remainingPaidLeave
      ) {

        setError(
          `You have only ${remainingPaidLeave} paid leave day(s) available.`
        );

        return;

      }


      try {

        setSubmitting(true);


        const response =
          await applyLeave({

            leaveType,

            startDate,

            endDate,

            reason:
              reason.trim()

          });


        setSuccess(
          response?.message ||
          "Leave application submitted successfully."
        );


        /*
        |--------------------------------------------------------------------------
        | Reset Form
        |--------------------------------------------------------------------------
        */

        setLeaveType(
          "paid"
        );

        setStartDate("");

        setEndDate("");

        setReason("");


        /*
        |--------------------------------------------------------------------------
        | Refresh Leave History + Balance
        |--------------------------------------------------------------------------
        */

        await loadLeaveData();

      } catch (err) {

        console.error(
          "Apply leave error:",
          err
        );


        setError(
          err
            ?.response
            ?.data
            ?.message ||
          "Unable to submit leave application."
        );

      } finally {

        setSubmitting(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Cancel Leave
  |--------------------------------------------------------------------------
  */

  const handleCancel =
    async (id) => {

      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this leave request?"
        );


      if (!confirmed) {
        return;
      }


      try {

        setCancellingId(id);

        setError("");

        setSuccess("");


        const response =
          await cancelLeave(
            id
          );


        setSuccess(
          response?.message ||
          "Leave request cancelled successfully."
        );


        await loadLeaveData();

      } catch (err) {

        console.error(
          "Cancel leave error:",
          err
        );


        setError(
          err
            ?.response
            ?.data
            ?.message ||
          "Unable to cancel leave request."
        );

      } finally {

        setCancellingId(null);

      }

    };


  return (

    <div className="leave-page">


      {/* ---------------------------------------------------------------- */}
      {/* HEADER */}
      {/* ---------------------------------------------------------------- */}

      <div className="page-header">

        <div>

          <p className="eyebrow">
            Employee Portal
          </p>


          <h1>
            Leave Management
          </h1>


          <p className="muted">
            Apply for leave and track
            your requests.
          </p>

        </div>


        <button
          className="secondary-button"
          onClick={loadLeaveData}
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



      {/* ---------------------------------------------------------------- */}
      {/* ALERTS */}
      {/* ---------------------------------------------------------------- */}

      {error && (

        <div className="error-message">

          {error}

        </div>

      )}


      {success && (

        <div className="success-message">

          {success}

        </div>

      )}



      {/* ---------------------------------------------------------------- */}
      {/* LEAVE BALANCE */}
      {/* ---------------------------------------------------------------- */}

      <div className="leave-balance-grid">


        {/* Annual Paid Leave */}

        <div className="leave-balance-card">

          <div className="leave-balance-icon">

            <CalendarDays
              size={22}
            />

          </div>


          <div>

            <p>
              Annual Paid Leave
            </p>


            <strong>
              {
                leaveBalance.annualPaidLeave
              }
            </strong>


            <span>
              days
            </span>

          </div>

        </div>



        {/* Used Paid Leave */}

        <div className="leave-balance-card">

          <div className="leave-balance-icon">

            <Clock3
              size={22}
            />

          </div>


          <div>

            <p>
              Used Paid Leave
            </p>


            <strong>
              {
                leaveBalance.usedPaidLeave
              }
            </strong>


            <span>
              days
            </span>

          </div>

        </div>



        {/* Remaining Paid Leave */}

        <div className="leave-balance-card">

          <div className="leave-balance-icon">

            <CheckCircle2
              size={22}
            />

          </div>


          <div>

            <p>
              Remaining Paid Leave
            </p>


            <strong>
              {
                leaveBalance.remainingPaidLeave
              }
            </strong>


            <span>
              days
            </span>

          </div>

        </div>



        {/* Unpaid Leave */}

        <div className="leave-balance-card">

          <div className="leave-balance-icon">

            <FileText
              size={22}
            />

          </div>


          <div>

            <p>
              Unpaid Leave
            </p>


            <strong>
              {
                leaveBalance.usedUnpaidLeave
              }
            </strong>


            <span>
              days
            </span>

          </div>

        </div>

      </div>



      {/* ---------------------------------------------------------------- */}
      {/* APPLY LEAVE */}
      {/* ---------------------------------------------------------------- */}

      <div className="leave-card">

        <div className="section-heading">

          <div>

            <h2>
              Apply for Leave
            </h2>


            <p className="muted">
              Submit a new leave request
              for HR approval.
            </p>

          </div>

        </div>


        <form
          onSubmit={handleSubmit}
          className="leave-form"
        >


          {/* Leave Type */}

          <div className="form-group">

            <label>
              Leave Type
            </label>


            <select
              value={leaveType}
              onChange={(event) =>
                setLeaveType(
                  event.target.value
                )
              }
            >

              <option value="paid">
                Paid Leave
              </option>

              <option value="unpaid">
                Unpaid Leave
              </option>

            </select>

          </div>



          {/* Dates */}

          <div className="form-row">


            <div className="form-group">

              <label>
                Start Date
              </label>


              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
              />

            </div>


            <div className="form-group">

              <label>
                End Date
              </label>


              <input
                type="date"
                value={endDate}
                min={
                  startDate ||
                  undefined
                }
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
              />

            </div>

          </div>



          {/* Duration */}

          <div className="leave-duration">

            <Clock3
              size={18}
            />


            <span>
              Leave Duration:
            </span>


            <strong>
              {
                totalDays > 0
                  ? `${totalDays} day(s)`
                  : "Select dates"
              }
            </strong>

          </div>



          {/* Reason */}

          <div className="form-group">

            <label>
              Reason
            </label>


            <textarea
              rows="4"
              maxLength="500"
              placeholder="Enter the reason for your leave..."
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
            />

            <small>
              {reason.length}/500
            </small>

          </div>



          {/* Submit */}

          <button
            type="submit"
            className="primary-button"
            disabled={
              submitting ||
              loading
            }
          >

            {
              submitting
                ? "Submitting..."
                : "Apply for Leave"
            }

          </button>

        </form>

      </div>



      {/* ---------------------------------------------------------------- */}
      {/* LEAVE HISTORY */}
      {/* ---------------------------------------------------------------- */}

      <div className="leave-card">

        <div className="section-heading">

          <div>

            <h2>
              My Leave Requests
            </h2>


            <p className="muted">
              View the status of your
              submitted leave requests.
            </p>

          </div>

        </div>



        {loading ? (

          <div className="leave-empty-state">

            Loading leave requests...

          </div>

        ) : leaves.length === 0 ? (

          <div className="leave-empty-state">

            <FileText
              size={32}
            />

            <p>
              No leave requests found.
            </p>

          </div>

        ) : (

          <div className="leave-table-wrapper">

            <table className="leave-table">

              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Days
                  </th>

                  <th>
                    Reason
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {leaves.map(
                  (leave) => (

                    <tr
                      key={
                        leave._id
                      }
                    >

                      <td>

                        <div className="date-range">

                          <strong>
                            {
                              formatDate(
                                leave.startDate
                              )
                            }
                          </strong>

                          <span>
                            to
                          </span>

                          <strong>
                            {
                              formatDate(
                                leave.endDate
                              )
                            }
                          </strong>

                        </div>

                      </td>


                      <td>

                        <span className="leave-type">

                          {
                            leave.leaveType ===
                            "paid"
                              ? "Paid"
                              : "Unpaid"
                          }

                        </span>

                      </td>


                      <td>

                        <strong>
                          {
                            leave.totalDays
                          }
                        </strong>

                      </td>


                      <td>

                        <span className="reason-text">

                          {
                            leave.reason
                          }

                        </span>

                      </td>


                      <td>

                        <span
                          className={
                            getStatusClass(
                              leave.status
                            )
                          }
                        >

                          {
                            leave.status
                          }

                        </span>

                      </td>


                      <td>

                        {
                          leave.status ===
                          "pending" ? (

                            <button
                              className="danger-outline-button"
                              onClick={() =>
                                handleCancel(
                                  leave._id
                                )
                              }
                              disabled={
                                cancellingId ===
                                leave._id
                              }
                            >

                              <XCircle
                                size={16}
                              />

                              {
                                cancellingId ===
                                leave._id
                                  ? "Cancelling..."
                                  : "Cancel"
                              }

                            </button>

                          ) : (

                            <span className="muted">
                              —
                            </span>

                          )
                        }

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


export default Leave;