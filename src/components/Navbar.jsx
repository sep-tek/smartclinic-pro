import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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

      <div className="logo">
        <Link to="/">
          SmartClinic<span>Pro</span>
        </Link>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/services">Services</Link>
        <Link to="/doctors">Doctors</Link>
        <Link to="/contact">Contact</Link>
      </div>

      <div className="nav-actions">

        {user ? (
          <>
            <Link className="login-btn" to="/dashboard">
              Dashboard
            </Link>

            {user.role === "admin" && (
              <Link className="login-btn" to="/admin/contact-messages">
                Messages
              </Link>
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
            <Link className="login-btn" to="/login">
              Login
            </Link>

            <Link className="signup-btn" to="/register">
              Get Started
            </Link>
          </>
        )}

      </div>

    </nav>
  );
}

export default Navbar;