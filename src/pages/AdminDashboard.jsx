import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api/api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboardStats() {
    try {
      setError("");

      const response = await apiFetch(
        `${API_BASE_URL}/api/admin/dashboard/stats`
      );

      const data = response.data;

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to load dashboard statistics."
        );
      }

      setStats(data);

    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      setError(
        error.message ||
        "Unable to load dashboard statistics."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardStats();
  }, []);


  return (
    <div className="admin-dashboard-page">

      <div className="admin-dashboard-container">

        {/* Header */}

        <div className="admin-dashboard-header">

          <div>

            <p className="admin-dashboard-label">
              Administration
            </p>

            <h1>
              Welcome, {user?.name || "Admin"}
            </h1>

            <p className="admin-dashboard-subtitle">
              Here's an overview of your SmartClinic Pro system.
            </p>

          </div>

        </div>


        {/* Error */}

        {error && (
          <div className="admin-dashboard-error">
            {error}
          </div>
        )}


        {/* Statistics */}

        <div className="admin-dashboard-stats">

          <Link
            to="/admin/users"
            className="admin-stat-card"
          >

            <div className="admin-stat-icon">
              👥
            </div>

            <div>

              <span>
                Total Patients
              </span>

              <strong>
                {loading ? "..." : stats.patients}
              </strong>

              <small>
                Click to manage patients →
              </small>

            </div>

          </Link>


          <Link
            to="/admin/doctors"
            className="admin-stat-card"
          >

            <div className="admin-stat-icon">
              👨‍⚕️
            </div>

            <div>

              <span>
                Total Doctors
              </span>

              <strong>
                {loading ? "..." : stats.doctors}
              </strong>

              <small>
                Click to manage doctors →
              </small>

            </div>

          </Link>


          <Link
            to="/admin/appointments"
            className="admin-stat-card"
          >

            <div className="admin-stat-icon">
              📅
            </div>

            <div>

              <span>
                Total Appointments
              </span>

              <strong>
                {loading ? "..." : stats.appointments}
              </strong>

              <small>
                Click to view appointments →
              </small>

            </div>

          </Link>


          <Link
            to="/admin/appointments"
            className="admin-stat-card"
          >

            <div className="admin-stat-icon">
              ⏳
            </div>

            <div>

              <span>
                Pending Appointments
              </span>

              <strong>
                {loading
                  ? "..."
                  : stats.pendingAppointments}
              </strong>

              <small>
                Click to review pending →
              </small>

            </div>

          </Link>

        </div>


        {/* Quick Actions */}

        <section className="admin-quick-section">

          <div className="admin-section-heading">

            <div>

              <p>
                Management
              </p>

              <h2>
                Quick Actions
              </h2>

            </div>

          </div>


          <div className="admin-quick-grid">

            <Link
              to="/admin/users"
              className="admin-quick-card"
            >

              <div className="admin-quick-icon">
                👥
              </div>

              <div>

                <h3>
                  Manage Users
                </h3>

                <p>
                  View and manage patient,
                  doctor and admin accounts.
                </p>

              </div>

              <span>
                Open →
              </span>

            </Link>


            <Link
              to="/admin/doctors"
              className="admin-quick-card"
            >

              <div className="admin-quick-icon">
                🩺
              </div>

              <div>

                <h3>
                  Manage Doctors
                </h3>

                <p>
                  View and manage the clinic's
                  healthcare professionals.
                </p>

              </div>

              <span>
                Open →
              </span>

            </Link>


            <Link
              to="/admin/appointments"
              className="admin-quick-card"
            >

              <div className="admin-quick-icon">
                📋
              </div>

              <div>

                <h3>
                  Manage Appointments
                </h3>

                <p>
                  Monitor appointments and
                  their current status.
                </p>

              </div>

              <span>
                Open →
              </span>

            </Link>

          </div>

        </section>


        {/* Appointment Overview */}

        <section className="admin-overview-section">

          <div className="admin-section-heading">

            <div>

              <p>
                Appointment Overview
              </p>

              <h2>
                Current Activity
              </h2>

            </div>

            <Link
              to="/admin/appointments"
              className="admin-view-link"
            >
              View all appointments →
            </Link>

          </div>


          <div className="admin-appointment-overview">

            <div className="overview-item">

              <span>
                Total Appointments
              </span>

              <strong>
                {loading ? "..." : stats.appointments}
              </strong>

            </div>


            <div className="overview-item">

              <span>
                Pending
              </span>

              <strong>
                {loading
                  ? "..."
                  : stats.pendingAppointments}
              </strong>

            </div>


            <div className="overview-item">

              <span>
                Approved
              </span>

              <strong>
                {loading
                  ? "..."
                  : stats.approvedAppointments}
              </strong>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default AdminDashboard;
