import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-top">

        <div className="footer-index">
          05 / CONTACT
        </div>

        <div className="footer-main">

          <div className="footer-brand">

            <Link
              to="/"
              className="footer-logo"
            >
              SmartClinic<span>Pro</span>
            </Link>

            <p>
              A connected healthcare platform
              designed to make healthcare
              management simpler.
            </p>

          </div>


          <div className="footer-navigation">

            <div className="footer-column">

              <span className="footer-column-label">
                EXPLORE
              </span>

              <Link to="/about">
                About
              </Link>

              <Link to="/services">
                Services
              </Link>

              <Link to="/doctors">
                Doctors
              </Link>

              <Link to="/contact">
                Contact
              </Link>

            </div>


            <div className="footer-column">

              <span className="footer-column-label">
                ACCOUNT
              </span>

              <Link to="/login">
                Login
              </Link>

              <Link to="/register">
                Create account
              </Link>

            </div>


            <div className="footer-column">

              <span className="footer-column-label">
                CONTACT
              </span>

              <p>
                support@smartclinicpro.com
              </p>

              <p>
                +251 900 000 000
              </p>

              <p>
                Addis Ababa, Ethiopia
              </p>

            </div>

          </div>

        </div>

      </div>


      <div className="footer-statement">

        <p>
          HEALTHCARE
        </p>

        <h2>
          Better technology.
          <span> Better care.</span>
        </h2>

      </div>


      <div className="footer-bottom">

        <p>
          © 2026 SmartClinic Pro.
          All rights reserved.
        </p>

        <div className="footer-legal">

          <Link to="/privacy">
            Privacy Policy
          </Link>

          <Link to="/terms">
            Terms of Service
          </Link>

        </div>

        <span className="footer-location">
          ADDIS ABABA / ETHIOPIA
        </span>

      </div>

    </footer>
  );
}

export default Footer;