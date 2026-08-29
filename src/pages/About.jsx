import "./About.css";

function About() {
  return (
    <div className="about-page">

      <section className="about-hero">

        <div className="about-hero-content">

          <p className="about-label">
            ABOUT SMARTCLINIC PRO
          </p>

          <h1>
            Reimagining the way
            <span> healthcare works.</span>
          </h1>

          <p>
            SmartClinic Pro is a modern healthcare management
            platform designed to connect patients, doctors,
            and clinics through one simple digital experience.
          </p>

        </div>

      </section>


      <section className="mission-section">

        <div className="mission-content">

          <p className="section-label">
            OUR MISSION
          </p>

          <h2>
            Making healthcare simpler,
            smarter, and more accessible.
          </h2>

          <p>
            We believe technology should make healthcare easier
            for everyone. SmartClinic Pro brings appointments,
            healthcare services, doctors, and patient management
            together in one connected platform.
          </p>

        </div>

      </section>


      <section className="about-values">

        <div className="value-card">

          <h3>Patient First</h3>

          <p>
            Everything we build is designed around
            creating a better patient experience.
          </p>

        </div>


        <div className="value-card">

          <h3>Smart Technology</h3>

          <p>
            We use modern technology to simplify
            complex healthcare workflows.
          </p>

        </div>


        <div className="value-card">

          <h3>Trusted Care</h3>

          <p>
            We help patients connect with healthcare
            professionals they can trust.
          </p>

        </div>

      </section>


      <section className="about-cta">

        <h2>
          Healthcare should work for everyone.
        </h2>

        <p>
          Discover a smarter way to manage healthcare.
        </p>

      </section>

    </div>
  );
}

export default About;