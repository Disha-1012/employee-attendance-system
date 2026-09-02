import {
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  UserPlus,
  User,
  Mail,
  LockKeyhole,
  Badge,
  Building2,
  BriefcaseBusiness,
  IndianRupee
} from "lucide-react";

import {
  useAuth
} from "../context/AuthContext";

const Register = () => {
  const navigate =
    useNavigate();

  const {
    register
  } = useAuth();

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      employeeId: "",
      department: "",
      designation: "",
      salary: ""
    });

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value
    });
  };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setError("");
      setLoading(true);

      try {
        await register(
          formData
        );

        navigate(
          "/employee"
        );
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Registration failed"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="auth-page">

      <div className="auth-card register-card">

        <div className="auth-logo">
          <UserPlus size={26} />
        </div>

        <h1>
          Create account
        </h1>

        <p className="auth-subtitle">
          Register as an employee
        </p>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
        >

          <div className="form-grid">

            <div className="form-group">

              <label>
                Full Name
              </label>

              <div className="input-wrapper">

                <User size={18} />

                <input
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Employee ID
              </label>

              <div className="input-wrapper">

                <Badge
                  size={18}
                />

                <input
                  name="employeeId"
                  type="text"
                  placeholder="Enter your id"
                  value={
                    formData.employeeId
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Email
              </label>

              <div className="input-wrapper">

                <Mail size={18} />

                <input
                  name="email"
                  type="email"
                  placeholder="Enter email id"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Password
              </label>

              <div className="input-wrapper">

                <LockKeyhole
                  size={18}
                />

                <input
                  name="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  minLength={6}
                  required
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Department
              </label>

              <div className="input-wrapper">

                <Building2
                  size={18}
                />

                <input
                  name="department"
                  type="text"
                  placeholder="Enter your department"
                  value={
                    formData.department
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Designation
              </label>

              <div className="input-wrapper">

                <BriefcaseBusiness
                  size={18}
                />

                <input
                  name="designation"
                  type="text"
                  placeholder="Enter designation"
                  value={
                    formData.designation
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Monthly Salary
              </label>

              <div className="input-wrapper">

                <IndianRupee
                  size={18}
                />

                <input
                  name="salary"
                  type="number"
                  placeholder="Enter salary"
                  value={
                    formData.salary
                  }
                  onChange={
                    handleChange
                  }
                  min="0"
                />

              </div>

            </div>

          </div>

          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>

        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">
            Sign in
          </Link>
        </p>

      </div>

    </div>
  );
};

export default Register;