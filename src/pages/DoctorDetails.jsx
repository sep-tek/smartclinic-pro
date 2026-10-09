import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../api/api";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import ErrorMessage from "../components/ErrorMessage";
import "./DoctorDetails.css";

function DoctorDetails() {
  const { doctorId } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDoctor = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        `${API_BASE_URL}/api/appointments/doctors`
      );

      const doctors = response.data || [];

      const found = doctors.find(
        (item) => String(item.id) === String(doctorId)
      );

      if (!found) {
        setDoctor(null);
        setError("Doctor not found.");
        return;
      }

      setDoctor(found);
    } catch (err) {
      console.error("Failed to load doctor:", err);

      setError(
        err.message ||
          "Unable to load this doctor's profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadDoctor();
  }, [loadDoctor]);

  if (loading) {
    return (
      <div className="doctor-details-page">
        <p>Loading doctor profile...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="doctor-details-page">
        <ErrorMessage
          message={error || "Doctor not found."}
          onRetry={loadDoctor}
        />

        <Link
          to="/doctors"
          className="doctor-details-back"
        >
          Back to doctors
        </Link>
      </div>
    );
  }

  return (
    <div className="doctor-details-page">

      <div className="doctor-details-card">

        <div className="doctor-details-avatar">
          DR
        </div>

        <h1>{doctor.name}</h1>

        <p className="doctor-details-specialty">
          {doctor.specialty}
        </p>

        <p className="doctor-details-experience">
          {doctor.experience_years} years of experience
        </p>

        <p className="doctor-details-description">
          {doctor.description}
        </p>

        <Link
          to="/doctors"
          className="doctor-details-back"
        >
          Back to doctors
        </Link>

      </div>

    </div>
  );
}

export default DoctorDetails;
