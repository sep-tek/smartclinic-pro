import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeSwitcher from "./ThemeSwitcher";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <div className="logo">
          <Link to="/">
            SmartClinic<span>Pro</span>
          </Link>
        </div>

        <div className="nav-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/doctors">Doctors</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </div>

        <div className="nav-actions">
          <ThemeSwitcher label="Color theme" />

          {user ? (
            <>
              <NavLink
                className={({ isActive }) =>
                  isActive ? "login-btn nav-active" : "login-btn"
                }
                to="/dashboard"
              >
                Dashboard
              </NavLink>

              {user.role === "admin" && (
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "login-btn nav-active" : "login-btn"
                  }
                  to="/admin/dashboard"
                >
                  Admin
                </NavLink>
              )}

              {user.role === "patient" && (
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "login-btn nav-active" : "login-btn"
                  }
                  to="/appointments"
                >
                  Appointments
                </NavLink>
              )}

              {(user.role === "patient" || user.role === "doctor") && (
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "login-btn nav-active" : "login-btn"
                  }
                  to="/profile"
                >
                  Profile
                </NavLink>
              )}

              <button
                className="signup-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                className="login-btn"
                to="/login"
              >
                Login
              </Link>

              <Link
                className="signup-btn"
                to="/register"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
