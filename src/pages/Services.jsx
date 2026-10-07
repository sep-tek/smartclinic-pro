import { Link } from "react-router-dom";
import { SERVICES } from "../data/services";
import "./Services.css";

function Services() {
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

          {SERVICES.map((service) => (
            <div
              className="service-page-card"
              key={service.slug}
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

              <Link
                className="service-learn-more"
                to={`/services/${service.slug}`}
              >
                Learn More
              </Link>

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

        <Link
          className="services-cta-link"
          to="/contact"
        >
          Contact Us
        </Link>

      </section>

    </div>
  );
}

export default Services;