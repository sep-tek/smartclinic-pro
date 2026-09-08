import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">

        <div className="not-found-code">
          404
        </div>

        <p className="not-found-label">
          Page Not Found
        </p>

        <h1>
          Looks like this page went missing.
        </h1>

        <p className="not-found-description">
          The page you're looking for doesn't exist, may have been moved,
          or the URL you entered is incorrect.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-home-button">
            Back to Home
          </Link>

          <Link to="/contact" className="not-found-contact-button">
            Contact Us
          </Link>
        </div>

      </div>
    </div>
  );
}

export default NotFound;
