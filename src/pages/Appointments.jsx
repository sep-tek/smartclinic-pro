import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/api";
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

  // Get doctors and patient's appointments
  useEffect(() => {
    async function loadData() {
      try {
        const doctorsResponse = await apiFetch(
          "http://localhost:5000/api/appointments/doctors"
        );

        const doctorsData = await doctorsResponse.json();

        if (!doctorsResponse.ok) {
          throw new Error("Failed to load doctors.");
        }

        setDoctors(doctorsData);

        const appointmentsResponse = await apiFetch(
          `http://localhost:5000/api/appointments/patient/${user.id}`
        );

        const appointmentsData = await appointmentsResponse.json();

        if (!appointmentsResponse.ok) {
          throw new Error("Failed to load appointments.");
        }

        setAppointments(appointmentsData);

      } catch (error) {
        console.error(error);
        setError("Unable to load appointment information.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user.id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setBooking(true);

    try {
      const response = await apiFetch(
        "http://localhost:5000/api/appointments",
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

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to book appointment."
        );
        return;
      }

      setMessage("Appointment booked successfully!");

      setFormData({
        doctor_id: "",
        appointment_date: "",
        notes: "",
      });

      // Reload appointments
      const appointmentsResponse = await apiFetch(
        `http://localhost:5000/api/appointments/patient/${user.id}`
      );

      const appointmentsData = await appointmentsResponse.json();

      setAppointments(appointmentsData);

    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to the server."
      );

    } finally {
      setBooking(false);
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
              <div className="appointment-message error">
                {error}
              </div>
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
