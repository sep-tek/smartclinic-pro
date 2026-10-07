import { Link, useParams } from "react-router-dom";
import { SERVICES } from "../data/services";
import "./ServiceDetails.css";

function ServiceDetails() {
  const { serviceSlug } = useParams();

  const service = SERVICES.find(
    (item) => item.slug === serviceSlug
  );

  if (!service) {
    return (
      <div className="service-details-page">
        <section className="service-details-hero">
          <p className="service-details-label">
            SERVICE
          </p>

          <h1>Service not found.</h1>

          <p>
            The service you are looking for does not
            exist or may have been removed.
          </p>

          <Link
            to="/services"
            className="service-details-link"
          >
            Back to services
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="service-details-page">

      <section className="service-details-hero">

        <p className="service-details-label">
          OUR SERVICES
        </p>

        <h1>
          {service.title}
        </h1>

        <p>
          {service.description}
        </p>

        <div className="service-details-actions">

          <Link
            to="/services"
            className="service-details-link"
          >
            Back to services
          </Link>

          <Link
            to="/contact"
            className="service-details-link primary"
          >
            Contact us
          </Link>

        </div>

      </section>

    </div>
  );
}

export default ServiceDetails;
