import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../api/api";
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
        `${API_BASE_URL}/api/admin/appointments`
      );

      const data = response.data;

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


  // =====================================================
  // SUMMARY CARD FILTERING AND SCROLLING
  // =====================================================

  // Scroll target for the filtered appointment list
  const listRef = useRef(null);

  /* Bumped only by a deliberate click on a summary card, so the effect
     below can tell "the user asked to see the list" apart from "the page
     is rendering". That keeps the initial load from scrolling, while a
     click on an already-selected card (Total included) still scrolls,
     because the counter changes even though `statusFilter` does not. */

  const [scrollRequest, setScrollRequest] = useState(0);

  // Bring the filtered list into view after a card is clicked
  /* Runs after the click has been committed, so the newly filtered
     cards are already rendered. `loading` is a dependency so a click
     that lands mid-request scrolls once the cards arrive rather than
     being dropped.

     scrollIntoView walks every scrollable ancestor, so this still works
     when the admin shell scrolls a container instead of the window. */

  useEffect(() => {
    if (scrollRequest === 0 || loading) {
      return;
    }

    if (listRef.current) {
      listRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [scrollRequest, loading]);

  function handleFilterSelect(status) {
    setStatusFilter(status);
    setScrollRequest((previous) => previous + 1);
  }


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
            aria-pressed={statusFilter === "all"}
            onClick={() =>
              handleFilterSelect("all")
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
            aria-pressed={statusFilter === "pending"}
            onClick={() =>
              handleFilterSelect("pending")
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
            aria-pressed={statusFilter === "approved"}
            onClick={() =>
              handleFilterSelect("approved")
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
            aria-pressed={statusFilter === "completed"}
            onClick={() =>
              handleFilterSelect("completed")
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
  aria-pressed={statusFilter === "rejected"}
  onClick={() =>
    handleFilterSelect("rejected")
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

        <div
          className="admin-appointments-section"
          ref={listRef}
        >

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
