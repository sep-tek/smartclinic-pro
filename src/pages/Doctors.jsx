import "./Doctors.css";

function Doctors() {
  const doctors = [
    {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      experience: "12 years experience",
      description:
        "Specializes in cardiovascular health, preventive care, and heart disease management.",
    },
    {
      name: "Dr. Michael Carter",
      specialty: "Neurologist",
      experience: "10 years experience",
      description:
        "Focused on neurological diagnosis, treatment, and long-term patient care.",
    },
    {
      name: "Dr. Emily Wilson",
      specialty: "Pediatrician",
      experience: "8 years experience",
      description:
        "Provides compassionate healthcare for children, infants, and families.",
    },
    {
      name: "Dr. David Anderson",
      specialty: "Dermatologist",
      experience: "9 years experience",
      description:
        "Specializes in diagnosing and treating skin, hair, and nail conditions.",
    },
    {
      name: "Dr. Olivia Brown",
      specialty: "General Physician",
      experience: "11 years experience",
      description:
        "Provides comprehensive primary healthcare and preventive medical services.",
    },
    {
      name: "Dr. James Miller",
      specialty: "Orthopedic Specialist",
      experience: "14 years experience",
      description:
        "Focused on bone, joint, muscle, and orthopedic health and treatment.",
    },
  ];

  return (
    <div className="doctors-page">

      <section className="doctors-hero">

        <p className="doctors-label">
          OUR DOCTORS
        </p>

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

        <div className="doctors-grid">

          {doctors.map((doctor) => (
            <div
              className="doctor-page-card"
              key={doctor.name}
            >

              <div className="doctor-profile">

                <div className="doctor-avatar-large">
                  DR
                </div>

                <div>
                  <h2>
                    {doctor.name}
                  </h2>

                  <p className="doctor-specialty">
                    {doctor.specialty}
                  </p>
                </div>

              </div>


              <div className="doctor-experience">
                {doctor.experience}
              </div>


              <p className="doctor-description">
                {doctor.description}
              </p>


              <button>
                View Profile
              </button>

            </div>
          ))}

        </div>

      </section>

    </div>
  );
}

export default Doctors;