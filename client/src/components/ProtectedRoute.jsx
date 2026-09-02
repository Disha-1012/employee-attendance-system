import {
  Navigate,
  Outlet
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";

const ProtectedRoute = ({
  allowedRoles
}) => {
  const {
    user,
    loading
  } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | Wait For Session Restoration
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader" />
        <p>
          Loading Attendify...
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Not Logged In
  |--------------------------------------------------------------------------
  */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Role Check
  |--------------------------------------------------------------------------
  */

  if (
    allowedRoles &&
    !allowedRoles.includes(
      user.role
    )
  ) {
    if (
      user.role === "hr"
    ) {
      return (
        <Navigate
          to="/hr"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/employee"
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;