import {
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  LogIn,
  Mail,
  LockKeyhole
} from "lucide-react";

import {
  useAuth
} from "../context/AuthContext";

const Login = () => {
  const navigate =
    useNavigate();

  const {
    login
  } = useAuth();

  const [formData, setFormData] =
    useState({
      email: "",
      password: ""
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
        const response =
          await login(
            formData.email,
            formData.password
          );

        if (
          response.user.role ===
          "hr"
        ) {
          navigate("/hr");
        } else {
          navigate(
            "/employee"
          );
        }
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to login"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          <LogIn size={26} />
        </div>

        <h1>
          Welcome back
        </h1>

        <p className="auth-subtitle">
          Sign in to your
          Attendify account
        </p>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label>
              Email
            </label>

            <div className="input-wrapper">

              <Mail
                size={18}
              />

              <input
                type="email"
                name="email"
                placeholder="you@example.com"
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
                type="password"
                name="password"
                placeholder="Enter your password"
                value={
                  formData.password
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>

          </div>

          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>

      </div>

    </div>
  );
};

export default Login;