import { useEffect, useState } from "react";
import "./AdminDoctors.css";

function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteMessage, setDeleteMessage] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialty: "",
    experience_years: "",
    description: "",
  });


  // =====================================================
  // LOAD DOCTORS
  // =====================================================

  async function loadDoctors() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/doctors"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to load doctors."
        );
      }

      setDoctors(data);

    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "Unable to load doctors."
      );

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    loadDoctors();
  }, []);


  // =====================================================
  // FORM HANDLING
  // =====================================================

  function handleChange(event) {

    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  }


  function resetForm() {

    setFormData({
      name: "",
      email: "",
      password: "",
      specialty: "",
      experience_years: "",
      description: "",
    });

    setEditingDoctor(null);
    setShowForm(false);

  }


  function openAddForm() {

    setSuccess("");
    setError("");

    setEditingDoctor(null);

    setFormData({
      name: "",
      email: "",
      password: "",
      specialty: "",
      experience_years: "",
      description: "",
    });

    setShowForm(true);

  }


  function openEditForm(doctor) {

    setSuccess("");
    setError("");

    setEditingDoctor(doctor);

    setFormData({
      name: doctor.name || "",
      email: doctor.email || "",
      password: "",
      specialty: doctor.specialty || "",
      experience_years:
        doctor.experience_years || "",
      description:
        doctor.description || "",
    });

    setShowForm(true);

  }


  // =====================================================
  // SAVE DOCTOR
  // =====================================================

  async function handleSubmit(event) {

    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");


    try {

      const isEditing =
        Boolean(editingDoctor);


      const url = isEditing
        ? `http://localhost:5000/api/doctors/${editingDoctor.id}`
        : "http://localhost:5000/api/doctors";


      const method =
        isEditing
          ? "PUT"
          : "POST";


      const body = {
        name: formData.name,
        email: formData.email,
        specialty: formData.specialty,
        experience_years:
          Number(formData.experience_years) || 0,
        description:
          formData.description,
      };


      // Password is required only when creating
      if (!isEditing) {
        body.password =
          formData.password;
      }


      const response = await fetch(
        url,
        {
          method,

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(body),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to save doctor."
        );
      }


      setSuccess(
        isEditing
          ? "Doctor updated successfully."
          : "Doctor added successfully."
      );


      resetForm();

      await loadDoctors();


    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "Unable to save doctor."
      );

    } finally {

      setSaving(false);

    }

  }


  // =====================================================
  // DELETE DOCTOR
  // =====================================================

  async function handleDelete(doctor) {

  const confirmed = window.confirm(
    `Are you sure you want to delete ${doctor.name}?`
  );

  if (!confirmed) {
    return;
  }

  // Clear any previous message for this doctor
  setDeleteMessage((previous) => ({
    ...previous,
    [doctor.id]: {
      type: "loading",
      text: "Deleting doctor..."
    }
  }));


  try {

    const response = await fetch(
      `http://localhost:5000/api/doctors/${doctor.id}`,
      {
        method: "DELETE",
      }
    );


    const data = await response.json();


    if (!response.ok) {

      setDeleteMessage((previous) => ({
        ...previous,
        [doctor.id]: {
          type: "error",
          text:
            data.message ||
            "This doctor could not be deleted."
        }
      }));

      return;
    }


    // Remove doctor immediately from the list
    setDoctors((previous) =>
      previous.filter(
        (item) => item.id !== doctor.id
      )
    );


    // Show success message where the doctor was
    setDeleteMessage((previous) => ({
      ...previous,
      [doctor.id]: {
        type: "success",
        text: "Doctor deleted successfully."
      }
    }));


  } catch (error) {

    console.error(error);

    setDeleteMessage((previous) => ({
      ...previous,
      [doctor.id]: {
        type: "error",
        text:
          error.message ||
          "Unable to delete doctor."
      }
    }));

  }

}


  return (
    <div className="admin-doctors-page">

      <div className="admin-doctors-container">

        {/* Header */}

        <div className="admin-doctors-header">

          <div>

            <p>
              Administration
            </p>

            <h1>
              Manage Doctors
            </h1>

            <span>
              Add, edit and manage clinic doctors.
            </span>

          </div>


          <button
            type="button"
            className="add-doctor-button"
            onClick={openAddForm}
          >
            + Add Doctor
          </button>

        </div>


        {/* Messages */}

        {error && (
          <div className="doctor-message error">
            {error}
          </div>
        )}


        {success && (
          <div className="doctor-message success">
            {success}
          </div>
        )}


        {/* Add / Edit Form */}

        {showForm && (

          <div className="doctor-form-card">

            <div className="doctor-form-header">

              <div>

                <p>
                  {editingDoctor
                    ? "Edit Doctor"
                    : "New Doctor"}
                </p>

                <h2>
                  {editingDoctor
                    ? "Update doctor information"
                    : "Add a new doctor"}
                </h2>

              </div>


              <button
                type="button"
                className="close-form-button"
                onClick={resetForm}
              >
                ×
              </button>

            </div>


            <form
              className="doctor-form"
              onSubmit={handleSubmit}
            >

              <div className="doctor-form-grid">

                <div className="form-group">

                  <label htmlFor="name">
                    Full Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Dr. John Anderson"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="form-group">

                  <label htmlFor="email">
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="doctor@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                </div>


                {!editingDoctor && (

                  <div className="form-group">

                    <label htmlFor="password">
                      Password
                    </label>

                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />

                  </div>

                )}


                <div className="form-group">

                  <label htmlFor="specialty">
                    Specialty
                  </label>

                  <input
                    id="specialty"
                    name="specialty"
                    type="text"
                    placeholder="Cardiology"
                    value={formData.specialty}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="form-group">

                  <label htmlFor="experience_years">
                    Experience
                  </label>

                  <input
                    id="experience_years"
                    name="experience_years"
                    type="number"
                    min="0"
                    placeholder="5"
                    value={
                      formData.experience_years
                    }
                    onChange={handleChange}
                  />

                </div>


                <div className="form-group full-width">

                  <label htmlFor="description">
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows="4"
                    placeholder="Brief description about the doctor..."
                    value={
                      formData.description
                    }
                    onChange={handleChange}
                  />

                </div>

              </div>


              <div className="doctor-form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-doctor-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingDoctor
                      ? "Update Doctor"
                      : "Create Doctor"}
                </button>

              </div>

            </form>

          </div>

        )}


        {/* Doctors List */}

        <div className="doctors-list">

          {loading ? (

            <div className="doctor-message">
              Loading doctors...
            </div>

          ) : doctors.length === 0 ? (

            <div className="doctor-message">
              No doctors found.
            </div>

          ) : (

            doctors.map((doctor) => (

              <div
                className="admin-doctor-card"
                key={doctor.id}
              >

                <div className="doctor-card-main">

                  <div className="doctor-avatar">
                    👨‍⚕️
                  </div>


                  <div className="doctor-card-info">

                    <h2>
                      {doctor.name}
                    </h2>

                    <p className="doctor-specialty">
                      {doctor.specialty}
                    </p>

                    {doctor.email && (
                      <p className="doctor-email">
                        {doctor.email}
                      </p>
                    )}

                    <p className="doctor-experience">
                      {doctor.experience_years || 0}
                      {" "}
                      years experience
                    </p>

                    {doctor.description && (
                      <p className="doctor-description">
                        {doctor.description}
                      </p>
                    )}

                  </div>

                </div>


                <div className="doctor-card-actions">

  <button
    type="button"
    className="edit-doctor-button"
    onClick={() =>
      openEditForm(doctor)
    }
  >
    Edit
  </button>


  <button
    type="button"
    className="delete-doctor-button"
    onClick={() =>
      handleDelete(doctor)
    }
    disabled={
      deleteMessage[doctor.id]?.type === "loading"
    }
  >
    {deleteMessage[doctor.id]?.type === "loading"
      ? "Deleting..."
      : "Delete"}
  </button>

</div>


{deleteMessage[doctor.id] && (
  <div
    className={`doctor-delete-message ${
      deleteMessage[doctor.id].type
    }`}
  >
    {deleteMessage[doctor.id].text}
  </div>
)}

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
}

export default AdminDoctors;