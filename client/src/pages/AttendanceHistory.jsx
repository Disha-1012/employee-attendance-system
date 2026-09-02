import {
  useEffect,
  useState
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3
} from "lucide-react";

import {
  getMyAttendance
} from "../services/attendanceService";

import {
  formatWorkingMinutes
} from "../utils/formatWorkingMinutes";


const AttendanceHistory =
  () => {

    const [
      attendance,
      setAttendance
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


    /*
    |--------------------------------------------------------------------------
    | Fetch Attendance
    |--------------------------------------------------------------------------
    */

    const loadHistory =
      async (
        page = 1
      ) => {

        try {

          setLoading(true);

          setError("");


          const response =
            await getMyAttendance(
              page,
              10
            );


          setAttendance(
            response.attendance
          );


          setPagination(
            response.pagination
          );

        } catch (error) {

          console.error(
            error
          );


          setError(
            error.response?.data
              ?.message ||
              "Unable to load attendance history"
          );

        } finally {

          setLoading(false);

        }

      };


    useEffect(() => {

      loadHistory(1);

    }, []);


    return (

      <div className="dashboard-page">


        <header className="dashboard-header">

          <div>

            <p className="eyebrow">
              Attendance
            </p>


            <h1>
              Attendance History
            </h1>


            <p className="muted">
              Review your previous
              attendance records.
            </p>

          </div>

        </header>


        {error && (

          <div className="error">

            {error}

          </div>

        )}


        <div className="info-card">


          <div className="history-heading">

            <div>

              <h2>
                Attendance Records
              </h2>


              <p className="muted">

                {pagination.total} total
                records

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
                Loading records...
              </p>

            </div>

          ) : attendance.length ===
            0 ? (

            <div className="attendance-empty-state">

              <Clock3
                size={35}
              />


              <h3>
                No attendance records
              </h3>


              <p>
                Your attendance
                records will appear
                here.
              </p>

            </div>

          ) : (

            <div className="attendance-table-wrapper">

              <table className="attendance-table">


                <thead>

                  <tr>

                    <th>
                      Date
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

                  {attendance.map(
                    (record) => (

                      <tr
                        key={
                          record.id
                        }
                      >


                        {/* Date */}

                        <td>

                          {
                            record.attendanceDate
                          }

                        </td>


                        {/* Check In */}

                        <td>

                          {record.status ===
                          "leave"

                            ? "Leave"

                            : record.checkIn

                              ? new Date(
                                  record.checkIn
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

                        </td>


                        {/* Check Out */}

                        <td>

                          {record.status ===
                          "leave"

                            ? "Leave"

                            : record.checkOut

                              ? new Date(
                                  record.checkOut
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

                        </td>


                        {/* Working Hours */}

                        <td>

                          {record.status ===
                          "leave"

                            ? "0h 00m"

                            : formatWorkingMinutes(
                                record.workingMinutes
                              )}

                        </td>


                        {/* Status */}

                        <td>

                          <span
                            className={`status-badge ${record.status}`}
                          >

                            {record.status
                              .replace(
                                "-",
                                " "
                              )
                              .toUpperCase()}

                          </span>

                        </td>


                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}


          {/* Pagination */}

          {pagination.totalPages >
            1 && (

            <div className="pagination">


              <button

                onClick={() =>
                  loadHistory(
                    pagination.page -
                      1
                  )
                }

                disabled={
                  pagination.page <=
                  1
                }
              >

                <ChevronLeft
                  size={18}
                />

                Previous

              </button>


              <span>

                Page{" "}

                {pagination.page}{" "}

                of{" "}

                {
                  pagination.totalPages
                }

              </span>


              <button

                onClick={() =>
                  loadHistory(
                    pagination.page +
                      1
                  )
                }

                disabled={
                  pagination.page >=
                  pagination.totalPages
                }
              >

                Next

                <ChevronRight
                  size={18}
                />

              </button>


            </div>

          )}

        </div>

      </div>

    );

  };


export default AttendanceHistory;