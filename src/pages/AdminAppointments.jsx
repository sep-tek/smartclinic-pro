import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import "./AdminAppointments.css";

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAppointments() {
    try {
      setError("");

      const response = await apiFetch(
        "http://localhost:5000/api/admin/appointments"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load appointments."
        );
      }

      setAppointments(data);

    } catch (error) {
      console.error(error);

      setError(
        error.message ||
        "Unable to load appointments."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);


  const filteredAppointments =
    statusFilter === "all"
      ? appointments
      : appointments.filter(
          (appointment) =>
            appointment.status === statusFilter
        );


  const pendingCount = appointments.filter(
    (appointment) =>
      appointment.status === "pending"
  ).length;

  const approvedCount = appointments.filter(
    (appointment) =>
      appointment.status === "approved"
  ).length;

  const rejectedCount = appointments.filter(
    (appointment) =>
      appointment.status === "rejected"
  ).length;

  const completedCount = appointments.filter(
    (appointment) =>
      appointment.status === "completed"
  ).length;


  return (
    <div className="admin-appointments-page">

      <div className="admin-appointments-container">

        {/* Header */}

        <div className="admin-appointments-header">

          <p>
            Administration
          </p>

          <h1>
            Manage Appointments
          </h1>

          <span>
            Monitor and manage all clinic appointments.
          </span>

        </div>


        {/* Statistics */}

        <div className="appointment-statistics">

          <button
            className={
              statusFilter === "all"
                ? "appointment-stat active"
                : "appointment-stat"
            }
            onClick={() =>
              setStatusFilter("all")
            }
          >

            <span>
              Total
            </span>

            <strong>
              {appointments.length}
            </strong>

            <small>
              Click to view all →
            </small>

          </button>


          <button
            className={
              statusFilter === "pending"
                ? "appointment-stat active"
                : "appointment-stat"
            }
            onClick={() =>
              setStatusFilter("pending")
            }
          >

            <span>
              Pending
            </span>

            <strong>
              {pendingCount}
            </strong>

            <small>
              Click to view pending →
            </small>

          </button>


          <button
            className={
              statusFilter === "approved"
                ? "appointment-stat active"
                : "appointment-stat"
            }
            onClick={() =>
              setStatusFilter("approved")
            }
          >

            <span>
              Approved
            </span>

            <strong>
              {approvedCount}
            </strong>

            <small>
              Click to view approved →
            </small>

          </button>


          <button
            className={
              statusFilter === "completed"
                ? "appointment-stat active"
                : "appointment-stat"
            }
            onClick={() =>
              setStatusFilter("completed")
            }
          >

            <span>
              Completed
            </span>

            <strong>
              {completedCount}
            </strong>

            <small>
              Click to view completed →
            </small>

          </button>

          <button
  className={
    statusFilter === "rejected"
      ? "appointment-stat active"
      : "appointment-stat"
  }
  onClick={() =>
    setStatusFilter("rejected")
  }
>

  <span>
    Rejected
  </span>

  <strong>
    {rejectedCount}
  </strong>

  <small>
    Click to view rejected →
  </small>

</button>

        </div>

        {/* Appointments */}

        <div className="admin-appointments-section">

          <div className="appointments-section-header">

            <div>

              <h2>
                {statusFilter === "all"
                  ? "All Appointments"
                  : `${statusFilter
                      .charAt(0)
                      .toUpperCase()}${statusFilter.slice(1)} Appointments`}
              </h2>

              <p>
                {filteredAppointments.length} appointment
                {filteredAppointments.length !== 1
                  ? "s"
                  : ""}
              </p>

            </div>

          </div>


          {loading ? (

            <div className="appointments-message">
              Loading appointments...
            </div>

          ) : error ? (

            <div className="appointments-message error">
              {error}
            </div>

          ) : filteredAppointments.length === 0 ? (

            <div className="appointments-message">
              No appointments found.
            </div>

          ) : (

            <div className="admin-appointments-list">

              {filteredAppointments.map(
                (appointment) => (

                  <div
                    className="admin-appointment-card"
                    key={appointment.id}
                  >

                    <div className="admin-appointment-main">

                      <div className="appointment-person">

                        <span className="appointment-label">
                          Patient
                        </span>

                        <strong>
                          {appointment.patient_name}
                        </strong>

                        <small>
                          {appointment.patient_email}
                        </small>

                      </div>


                      <div className="appointment-person">

                        <span className="appointment-label">
                          Doctor
                        </span>

                        <strong>
                          {appointment.doctor_name}
                        </strong>

                        <small>
                          {appointment.doctor_specialty}
                        </small>

                      </div>


                      <div className="appointment-person">

                        <span className="appointment-label">
                          Appointment
                        </span>

                        <strong>
                          {new Date(
                            appointment.appointment_date
                          ).toLocaleString()}
                        </strong>

                      </div>


                      <div className="appointment-status-container">

                        <span className="appointment-label">
                          Status
                        </span>

                        <span
                          className={`admin-appointment-status ${appointment.status}`}
                        >
                          {appointment.status}
                        </span>

                      </div>

                    </div>


                    {appointment.notes && (

                      <div className="admin-appointment-notes">

                        <span>
                          Patient Notes
                        </span>

                        <p>
                          {appointment.notes}
                        </p>

                      </div>

                    )}

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default AdminAppointments;
