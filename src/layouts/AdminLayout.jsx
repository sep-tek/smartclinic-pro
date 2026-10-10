import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeSwitcher from "../components/ThemeSwitcher";
import "./AdminLayout.css";

function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* The drawer is open only on the route it was opened from, so a
     route change closes it by derivation rather than by a setState
     call inside an effect (react-hooks/set-state-in-effect).
     `openPath` holds that route, or null when closed. */

  const [openPath, setOpenPath] = useState(null);
  const sidebarOpen = openPath === pathname;

  const sidebarRef = useRef(null);
  const toggleRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    function onKey(event) {
      if (event.key !== "Escape") {
        return;
      }

      /* A theme sheet can be open above the drawer, and Escape
         should dismiss only the topmost layer: the first press
         closes the sheet (handled in ThemeSwitcher) and leaves
         the drawer open; the next press closes the drawer.

         This reads the DOM rather than React state so it does not
         depend on which of the two document listeners is
         registered first — the sheet stays mounted for the whole
         event dispatch, so either order sees it and defers.

         AdminLayout is never mounted on the public pages, so the
         homepage theme menu keeps its own Escape handling. */

      if (document.querySelector(".theme-menu")) {
        return;
      }

      setOpenPath(null);
    }

    document.addEventListener("keydown", onKey);

    // Prevent the page behind the drawer from scrolling
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  function handleLogout() {
    setOpenPath(null);
    logout();
    navigate("/login");
  }

// Close the drawer when the viewport grows past the mobile
  /* breakpoint. Above 800px the sidebar becomes the fixed desktop
     rail and the menu button is hidden, so a drawer left open
     would keep `body { overflow: hidden }` with no visible way to
     close it. Closing here runs the effect cleanup above, which
     restores the previous body overflow. */

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");

    function onChange(event) {
      if (!event.matches) {
        setOpenPath(null);
      }
    }

    media.addEventListener("change", onChange);

    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

  // Move focus into the drawer on open, and hand it back to the
  // menu button on close (Escape, backdrop or the close button).
  /* Only when focus is still inside the drawer, so closing is
     never announced as lost focus on an unrelated control. */

  useEffect(() => {
    if (sidebarOpen) {
      closeRef.current?.focus();
      return;
    }

    const sidebar = sidebarRef.current;

    if (sidebar?.contains(document.activeElement)) {
      toggleRef.current?.focus();
    }
  }, [sidebarOpen]);

  return (
    <div className="admin-layout">

      {/* Mobile menu toggle */}

      <div className="admin-mobile-bar">
        <button
          ref={toggleRef}
          type="button"
          className="admin-sidebar-toggle"
          aria-label="Open admin navigation"
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
          onClick={() =>
            setOpenPath(
              sidebarOpen ? null : pathname
            )
          }
        >
          <span aria-hidden="true">☰</span>
        </button>

        <span className="admin-mobile-title">
          Admin Panel
        </span>
      </div>

      {/* Backdrop */}

      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close admin navigation"
          onClick={() => setOpenPath(null)}
        />
      )}


      {/* Sidebar */}

      <aside
          ref={sidebarRef}
          id="admin-sidebar"
          className={
          sidebarOpen
            ? "admin-sidebar admin-sidebar-open"
            : "admin-sidebar"
        }
      >

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

          <button
            ref={closeRef}
            type="button"
            className="admin-sidebar-close"
            aria-label="Close admin navigation"
            onClick={() =>
              setOpenPath(null)
            }
          >
            <span aria-hidden="true">✕</span>
          </button>

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
            onClick={() => setOpenPath(null)}
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
            onClick={() => setOpenPath(null)}
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
            onClick={() => setOpenPath(null)}
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
            onClick={() => setOpenPath(null)}
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
  onClick={() => setOpenPath(null)}
>
  <span className="admin-nav-icon">
    ✉️
  </span>

  Messages
</NavLink>

        </nav>


        {/* Bottom Actions */}

        <div className="admin-sidebar-bottom">

          <ThemeSwitcher label="Color theme" />

          <Link
            to="/"
            className="admin-bottom-link"
            onClick={() =>
              setOpenPath(null)
            }
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

        <div
          id="admin-main-content"
          className="admin-main-content"
        >
          <Outlet />
        </div>

      </main>

    </div>
  );
}

export default AdminLayout;