import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import ErrorMessage from "../components/ErrorMessage";
import "./Doctors.css";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        "http://localhost:5000/api/appointments/doctors"
      );

      setDoctors(response.data || []);
    } catch (error) {
      console.error("Failed to load doctors:", error);

      setError(
        error.message || "Unable to load doctors. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return (
    <div className="doctors-page">
      <section className="doctors-hero">
        <p className="doctors-label">OUR DOCTORS</p>

        <h1>
          Meet our
          <span> specialists.</span>
        </h1>

        <p>
          Connect with experienced healthcare professionals
          and find the right specialist for your needs.
        </p>
      </section>

      <section className="doctors-list">
        {loading ? (
          <div className="doctors-loading">
            <p>Loading doctors...</p>
          </div>
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={fetchDoctors}
          />
        ) : doctors.length === 0 ? (
          <div className="doctors-empty">
            <p>No doctors are currently available.</p>
          </div>
        ) : (
          <div className="doctors-grid">
            {doctors.map((doctor) => (
              <div
                className="doctor-page-card"
                key={doctor.id}
              >
                <div className="doctor-profile">
                  <div className="doctor-avatar-large">
                    DR
                  </div>

                  <div>
                    <h2>{doctor.name}</h2>

                    <p className="doctor-specialty">
                      {doctor.specialty}
                    </p>
                  </div>
                </div>

                <div className="doctor-experience">
                  {doctor.experience_years} years experience
                </div>

                <p className="doctor-description">
                  {doctor.description}
                </p>

                <button type="button">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Doctors;
