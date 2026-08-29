import "./Home.css";

function Home() {
  return (
    <div className="home">

      <section className="hero">

        <div className="hero-content">

          <h1>
            The Future of
            <span> Healthcare Management</span>
          </h1>

          <p>
            SmartClinic Pro is a modern healthcare platform
            that connects patients, doctors, and clinics
            in one powerful system.
          </p>

          <div className="hero-buttons">

            <button>
              Get Started
            </button>

            <button className="secondary">
              Learn More
            </button>

          </div>

        </div>


        <div className="hero-card">

          <div className="card">

            <h3>
              Smart Healthcare
            </h3>

            <p>
              Manage appointments,
              patients and medical services easily.
            </p>

          </div>

        </div>

      </section>


      {/* ADD THE FEATURES SECTION HERE */}

      <section className="features">

        <h2>
          Why Choose SmartClinic Pro?
        </h2>

        <div className="feature-container">

          <div className="feature-card">
            <h3>Easy Booking</h3>
            <p>
              Patients can schedule appointments
              quickly and manage their visits.
            </p>
          </div>


          <div className="feature-card">
            <h3>Smart Management</h3>
            <p>
              Clinics can organize patients,
              doctors and appointments easily.
            </p>
          </div>


          <div className="feature-card">
            <h3>Better Healthcare</h3>
            <p>
              Connect patients with trusted
              healthcare professionals.
            </p>
          </div>

        </div>

      </section>

      <section className="services-preview">

  <h2>
    Our Healthcare Services
  </h2>


  <div className="service-container">

    <div className="service-card">
      <h3>
        General Consultation
      </h3>

      <p>
        Connect with experienced doctors
        for professional medical advice.
      </p>
    </div>


    <div className="service-card">
      <h3>
        Emergency Care
      </h3>

      <p>
        Quick access to urgent healthcare
        support when needed.
      </p>
    </div>


    <div className="service-card">
      <h3>
        Medical Checkups
      </h3>

      <p>
        Track your health with regular
        medical examinations.
      </p>
    </div>


    <div className="service-card">
      <h3>
        Online Appointments
      </h3>

      <p>
        Book appointments easily from
        anywhere.
      </p>
    </div>


  </div>

</section>

<section className="doctors-preview">

  <h2>
    Meet Our Specialists
  </h2>

  <p className="section-description">
    Connect with experienced healthcare professionals
    across different medical specialties.
  </p>

  <div className="doctor-container">

    <div className="doctor-card">
      <div className="doctor-avatar">
        DR
      </div>

      <h3>Dr. Sarah Johnson</h3>

      <p className="doctor-specialty">
        Cardiologist
      </p>

      <p>
        Specializes in cardiovascular health
        and preventive care.
      </p>

      <button>
        View Profile
      </button>
    </div>


    <div className="doctor-card">
      <div className="doctor-avatar">
        DR
      </div>

      <h3>Dr. Michael Carter</h3>

      <p className="doctor-specialty">
        Neurologist
      </p>

      <p>
        Focused on neurological diagnosis,
        treatment and patient care.
      </p>

      <button>
        View Profile
      </button>
    </div>


    <div className="doctor-card">
      <div className="doctor-avatar">
        DR
      </div>

      <h3>Dr. Emily Wilson</h3>

      <p className="doctor-specialty">
        Pediatrician
      </p>

      <p>
        Provides compassionate healthcare
        for children and families.
      </p>

      <button>
        View Profile
      </button>
    </div>

  </div>

</section>


<section className="testimonials">

  <h2>
    What Our Patients Say
  </h2>

  <p className="section-description">
    See how SmartClinic Pro makes healthcare
    simpler and more accessible.
  </p>

  <div className="testimonial-container">

    <div className="testimonial-card">
      <p>
        "Booking an appointment used to take so much
        time. SmartClinic Pro made the whole process
        incredibly simple."
      </p>

      <h3>James Anderson</h3>
      <span>Patient</span>
    </div>


    <div className="testimonial-card">
      <p>
        "The platform is easy to use and I can manage
        all my appointments from one place."
      </p>

      <h3>Maria Thompson</h3>
      <span>Patient</span>
    </div>


    <div className="testimonial-card">
      <p>
        "A clean and modern healthcare platform.
        Finding the right doctor has never been easier."
      </p>

      <h3>Daniel Williams</h3>
      <span>Patient</span>
    </div>

  </div>

</section>

<section className="cta">

  <div className="cta-content">

    <h2>
      Ready to take control of your healthcare?
    </h2>

    <p>
      Join SmartClinic Pro and experience
      a smarter way to manage your healthcare.
    </p>

    <button>
      Get Started
    </button>

  </div>

</section>


    </div>
  );
}

export default Home;