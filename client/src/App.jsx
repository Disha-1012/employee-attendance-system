import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import {
  AuthProvider
} from "./context/AuthContext";

import ProtectedRoute from
  "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

import EmployeeDashboard from
  "./pages/EmployeeDashboard";

import HRDashboard from
  "./pages/HRDashboard";

import Attendance from "./pages/Attendance";

import AttendanceHistory from
  "./pages/AttendanceHistory";

import Employees from
  "./pages/Employees";

import Leave from "./pages/Leave";

import LeaveManagement from "./pages/LeaveManagement";

import HRAttendance from "./pages/HRAttendance";

import EmployeeAttendanceSummary from "./pages/EmployeeAttendanceSummary";

import MonthlyAttendanceReport
  from "./pages/MonthlyAttendanceReport";

import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* Public Routes */}

          <Route
            path="/login"
            element={
              <Login />
            }
          />

          <Route
            path="/register"
            element={
              <Register />
            }
          />

          {/* Employee Routes */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "employee"
                ]}
              />
            }
          >

            <Route
              path="/employee"
              element={
                <EmployeeDashboard />
              }
            />

            <Route
              path="/employee/leave"
              element={
                <Leave />
              }
            />

            <Route
              path="/employee/attendance"
              element={
                <Attendance />
              }
            />

            <Route
              path="/employee/attendance/history"
              element={
                <AttendanceHistory />
              }
            />

          </Route>

          {/* HR Routes */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "hr"
                ]}
              />
            }
          >

            <Route
              path="/hr"
              element={
                <HRDashboard />
              }
            />
            <Route
              path="/hr/employees"
              element={
                <Employees />
              }
            />
            <Route
              path="/hr/leaves"
              element={
                  <LeaveManagement />
              }
            />

            <Route
              path="/hr/attendance"
              element={
                  <HRAttendance />
              }
            />

            <Route
              path="/hr/attendance/summary"
              element={ 
                  <EmployeeAttendanceSummary />
              }
            />

            <Route
              path="/hr/attendance/monthly"
              element={
                  <MonthlyAttendanceReport />
              }
            />

          </Route>

          {/* Default */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          {/* Fallback */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

          <Route path="*" element={<NotFound />} />

        </Routes>

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;