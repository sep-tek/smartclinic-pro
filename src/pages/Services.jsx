import "./Services.css";

function Services() {
  const services = [
    {
      title: "General Consultation",
      description:
        "Connect with qualified healthcare professionals for general medical advice and consultation.",
    },
    {
      title: "Emergency Care",
      description:
        "Get quick access to emergency healthcare services when you need immediate medical attention.",
    },
    {
      title: "Medical Checkups",
      description:
        "Keep track of your health with regular medical examinations and preventive care.",
    },
    {
      title: "Online Appointments",
      description:
        "Schedule appointments with doctors from anywhere without having to wait in line.",
    },
    {
      title: "Laboratory Services",
      description:
        "Access essential laboratory testing and receive your results through a connected system.",
    },
    {
      title: "Specialist Consultation",
      description:
        "Find and connect with specialists across different areas of healthcare.",
    },
  ];

  return (
    <div className="services-page">

      <section className="services-hero">

        <p className="services-label">
          OUR SERVICES
        </p>

        <h1>
          Healthcare services,
          <span> reimagined.</span>
        </h1>

        <p>
          SmartClinic Pro brings essential healthcare
          services together in one simple and connected
          platform.
        </p>

      </section>


      <section className="services-list">

        <div className="services-grid">

          {services.map((service) => (
            <div
              className="service-page-card"
              key={service.title}
            >

              <div className="service-icon">
                +
              </div>

              <h2>
                {service.title}
              </h2>

              <p>
                {service.description}
              </p>

              <button>
                Learn More
              </button>

            </div>
          ))}

        </div>

      </section>


      <section className="services-cta">

        <h2>
          Need help choosing a service?
        </h2>

        <p>
          Our platform makes it easy to find the
          healthcare service that's right for you.
        </p>

        <button>
          Contact Us
        </button>

      </section>

    </div>
  );
}

export default Services;