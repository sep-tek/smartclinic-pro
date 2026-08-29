import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import DoctorDashboard from "./DoctorDashboard";
import "./Dashboard.css";

function Dashboard() {
  const { user } = useAuth();

const [appointments, setAppointments] = useState([]);
const [appointmentsLoading, setAppointmentsLoading] = useState(true);

useEffect(() => {
  if (user?.role !== "patient") {
    return;
  }

  async function loadAppointments() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/appointments/patient/${user.id}`
      );

      const data = await response.json();

      if (response.ok) {
        setAppointments(data);
      }

    } catch (error) {
      console.error(
        "Failed to load patient appointments:",
        error
      );
    } finally {
      setAppointmentsLoading(false);
    }
  }

  loadAppointments();
}, [user]);

  if (!user) {
    return null;
  }

  // Admin gets the admin dashboard
  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  // Doctor dashboard 
  if (user.role === "doctor") {
  return <DoctorDashboard />;
}

  // Patient dashboard
  return (
    <div className="dashboard-page">

      <div className="dashboard-container">

        <div className="dashboard-header">

          <div>
            <p className="dashboard-label">
              Patient Dashboard
            </p>

            <h1>
              Welcome, {user.name}
            </h1>

            <p className="dashboard-subtitle">
              Manage your healthcare appointments and information.
            </p>
          </div>

        </div>


        <div className="dashboard-grid">

          <Link
            to="/appointments"
            className="dashboard-card"
          >
            <div className="dashboard-icon">
              📅
            </div>

            <h2>
              Appointments
            </h2>

            <p>
              View and manage your upcoming appointments.
            </p>

            <span>
              View appointments →
            </span>
          </Link>


          <Link
            to="/doctors"
            className="dashboard-card"
          >
            <div className="dashboard-icon">
              👨‍⚕️
            </div>

            <h2>
              Find a Doctor
            </h2>

            <p>
              Browse our healthcare professionals.
            </p>

            <span>
              Find doctors →
            </span>
          </Link>


          <Link
            to="/services"
            className="dashboard-card"
          >
            <div className="dashboard-icon">
              🏥
            </div>

            <h2>
              Medical Services
            </h2>

            <p>
              Explore the healthcare services we provide.
            </p>

            <span>
              View services →
            </span>
          </Link>


          <div className="dashboard-card">

            <div className="dashboard-icon">
              👤
            </div>

            <h2>
              My Profile
            </h2>

            <p>
              Manage your personal account information.
            </p>

            <span>
              Coming soon
            </span>

          </div>

        </div>

      <div className="patient-appointments-section">

  <div className="patient-section-header">

    <div>
      <h2>
        My Recent Appointments
      </h2>

      <p>
        Keep track of your healthcare appointments.
      </p>
    </div>

    <Link to="/appointments">
      View All →
    </Link>

  </div>


  {appointmentsLoading ? (

    <p>
      Loading appointments...
    </p>

  ) : appointments.length === 0 ? (

    <div className="patient-no-appointments">

      <p>
        You don't have any appointments yet.
      </p>

      <Link to="/appointments">
        Book an Appointment →
      </Link>

    </div>

  ) : (

    <div className="patient-appointments-list">

      {appointments
        .slice(0, 3)
        .map((appointment) => (

          <div
            className="patient-appointment-item"
            key={appointment.id}
          >

            <div>

              <h3>
                {appointment.doctor_name}
              </h3>

              <p>
                {appointment.specialty}
              </p>

            </div>


            <div className="patient-appointment-meta">

              <span>
                {new Date(
                  appointment.appointment_date
                ).toLocaleString()}
              </span>

              <strong
                className={`patient-status ${appointment.status}`}
              >
                {appointment.status}
              </strong>

            </div>

          </div>

        ))}

    </div>

  )}

</div>

        <div className="account-section">

          <h2>
            Account Information
          </h2>

          <div className="account-info">

            <div>
              <span>
                Name
              </span>

              <strong>
                {user.name}
              </strong>
            </div>

            <div>
              <span>
                Email
              </span>

              <strong>
                {user.email}
              </strong>
            </div>

            <div>
              <span>
                Account Type
              </span>

              <strong>
                {user.role}
              </strong>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;