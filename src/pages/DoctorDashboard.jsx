import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/api";
import "./DoctorDashboard.css";

function DoctorDashboard() {
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
const [appointments, setAppointments] = useState([]);
const [statusFilter, setStatusFilter] = useState("all");
const [appointmentSearch, setAppointmentSearch] = useState("");
const [appointmentSort, setAppointmentSort] =
  useState("newest");
const [showNotifications, setShowNotifications] = useState(false);
const [seenNotifications, setSeenNotifications] = useState([]);
const [selectedPatient, setSelectedPatient] = useState(null);
const [patientAppointments, setPatientAppointments] = useState([]);
const [patientLoading, setPatientLoading] = useState(false);
const [patientError, setPatientError] = useState("");
const [editingProfile, setEditingProfile] = useState(false);
const [profileSaving, setProfileSaving] = useState(false);
const [profileError, setProfileError] = useState("");
const [profileSuccess, setProfileSuccess] = useState("");

const [profileForm, setProfileForm] = useState({
  name: "",
  email: "",
  specialty: "",
  experience_years: "",
  description: "",
});


const patientDetailsRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setError("");

      const response = await apiFetch(
        `http://localhost:5000/api/doctor-dashboard/${user.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load dashboard."
        );
      }

      setDoctor(data.doctor);
      setAppointments(data.appointments);

    } catch (error) {
      console.error(error);
      setError(
        error.message ||
        "Unable to load doctor dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

useEffect(() => {
  if (!appointments.length) {
    return;
  }

  const validAppointmentIds = appointments.map(
    (appointment) => appointment.id
  );

  const cleanedSeenNotifications =
    seenNotifications.filter((id) =>
      validAppointmentIds.includes(id)
    );

  if (
    cleanedSeenNotifications.length !==
    seenNotifications.length
  ) {
    setSeenNotifications(
      cleanedSeenNotifications
    );

    localStorage.setItem(
      `doctorSeenNotifications_${user.id}`,
      JSON.stringify(
        cleanedSeenNotifications
      )
    );
  }
}, [appointments, seenNotifications, user.id]);

useEffect(() => {
  const savedNotifications =
    localStorage.getItem(
      `doctorSeenNotifications_${user.id}`
    );

  if (savedNotifications) {
    try {
      setSeenNotifications(
        JSON.parse(savedNotifications)
      );
    } catch (error) {
      console.error(
        "Failed to load notification state:",
        error
      );
    }
  }
}, [user.id]);

  useEffect(() => {
    loadDashboard();
  }, [user.id]);

  async function updateAppointmentStatus(
    appointmentId,
    status
  ) {
    try {
      const response = await apiFetch(
        `http://localhost:5000/api/doctor-dashboard/appointments/${appointmentId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update appointment."
        );
      }

      await loadDashboard();

    } catch (error) {
      console.error(error);

      setError(
        error.message ||
        "Unable to update appointment."
      );
    }
  }

async function viewPatient(patientId) {
  try {
    setPatientLoading(true);
    setPatientError("");

    const response = await apiFetch(
      `http://localhost:5000/api/doctor-dashboard/patient/${patientId}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load patient details."
      );
    }

    setSelectedPatient(data.patient);
    setPatientAppointments(data.appointments);

    // Wait for the patient section to render,
    // then scroll smoothly to it.
    setTimeout(() => {
      patientDetailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

  } catch (error) {
    console.error(error);

    setPatientError(
      error.message ||
      "Unable to load patient details."
    );

  } finally {
    setPatientLoading(false);
  }
}


function openProfileEditor() {
  setProfileError("");
  setProfileSuccess("");

  setProfileForm({
    name: doctor.name || "",
    email: doctor.email || "",
    specialty: doctor.specialty || "",
    experience_years: doctor.experience_years || "",
    description: doctor.description || "",
  });

  setEditingProfile(true);
}


function handleProfileChange(event) {
  const { name, value } = event.target;

  setProfileForm((previous) => ({
    ...previous,
    [name]: value,
  }));
}


function cancelProfileEdit() {
  setEditingProfile(false);
  setProfileError("");
  setProfileSuccess("");
}


async function saveProfile(event) {
  event.preventDefault();

  try {
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    const response = await apiFetch(
      `http://localhost:5000/api/doctor-dashboard/profile/${user.id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          specialty: profileForm.specialty,
          experience_years:
            Number(profileForm.experience_years) || 0,
          description: profileForm.description,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Failed to update profile."
      );
    }

    setDoctor(data.doctor);

    setProfileSuccess(
      "Your professional profile was updated successfully."
    );

    setEditingProfile(false);

  } catch (error) {

    console.error(error);

    setProfileError(
      error.message ||
      "Unable to update your profile."
    );

  } finally {

    setProfileSaving(false);

  }
}

  if (loading) {
    return (
      <div className="doctor-dashboard-page">
        <div className="doctor-dashboard-container">
          <p>Loading doctor dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="doctor-dashboard-page">
        <div className="doctor-dashboard-container">

          <div className="doctor-error">
            {error}
          </div>

        </div>
      </div>
    );
  }

  const pendingCount = appointments.filter(
    (appointment) =>
      appointment.status === "pending"
  ).length;

  const approvedCount = appointments.filter(
    (appointment) =>
      appointment.status === "approved"
  ).length;

  const completedCount = appointments.filter(
    (appointment) =>
      appointment.status === "completed"
  ).length;

  const rejectedCount = appointments.filter(
  (appointment) =>
    appointment.status === "rejected"
).length;

const pendingAppointments =
  appointments.filter(
    (appointment) =>
      appointment.status === "pending"
  );

const unreadNotifications =
  pendingAppointments.filter(
    (appointment) =>
      !seenNotifications.includes(
        appointment.id
      )
  );

const filteredAppointments =
  appointments
    .filter((appointment) => {

      const matchesStatus =
        statusFilter === "all" ||
        appointment.status === statusFilter;

      const searchTerm =
        appointmentSearch
          .trim()
          .toLowerCase();

      const matchesSearch =
        !searchTerm ||
        appointment.patient_name
          ?.toLowerCase()
          .includes(searchTerm) ||
        appointment.patient_email
          ?.toLowerCase()
          .includes(searchTerm);

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {

      if (appointmentSort === "newest") {
        return (
          new Date(b.appointment_date) -
          new Date(a.appointment_date)
        );
      }

      if (appointmentSort === "oldest") {
        return (
          new Date(a.appointment_date) -
          new Date(b.appointment_date)
        );
      }

      if (appointmentSort === "name-asc") {
        return (
          a.patient_name || ""
        ).localeCompare(
          b.patient_name || ""
        );
      }

      if (appointmentSort === "name-desc") {
        return (
          b.patient_name || ""
        ).localeCompare(
          a.patient_name || ""
        );
      }

      return 0;
    });

      function markNotificationAsSeen(
  appointmentId
) {
  if (
    seenNotifications.includes(
      appointmentId
    )
  ) {
    return;
  }

  const updatedSeenNotifications = [
    ...seenNotifications,
    appointmentId,
  ];

  setSeenNotifications(
    updatedSeenNotifications
  );

  localStorage.setItem(
    `doctorSeenNotifications_${user.id}`,
    JSON.stringify(
      updatedSeenNotifications
    )
  );
}

  return (
    <div className="doctor-dashboard-page">

      <div className="doctor-dashboard-container">

        {/* Header */}

        <div className="doctor-dashboard-header">

  <div>

    <p className="doctor-dashboard-label">
      Doctor Dashboard
    </p>

    <h1>
      Welcome, {doctor.name}
    </h1>

    <p>
      Manage your appointments and patient care.
    </p>

  </div>


  <div className="doctor-notification-wrapper">

    <button
      type="button"
      className="doctor-notification-button"
      onClick={() =>
        setShowNotifications(
          (previous) => !previous
        )
      }
      aria-label="Appointment notifications"
    >

      <span className="notification-bell">
        🔔
      </span>

     {unreadNotifications.length > 0 && (
  <span className="notification-badge">
    {unreadNotifications.length}
  </span>
)}

    </button>


    {showNotifications && (

      <div className="doctor-notification-panel">

        <div className="notification-panel-header">

          <div>
            <strong>
              Notifications
            </strong>

            <span>
              {pendingCount} pending appointment
              {pendingCount !== 1 ? "s" : ""}
            </span>
          </div>

        </div>


        {pendingCount === 0 ? (

          <div className="notification-empty">

            <span>
              ✓
            </span>

            <p>
              You're all caught up.
            </p>

            <small>
              No pending appointments.
            </small>

          </div>

        ) : (

          <div className="notification-list">

            {pendingAppointments.map(
  (appointment) => {
    const isUnread =
      !seenNotifications.includes(
        appointment.id
      );

    return (

                <button
                  type="button"
                  className="notification-item"
                  key={appointment.id}
                  onClick={() => {
                    setShowNotifications(false);
                    setStatusFilter("pending");
                  }}
                >

                  <div className="notification-item-icon">
                    📅
                  </div>

                  <div className="notification-item-content">

                    <strong>
                      New appointment
                    </strong>

                    <span>
                      {appointment.patient_name}
                    </span>

                    <small>
                      {new Date(
                        appointment.appointment_date
                      ).toLocaleString()}
                    </small>

                  </div>

                        </button>
    );
  }
)}

          </div>

        )}

      </div>

    )}

  </div>

</div>


        {/* Statistics */}

        <div className="doctor-stats">

          <div className="doctor-stat-card">

            <span>
              Total Appointments
            </span>

            <strong>
              {appointments.length}
            </strong>

          </div>


          <div className="doctor-stat-card">

            <span>
              Pending
            </span>

            <strong>
              {pendingCount}
            </strong>

          </div>


          <div className="doctor-stat-card">

            <span>
              Approved
            </span>

            <strong>
              {approvedCount}
            </strong>

          </div>


          <div className="doctor-stat-card">

            <span>
              Completed
            </span>

            <strong>
              {completedCount}
            </strong>

          </div>

        </div>


        {/* Error */}

        {error && (
          <div className="doctor-error">
            {error}
          </div>
        )}


        {/* Appointments */}

        <div className="doctor-section">
        <div className="doctor-filters">

  <button
    className={
      statusFilter === "all"
        ? "doctor-filter active"
        : "doctor-filter"
    }
    onClick={() => setStatusFilter("all")}
  >
    All
    <span>{appointments.length}</span>
  </button>

  <button
    className={
      statusFilter === "pending"
        ? "doctor-filter active"
        : "doctor-filter"
    }
    onClick={() => setStatusFilter("pending")}
  >
    Pending
    <span>{pendingCount}</span>
  </button>

  <button
    className={
      statusFilter === "approved"
        ? "doctor-filter active"
        : "doctor-filter"
    }
    onClick={() => setStatusFilter("approved")}
  >
    Approved
    <span>{approvedCount}</span>
  </button>

  <button
    className={
      statusFilter === "completed"
        ? "doctor-filter active"
        : "doctor-filter"
    }
    onClick={() => setStatusFilter("completed")}
  >
    Completed
    <span>{completedCount}</span>
  </button>

  <button
    className={
      statusFilter === "rejected"
        ? "doctor-filter active"
        : "doctor-filter"
    }
    onClick={() => setStatusFilter("rejected")}
  >
    Rejected
    <span>{rejectedCount}</span>
  </button>

</div>
          <div className="doctor-section-header">

  <div>

    <h2>
      Patient Appointments
    </h2>

    <p>
      {filteredAppointments.length} appointment
      {filteredAppointments.length !== 1
        ? "s"
        : ""}
    </p>

  </div>


  <div className="doctor-appointment-controls">

    <div className="doctor-appointment-search">

      <input
        type="text"
        placeholder="Search patient by name or email..."
        value={appointmentSearch}
        onChange={(event) =>
          setAppointmentSearch(
            event.target.value
          )
        }
      />

      {appointmentSearch && (
        <button
          type="button"
          onClick={() =>
            setAppointmentSearch("")
          }
          aria-label="Clear search"
        >
          ×
        </button>
      )}

    </div>


    <select
      className="doctor-appointment-sort"
      value={appointmentSort}
      onChange={(event) =>
        setAppointmentSort(
          event.target.value
        )
      }
    >

      <option value="newest">
        Newest first
      </option>

      <option value="oldest">
        Oldest first
      </option>

      <option value="name-asc">
        Patient A–Z
      </option>

      <option value="name-desc">
        Patient Z–A
      </option>

    </select>

  </div>

</div>


          {filteredAppointments.length === 0 ? (

            <div className="doctor-empty">

              <div>
                📅
              </div>

              <h3>
                No appointments yet
              </h3>

              <p>
                Appointments booked with you will appear here.
              </p>

            </div>

          ) : (

            <div className="doctor-appointments">

              {filteredAppointments.map(
                (appointment) => (

                  <div
                    className="doctor-appointment-card"
                    key={appointment.id}
                  >

                    <div className="appointment-patient">

                      <div className="patient-avatar">
                        👤
                      </div>

                      <div>

                        <h3>
                          {appointment.patient_name}
                        </h3>

                        <p>
                          {appointment.patient_email}
                        </p>

                      </div>

<button
  className="view-patient-button"
  onClick={() =>
    viewPatient(appointment.patient_id)
  }
>
  View Patient
</button>
                    </div>


                    <div className="appointment-info">

                      <div>

                        <span>
                          Date & Time
                        </span>

                        <strong>
                          {new Date(
                            appointment.appointment_date
                          ).toLocaleString()}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Status
                        </span>

                        <strong
                          className={`appointment-status ${appointment.status}`}
                        >
                          {appointment.status}
                        </strong>

                      </div>

                    </div>


                    {appointment.notes && (

                      <div className="appointment-notes">

                        <span>
                          Patient Notes
                        </span>

                        <p>
                          {appointment.notes}
                        </p>

                      </div>

                    )}


                   {appointment.status === "pending" && (
  <div className="appointment-actions">

    <button
      className="approve-button"
      onClick={() =>
        updateAppointmentStatus(
          appointment.id,
          "approved"
        )
      }
    >
      ✓ Approve
    </button>

    <button
      className="reject-button"
      onClick={() =>
        updateAppointmentStatus(
          appointment.id,
          "rejected"
        )
      }
    >
      ✕ Reject
    </button>

  </div>
)}


{appointment.status === "approved" && (
  <div className="appointment-actions">

    <button
      className="complete-button"
      onClick={() =>
        updateAppointmentStatus(
          appointment.id,
          "completed"
        )
      }
    >
      ✓ Mark as Completed
    </button>

  </div>
)}

                  </div>

                )
              )}

            </div>

          )}

        </div>

{/* Patient Details */}

{selectedPatient && (

  <div
    className="patient-details-section"
    ref={patientDetailsRef}
  >

    <div className="patient-details-header">

      <div>

        <p className="doctor-dashboard-label">
          Patient Information
        </p>

        <h2>
          {selectedPatient.name}
        </h2>

      </div>

      <button
        className="close-patient-button"
        onClick={() => {
          setSelectedPatient(null);
          setPatientAppointments([]);
          setPatientError("");
        }}
      >
        ×
      </button>

    </div>


    {patientLoading && (
      <p>
        Loading patient details...
      </p>
    )}


    {patientError && (
      <div className="doctor-error">
        {patientError}
      </div>
    )}


    {!patientLoading && !patientError && (

      <>

        <div className="patient-details-grid">

          <div>
            <span>Name</span>
            <strong>
              {selectedPatient.name}
            </strong>
          </div>

          <div>
            <span>Email</span>
            <strong>
              {selectedPatient.email}
            </strong>
          </div>

          <div>
            <span>Patient ID</span>
            <strong>
              #{selectedPatient.id}
            </strong>
          </div>

          <div>
            <span>Registered</span>
            <strong>
              {new Date(
                selectedPatient.created_at
              ).toLocaleDateString()}
            </strong>
          </div>

        </div>


        <div className="patient-history">

          <h3>
            Appointment History
          </h3>

          {patientAppointments.length === 0 ? (

            <p>
              No appointment history found.
            </p>

          ) : (

            <div className="patient-history-list">

              {patientAppointments.map(
                (appointment) => (

                  <div
                    className="patient-history-card"
                    key={appointment.id}
                  >

                    <div>

                      <strong>
                        {appointment.doctor_name}
                      </strong>

                      <span>
                        {appointment.specialty}
                      </span>

                    </div>

                    <div>

                      <span>
                        {new Date(
                          appointment.appointment_date
                        ).toLocaleString()}
                      </span>

                      <strong
                        className={`appointment-status ${appointment.status}`}
                      >
                        {appointment.status}
                      </strong>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </>

    )}

  </div>

)}

       {/* Doctor Profile */}

<div className="doctor-profile-section">

  <div className="doctor-profile-header">

    <div>
      <p className="doctor-dashboard-label">
        Professional Profile
      </p>

      <h2>
        My Professional Profile
      </h2>
    </div>

    {!editingProfile && (
      <button
        type="button"
        className="edit-profile-button"
        onClick={openProfileEditor}
      >
        ✎ Edit Profile
      </button>
    )}

  </div>


  {profileSuccess && (
    <div className="profile-message success">
      {profileSuccess}
    </div>
  )}


  {profileError && (
    <div className="profile-message error">
      {profileError}
    </div>
  )}


  {!editingProfile ? (

    <>
      <div className="doctor-profile-grid">

        <div>
          <span>
            Name
          </span>

          <strong>
            {doctor.name}
          </strong>
        </div>


        <div>
          <span>
            Specialty
          </span>

          <strong>
            {doctor.specialty}
          </strong>
        </div>


        <div>
          <span>
            Experience
          </span>

          <strong>
            {doctor.experience_years} years
          </strong>
        </div>


        <div>
          <span>
            Email
          </span>

          <strong>
            {doctor.email}
          </strong>
        </div>

      </div>


      {doctor.description && (

        <div className="doctor-description">

          <span>
            About
          </span>

          <p>
            {doctor.description}
          </p>

        </div>

      )}

    </>

  ) : (

    <form
      className="doctor-profile-edit-form"
      onSubmit={saveProfile}
    >

      <div className="profile-form-grid">

        <div className="profile-form-group">

          <label htmlFor="profile-name">
            Full Name
          </label>

          <input
            id="profile-name"
            name="name"
            type="text"
            value={profileForm.name}
            onChange={handleProfileChange}
            required
          />

        </div>


        <div className="profile-form-group">

          <label htmlFor="profile-email">
            Email
          </label>

          <input
            id="profile-email"
            name="email"
            type="email"
            value={profileForm.email}
            onChange={handleProfileChange}
            required
          />

        </div>


        <div className="profile-form-group">

          <label htmlFor="profile-specialty">
            Specialty
          </label>

          <input
            id="profile-specialty"
            name="specialty"
            type="text"
            value={profileForm.specialty}
            onChange={handleProfileChange}
            required
          />

        </div>


        <div className="profile-form-group">

          <label htmlFor="profile-experience">
            Experience
          </label>

          <input
            id="profile-experience"
            name="experience_years"
            type="number"
            min="0"
            value={profileForm.experience_years}
            onChange={handleProfileChange}
            required
          />

        </div>


        <div className="profile-form-group full-width">

          <label htmlFor="profile-description">
            About
          </label>

          <textarea
            id="profile-description"
            name="description"
            rows="5"
            value={profileForm.description}
            onChange={handleProfileChange}
            placeholder="Tell patients about your professional background..."
          />

        </div>

      </div>


      <div className="profile-form-actions">

        <button
          type="button"
          className="cancel-profile-button"
          onClick={cancelProfileEdit}
          disabled={profileSaving}
        >
          Cancel
        </button>


        <button
          type="submit"
          className="save-profile-button"
          disabled={profileSaving}
        >
          {profileSaving
            ? "Saving..."
            : "Save Changes"}
        </button>

      </div>

    </form>

  )}

</div>

      </div>

    </div>
  );
}

export default DoctorDashboard;
