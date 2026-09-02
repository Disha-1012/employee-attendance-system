import {
  useEffect,
  useState
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Users,
  XCircle
} from "lucide-react";

import {
  getAllLeaves,
  getLeaveSummary,
  approveLeave,
  rejectLeave
} from "../services/leaveService";


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


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return date;
  }


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
| Format Date + Time
|--------------------------------------------------------------------------
*/

const formatDateTime = (
  date
) => {

  if (!date) {
    return "-";
  }


  const parsedDate =
    new Date(date);


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "-";
  }


  return parsedDate.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

};


/*
|--------------------------------------------------------------------------
| Status Class
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
| Leave Management
|--------------------------------------------------------------------------
*/

const LeaveManagement = () => {

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
  | Summary
  |--------------------------------------------------------------------------
  */

  const [
    summary,
    setSummary
  ] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0
  });


  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const [
    statusFilter,
    setStatusFilter
  ] = useState("all");


  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const [
    page,
    setPage
  ] = useState(1);


  const [
    pagination,
    setPagination
  ] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });


  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    actionLoading,
    setActionLoading
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | Messages
  |--------------------------------------------------------------------------
  */

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
  | Reject Modal
  |--------------------------------------------------------------------------
  */

  const [
    rejectModalOpen,
    setRejectModalOpen
  ] = useState(false);


  const [
    selectedLeave,
    setSelectedLeave
  ] = useState(null);


  const [
    rejectionReason,
    setRejectionReason
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Fetch Leave Requests
  |--------------------------------------------------------------------------
  */

  const fetchLeaves =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await getAllLeaves({
            status:
              statusFilter === "all"
                ? undefined
                : statusFilter,

            page,

            limit: 10
          });


        setLeaves(
          response?.leaves || []
        );


        setPagination(
          response?.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        );

      } catch (err) {

        console.error(
          "Get HR leaves error:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to load leave requests."
        );

      } finally {

        setLoading(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Fetch Summary
  |--------------------------------------------------------------------------
  */

  const fetchSummary =
    async () => {

      try {

        const response =
          await getLeaveSummary();


        setSummary(
          response?.summary || {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0
          }
        );

      } catch (err) {

        console.error(
          "Get leave summary error:",
          err
        );

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Fetch Everything
  |--------------------------------------------------------------------------
  */

  const fetchData =
    async () => {

      setError("");

      await Promise.all([
        fetchLeaves(),
        fetchSummary()
      ]);

    };


  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    fetchLeaves();

  }, [
    page,
    statusFilter
  ]);


  useEffect(() => {

    fetchSummary();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | Change Status Filter
  |--------------------------------------------------------------------------
  */

  const handleStatusFilterChange =
    (event) => {

      setStatusFilter(
        event.target.value
      );

      setPage(1);

    };


  /*
  |--------------------------------------------------------------------------
  | Approve Leave
  |--------------------------------------------------------------------------
  */

  const handleApprove =
    async (
      id
    ) => {

      const confirmed =
        window.confirm(
          "Are you sure you want to approve this leave request?"
        );


      if (!confirmed) {
        return;
      }


      try {

        setActionLoading(id);

        setError("");
        setSuccess("");


        const response =
          await approveLeave(id);


        setSuccess(
          response?.message ||
          "Leave request approved successfully."
        );


        await Promise.all([
          fetchLeaves(),
          fetchSummary()
        ]);

      } catch (err) {

        console.error(
          "Approve leave error:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to approve leave request."
        );

      } finally {

        setActionLoading(null);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Open Reject Modal
  |--------------------------------------------------------------------------
  */

  const openRejectModal =
    (leave) => {

      setSelectedLeave(
        leave
      );

      setRejectionReason("");

      setError("");

      setSuccess("");

      setRejectModalOpen(
        true
      );

    };


  /*
  |--------------------------------------------------------------------------
  | Close Reject Modal
  |--------------------------------------------------------------------------
  */

  const closeRejectModal =
    () => {

      if (actionLoading) {
        return;
      }


      setRejectModalOpen(
        false
      );

      setSelectedLeave(
        null
      );

      setRejectionReason("");

    };


  /*
  |--------------------------------------------------------------------------
  | Submit Rejection
  |--------------------------------------------------------------------------
  */

  const handleReject =
    async (
      event
    ) => {

      event.preventDefault();


      if (
        !selectedLeave
      ) {
        return;
      }


      if (
        !rejectionReason.trim()
      ) {

        setError(
          "Please enter a rejection reason."
        );

        return;

      }


      try {

        setActionLoading(
          selectedLeave._id
        );

        setError("");
        setSuccess("");


        const response =
          await rejectLeave(
            selectedLeave._id,
            rejectionReason.trim()
          );


        setSuccess(
          response?.message ||
          "Leave request rejected successfully."
        );


        closeRejectModal();


        await Promise.all([
          fetchLeaves(),
          fetchSummary()
        ]);

      } catch (err) {

        console.error(
          "Reject leave error:",
          err
        );


        setError(
          err?.response?.data?.message ||
          "Unable to reject leave request."
        );

      } finally {

        setActionLoading(
          null
        );

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
            HR Portal
          </p>

          <h1>
            Leave Management
          </h1>

          <p className="muted">
            Review and manage employee
            leave requests.
          </p>

        </div>


        <button
          className="secondary-button"
          onClick={fetchData}
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
      {/* SUMMARY */}
      {/* ---------------------------------------------------------------- */}

      <div className="leave-summary-grid">


        {/* Total */}

        <div className="leave-summary-card">

          <div className="leave-summary-icon">

            <FileText />

          </div>


          <div>

            <p>
              Total Requests
            </p>

            <strong>
              {summary.total}
            </strong>

            <span>
              all leave requests
            </span>

          </div>

        </div>


        {/* Pending */}

        <div className="leave-summary-card">

          <div className="leave-summary-icon">

            <Clock3 />

          </div>


          <div>

            <p>
              Pending
            </p>

            <strong>
              {summary.pending}
            </strong>

            <span>
              awaiting review
            </span>

          </div>

        </div>


        {/* Approved */}

        <div className="leave-summary-card">

          <div className="leave-summary-icon">

            <CheckCircle2 />

          </div>


          <div>

            <p>
              Approved
            </p>

            <strong>
              {summary.approved}
            </strong>

            <span>
              approved requests
            </span>

          </div>

        </div>


        {/* Rejected */}

        <div className="leave-summary-card">

          <div className="leave-summary-icon">

            <XCircle />

          </div>


          <div>

            <p>
              Rejected
            </p>

            <strong>
              {summary.rejected}
            </strong>

            <span>
              rejected requests
            </span>

          </div>

        </div>

      </div>


      {/* ---------------------------------------------------------------- */}
      {/* FILTERS */}
      {/* ---------------------------------------------------------------- */}

      <div className="leave-card">

        <div className="section-heading">

          <div>

            <h2>
              Leave Requests
            </h2>

            <p className="muted">
              Review employee leave
              applications and take action.
            </p>

          </div>


          <div className="leave-filter">

            <label>
              Filter by Status
            </label>

            <select
              value={statusFilter}
              onChange={
                handleStatusFilterChange
              }
            >

              <option value="all">
                All Requests
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
              </option>

              <option value="cancelled">
                Cancelled
              </option>

            </select>

          </div>

        </div>


        {/* ---------------------------------------------------------------- */}
        {/* TABLE */}
        {/* ---------------------------------------------------------------- */}

        {loading ? (

          <div className="empty-state">

            Loading leave requests...

          </div>

        ) : leaves.length === 0 ? (

          <div className="empty-state">

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
                    Employee
                  </th>

                  <th>
                    Leave Dates
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
                    Submitted
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


                      {/* Employee */}

                      <td>

                        <div className="employee-leave-info">

                          <strong>

                            {
                              leave.employee
                                ?.name ||
                              "Unknown Employee"
                            }

                          </strong>

                          <span>

                            {
                              leave.employee
                                ?.employeeId ||
                              leave.employeeId ||
                              "-"
                            }

                          </span>

                          <small>

                            {
                              leave.employee
                                ?.email ||
                              "-"
                            }

                          </small>

                        </div>

                      </td>


                      {/* Dates */}

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


                      {/* Type */}

                      <td>

                        <span className="leave-type">

                          {leave.leaveType ===
                          "paid"
                            ? "Paid"
                            : "Unpaid"}

                        </span>

                      </td>


                      {/* Days */}

                      <td>

                        <strong>
                          {
                            leave.totalDays
                          }
                        </strong>

                      </td>


                      {/* Reason */}

                      <td>

                        <span className="reason-text">

                          {
                            leave.reason
                          }

                        </span>

                        {leave.status ===
                          "rejected" &&
                          leave.rejectionReason && (

                            <div className="rejection-reason">

                              <strong>
                                Rejection:
                              </strong>

                              <span>
                                {
                                  leave.rejectionReason
                                }
                              </span>

                            </div>

                          )}

                      </td>


                      {/* Status */}

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


                      {/* Submitted */}

                      <td>

                        <span className="submitted-date">

                          {
                            formatDateTime(
                              leave.createdAt
                            )
                          }

                        </span>

                      </td>


                      {/* Action */}

                      <td>

                        {leave.status ===
                        "pending" ? (

                          <div className="leave-action-buttons">

                            <button
                              className="approve-leave-button"
                              onClick={() =>
                                handleApprove(
                                  leave._id
                                )
                              }
                              disabled={
                                actionLoading ===
                                leave._id
                              }
                            >

                              <CheckCircle2
                                size={15}
                              />

                              {actionLoading ===
                              leave._id
                                ? "Processing..."
                                : "Approve"}

                            </button>


                            <button
                              className="reject-leave-button"
                              onClick={() =>
                                openRejectModal(
                                  leave
                                )
                              }
                              disabled={
                                actionLoading ===
                                leave._id
                              }
                            >

                              <XCircle
                                size={15}
                              />

                              Reject

                            </button>

                          </div>

                        ) : (

                          <span className="muted">
                            —
                          </span>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}


        {/* ---------------------------------------------------------------- */}
        {/* PAGINATION */}
        {/* ---------------------------------------------------------------- */}

        {!loading &&
          pagination.totalPages > 0 && (

            <div className="leave-pagination">

              <button
                className="secondary-button"
                onClick={() =>
                  setPage(
                    (currentPage) =>
                      Math.max(
                        currentPage - 1,
                        1
                      )
                  )
                }
                disabled={
                  page <= 1
                }
              >
                Previous
              </button>


              <span>

                Page{" "}
                <strong>
                  {pagination.page}
                </strong>{" "}
                of{" "}
                <strong>
                  {pagination.totalPages}
                </strong>

              </span>


              <button
                className="secondary-button"
                onClick={() =>
                  setPage(
                    (currentPage) =>
                      Math.min(
                        currentPage + 1,
                        pagination.totalPages
                      )
                  )
                }
                disabled={
                  page >=
                  pagination.totalPages
                }
              >
                Next
              </button>

            </div>

          )}

      </div>


      {/* ---------------------------------------------------------------- */}
      {/* REJECT MODAL */}
      {/* ---------------------------------------------------------------- */}

      {rejectModalOpen && (

        <div
          className="leave-modal-overlay"
          onClick={
            closeRejectModal
          }
        >

          <div
            className="leave-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="leave-modal-header">

              <div>

                <p className="eyebrow">
                  HR Action
                </p>

                <h2>
                  Reject Leave Request
                </h2>

              </div>


              <button
                className="modal-close-button"
                onClick={
                  closeRejectModal
                }
                disabled={
                  Boolean(
                    actionLoading
                  )
                }
              >

                <XCircle
                  size={20}
                />

              </button>

            </div>


            {selectedLeave && (

              <div className="reject-leave-details">

                <p>

                  <strong>
                    Employee:
                  </strong>{" "}

                  {
                    selectedLeave
                      .employee
                      ?.name ||
                    "Unknown Employee"
                  }

                </p>


                <p>

                  <strong>
                    Leave:
                  </strong>{" "}

                  {
                    formatDate(
                      selectedLeave.startDate
                    )
                  }

                  {" to "}

                  {
                    formatDate(
                      selectedLeave.endDate
                    )
                  }

                </p>

              </div>

            )}


            <form
              onSubmit={
                handleReject
              }
            >

              <div className="form-group">

                <label>
                  Rejection Reason
                </label>

                <textarea
                  rows="5"
                  maxLength="500"
                  placeholder="Enter the reason for rejecting this leave request..."
                  value={
                    rejectionReason
                  }
                  onChange={(event) =>
                    setRejectionReason(
                      event.target.value
                    )
                  }
                  autoFocus
                />

                <small>
                  {
                    rejectionReason.length
                  }/500
                </small>

              </div>


              <div className="leave-modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeRejectModal
                  }
                  disabled={
                    Boolean(
                      actionLoading
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="reject-leave-button"
                  disabled={
                    !rejectionReason.trim() ||
                    Boolean(
                      actionLoading
                    )
                  }
                >

                  <XCircle
                    size={17}
                  />

                  {actionLoading
                    ? "Rejecting..."
                    : "Reject Leave"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

};


export default LeaveManagement;