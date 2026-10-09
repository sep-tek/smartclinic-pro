import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/api";
import ErrorMessage from "../components/ErrorMessage";
import "./Appointments.css";

function Appointments() {
  const { user } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [formData, setFormData] = useState({
    doctor_id: "",
    appointment_date: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [cancellingId, setCancellingId] = useState(null);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelError, setCancelError] = useState("");

  // Get doctors and patient's appointments
  const loadData = useCallback(async () => {
  try {
    setLoading(true);
    setError("");

    const doctorsResponse = await apiFetch(
      `${API_BASE_URL}/api/appointments/doctors`
    );

    setDoctors(doctorsResponse.data || []);

    const appointmentsResponse = await apiFetch(
      `${API_BASE_URL}/api/appointments/patient/${user.id}`
    );

    setAppointments(appointmentsResponse.data || []);
  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        "Unable to load appointment information."
    );
  } finally {
    setLoading(false);
  }
}, [user?.id]);

useEffect(() => {
  if (user?.id) {
    loadData();
  }
}, [user?.id, loadData]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Starting/editing a new booking clears the old result messages
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (booking) {
      return;
    }

    setMessage("");
    setError("");
    setBooking(true);

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/appointments`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            patient_id: user.id,
            doctor_id: Number(formData.doctor_id),
            appointment_date: formData.appointment_date,
            notes: formData.notes,
          }),
        }
      );

      setMessage(
        response.data?.message ||
          "Appointment booked successfully!"
      );

      setFormData({
        doctor_id: "",
        appointment_date: "",
        notes: "",
      });

      // Reload appointments
      const appointmentsResponse = await apiFetch(
        `${API_BASE_URL}/api/appointments/patient/${user.id}`
      );

      setAppointments(appointmentsResponse.data || []);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to connect to the server."
      );
    } finally {
      setBooking(false);
    }
  }

  async function handleCancel(appointmentId) {
    if (cancellingId !== null) {
      return;
    }

    setCancelMessage("");
    setCancelError("");
    setCancellingId(appointmentId);

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/appointments/${appointmentId}/cancel`,
        { method: "PATCH" }
      );

      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: "cancelled" }
            : appointment
        )
      );

      setCancelMessage(
        response.data?.message ||
          "Appointment cancelled successfully."
      );
    } catch (error) {
      console.error(error);

      setCancelError(
        error.message || "Unable to cancel the appointment."
      );
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="appointments-page">
        <div className="appointments-container">
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appointments-page">
      <div className="appointments-container">
        <div className="appointments-header">
          <p className="appointments-label">
            Patient Portal
          </p>

          <h1>
            Appointments
          </h1>

          <p>
            Book and manage your healthcare appointments.
          </p>
        </div>

        <div className="appointment-layout">

          {/* Booking Form */}

          <div className="appointment-card">
            <h2>
              Book an Appointment
            </h2>

            <p className="card-description">
              Choose a doctor and select a convenient date.
            </p>

            {message && (
              <div className="appointment-message success">
                {message}
              </div>
            )}

          {error && (
  <ErrorMessage
    message={error}
    onRetry={loadData}
  />
)}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="doctor_id">
                  Doctor
                </label>

                <select
                  id="doctor_id"
                  name="doctor_id"
                  value={formData.doctor_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select a doctor
                  </option>

                  {doctors.map((doctor) => (
                    <option
                      key={doctor.id}
                      value={doctor.id}
                    >
                      {doctor.name} — {doctor.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="appointment_date">
                  Date & Time
                </label>

                <input
                  id="appointment_date"
                  name="appointment_date"
                  type="datetime-local"
                  value={formData.appointment_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">
                  Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Describe anything you'd like the doctor to know..."
                  value={formData.notes}
                  onChange={handleChange}
                  rows="5"
                />
              </div>

              <button
                type="submit"
                disabled={booking}
              >
                {booking
                  ? "Booking..."
                  : "Book Appointment"}
              </button>
            </form>
          </div>

          {/* Existing Appointments */}

          <div className="appointment-card">
            <h2>
              My Appointments
            </h2>

            <p className="card-description">
              Your upcoming and previous appointments.
            </p>

            {cancelMessage && (
              <div className="appointment-message success">
                {cancelMessage}
              </div>
            )}

            {cancelError && (
              <div className="appointment-message error">
                {cancelError}
              </div>
            )}

            {appointments.length === 0 ? (
              <div className="empty-appointments">
                <p>
                  You don't have any appointments yet.
                </p>
              </div>
            ) : (
              <div className="appointment-list">
                {appointments.map((appointment) => (
                  <div
                    className="appointment-item"
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

                    <div className="appointment-details">
                      <span>
                        {new Date(
                          appointment.appointment_date
                        ).toLocaleString()}
                      </span>

                      <span
                        className={`status ${appointment.status}`}
                      >
                        {appointment.status}
                      </span>

                      {(appointment.status === "pending" ||
                        appointment.status === "approved") && (
                        <button
                          type="button"
                          className="cancel-appointment-btn"
                          disabled={cancellingId !== null}
                          onClick={() =>
                            handleCancel(appointment.id)
                          }
                        >
                          {cancellingId === appointment.id
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Appointments;