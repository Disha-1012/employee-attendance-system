import {
  useEffect,
  useState
} from "react";

import {
  Search,
  Users,
  UserCheck,
  UserX,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";

import {
  getEmployees,
  updateEmployeeStatus
} from "../services/employeeService";


const Employees = () => {

  /*
  |--------------------------------------------------------------------------
  | Employees
  |--------------------------------------------------------------------------
  */

  const [
    employees,
    setEmployees
  ] = useState([]);


  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  const [
    error,
    setError
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Success
  |--------------------------------------------------------------------------
  */

  const [
    success,
    setSuccess
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Department
  |--------------------------------------------------------------------------
  */

  const [
    department,
    setDepartment
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Status
  |--------------------------------------------------------------------------
  */

  const [
    status,
    setStatus
  ] = useState("all");


  /*
  |--------------------------------------------------------------------------
  | Load Employees
  |--------------------------------------------------------------------------
  */

  const loadEmployees =
    async (
      page = 1
    ) => {

      try {

        setLoading(true);

        setError("");

        const response =
          await getEmployees({
            search,
            department,
            status,
            page,
            limit: 10
          });


        setEmployees(
          response.employees
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
          "Unable to load employees"
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

    loadEmployees(1);

  }, []);


  /*
  |--------------------------------------------------------------------------
  | Search / Filter Handler
  |--------------------------------------------------------------------------
  */

  const handleFilter =
    () => {

      loadEmployees(1);

    };


  /*
  |--------------------------------------------------------------------------
  | Reset Filters
  |--------------------------------------------------------------------------
  */

  const handleReset =
    () => {

      setSearch("");

      setDepartment("");

      setStatus("all");

      setTimeout(() => {

        loadEmployees(1);

      }, 0);

    };


  /*
  |--------------------------------------------------------------------------
  | Activate / Deactivate
  |--------------------------------------------------------------------------
  */

  const handleStatusChange =
    async (
      employee
    ) => {

      const action =
        employee.isActive
          ? "deactivate"
          : "activate";


      const confirmed =
        window.confirm(
          `Are you sure you want to ${action} ${employee.name}?`
        );


      if (!confirmed) {

        return;

      }


      try {

        setError("");

        setSuccess("");


        await updateEmployeeStatus(
          employee._id,
          !employee.isActive
        );


        setSuccess(
          employee.isActive
            ? `${employee.name} has been deactivated.`
            : `${employee.name} has been activated.`
        );


        await loadEmployees(
          pagination.page
        );

      } catch (error) {

        console.error(
          error
        );

        setError(
          error.response?.data
            ?.message ||
          "Unable to update employee status"
        );

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (

    <div className="dashboard-page">


      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}

      <header className="dashboard-header">

        <div>

          <p className="eyebrow">
            HR Management
          </p>

          <h1>
            Employees
          </h1>

          <p className="muted">
            Manage employee accounts,
            departments and access status.
          </p>

        </div>


        <button
          className="logout-button"
          onClick={() =>
            loadEmployees(
              pagination.page
            )
          }
          disabled={loading}
        >

          <RefreshCw
            size={17}
          />

          Refresh

        </button>

      </header>


      {/* ---------------------------------------------------------------- */}
      {/* Messages */}
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
      {/* Statistics */}
      {/* ---------------------------------------------------------------- */}

      <div className="dashboard-grid">


        <div className="stat-card">

          <div className="stat-icon">

            <Users />

          </div>

          <h3>
            Total Employees
          </h3>

          <strong>
            {pagination.total}
          </strong>

        </div>


        <div className="stat-card">

          <div className="stat-icon">

            <UserCheck />

          </div>

          <h3>
            Active Employees
          </h3>

          <strong>

            {employees.filter(
              employee =>
                employee.isActive
            ).length}

          </strong>

        </div>


        <div className="stat-card">

          <div className="stat-icon">

            <UserX />

          </div>

          <h3>
            Inactive Employees
          </h3>

          <strong>

            {employees.filter(
              employee =>
                !employee.isActive
            ).length}

          </strong>

        </div>

      </div>


      {/* ---------------------------------------------------------------- */}
      {/* Filters */}
      {/* ---------------------------------------------------------------- */}

      <div className="info-card employee-filters">

        <div className="employee-search">

          <Search
            size={18}
          />

          <input
            type="text"
            placeholder="Search name, email or employee ID..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            onKeyDown={(event) => {

              if (
                event.key ===
                "Enter"
              ) {

                handleFilter();

              }

            }}
          />

        </div>


        <select
          value={department}
          onChange={(event) =>
            setDepartment(
              event.target.value
            )
          }
        >

          <option value="">
            All Departments
          </option>

          <option value="Information Technology">
            Information Technology
          </option>

          <option value="Human Resources">
            Human Resources
          </option>

          <option value="Finance">
            Finance
          </option>

          <option value="Marketing">
            Marketing
          </option>

          <option value="Sales">
            Sales
          </option>

        </select>


        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
        >

          <option value="all">
            All Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>

        </select>


        <button
          className="primary-button"
          onClick={
            handleFilter
          }
        >
          Apply
        </button>


        <button
          className="secondary-button"
          onClick={
            handleReset
          }
        >
          Reset
        </button>

      </div>


      {/* ---------------------------------------------------------------- */}
      {/* Employee Table */}
      {/* ---------------------------------------------------------------- */}

      <div className="info-card">

        <div className="employee-table-wrapper">

          {loading ? (

            <div className="table-loader">

              <div className="loader" />

              <p>
                Loading employees...
              </p>

            </div>

          ) : employees.length === 0 ? (

            <div className="empty-state">

              <Users
                size={40}
              />

              <h3>
                No employees found
              </h3>

              <p>
                Try changing your
                search or filters.
              </p>

            </div>

          ) : (

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
                    Designation
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

                {employees.map(
                  employee => (

                    <tr
                      key={
                        employee._id
                      }
                    >

                      <td>

                        <div className="employee-name-cell">

                          <div className="employee-avatar">

                            {employee.name
                              ?.charAt(0)
                              ?.toUpperCase()}

                          </div>


                          <div>

                            <strong>
                              {
                                employee.name
                              }
                            </strong>

                            <span>
                              {
                                employee.email
                              }
                            </span>

                          </div>

                        </div>

                      </td>


                      <td>
                        {
                          employee.employeeId
                        }
                      </td>


                      <td>
                        {
                          employee.department ||
                          "—"
                        }
                      </td>


                      <td>
                        {
                          employee.designation ||
                          "—"
                        }
                      </td>


                      <td>

                        <span
                          className={
                            employee.isActive
                              ? "status-badge present"
                              : "status-badge absent"
                          }
                        >

                          {employee.isActive
                            ? "ACTIVE"
                            : "INACTIVE"}

                        </span>

                      </td>


                      <td>

                        <div className="employee-actions">

                          <button
                            className={
                              employee.isActive
                                ? "danger-action"
                                : "success-action"
                            }
                            onClick={() =>
                              handleStatusChange(
                                employee
                              )
                            }
                          >

                            {employee.isActive
                              ? "Deactivate"
                              : "Activate"}

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>


        {/* ---------------------------------------------------------------- */}
        {/* Pagination */}
        {/* ---------------------------------------------------------------- */}

        {pagination.totalPages >
          1 && (

          <div className="pagination">

            <button
              onClick={() =>
                loadEmployees(
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
              {
                pagination.page
              }{" "}

              of{" "}

              {
                pagination.totalPages
              }

            </span>


            <button
              onClick={() =>
                loadEmployees(
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


export default Employees;