import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            SmartClinic<span>Pro</span>
          </Link>

          <p>
            A modern healthcare platform designed to
            make healthcare management simpler.
          </p>
        </div>


        <div className="footer-links">

          <h3>Company</h3>

          <Link to="/about">About</Link>
          <Link to="/services">Services</Link>
          <Link to="/doctors">Doctors</Link>
          <Link to="/contact">Contact</Link>

        </div>


        <div className="footer-links">

          <h3>Account</h3>

          <Link to="/login">Login</Link>
          <Link to="/register">Create Account</Link>

        </div>


        <div className="footer-contact">

          <h3>Contact</h3>

          <p>support@smartclinicpro.com</p>
          <p>+251 900 000 000</p>
          <p>Addis Ababa, Ethiopia</p>

        </div>

      </div>


      <div className="footer-bottom">

        <p>
          © 2026 SmartClinic Pro. All rights reserved.
        </p>

        <div>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>

      </div>

    </footer>
  );
}

export default Footer;