import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminLayout.css";

function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="admin-layout">

      {/* Sidebar */}

      <aside className="admin-sidebar">

        <div className="admin-sidebar-header">

          <Link
            to="/admin/dashboard"
            className="admin-brand"
          >
            SmartClinic<span>Pro</span>
          </Link>

          <p>
            ADMIN PANEL
          </p>

        </div>


        {/* Navigation */}

        <nav className="admin-nav">

          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              isActive
                ? "admin-nav-link active"
                : "admin-nav-link"
            }
          >
            <span className="admin-nav-icon">
              📊
            </span>

            Dashboard
          </NavLink>


          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              isActive
                ? "admin-nav-link active"
                : "admin-nav-link"
            }
          >
            <span className="admin-nav-icon">
              👥
            </span>

            Users
          </NavLink>


          <NavLink
            to="/admin/doctors"
            className={({ isActive }) =>
              isActive
                ? "admin-nav-link active"
                : "admin-nav-link"
            }
          >
            <span className="admin-nav-icon">
              👨‍⚕️
            </span>

            Doctors
          </NavLink>


          <NavLink
            to="/admin/appointments"
            className={({ isActive }) =>
              isActive
                ? "admin-nav-link active"
                : "admin-nav-link"
            }
          >
            <span className="admin-nav-icon">
              📅
            </span>

            Appointments
          </NavLink>

<NavLink
  to="/admin/contact-messages"
  className={({ isActive }) =>
    isActive
      ? "admin-nav-link active"
      : "admin-nav-link"
  }
>
  <span className="admin-nav-icon">
    ✉️
  </span>

  Messages
</NavLink>

        </nav>


        {/* Bottom Actions */}

        <div className="admin-sidebar-bottom">

          <Link
            to="/"
            className="admin-bottom-link"
          >
            <span>
              🌐
            </span>

            View Website
          </Link>


          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            <span>
              🚪
            </span>

            Logout
          </button>

        </div>

      </aside>


      {/* Main Content */}

      <main className="admin-main">

        <Outlet />

      </main>

    </div>
  );
}

export default AdminLayout;