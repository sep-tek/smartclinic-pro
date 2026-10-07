import { useState } from "react";
import { apiFetch } from "../api/api";
import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

 function handleChange(event) {
  const { name, value } = event.target;

  setFormData((previous) => ({
    ...previous,
    [name]: value,
  }));

  // Hide previous success/error message
  setStatus("");
}

  async function handleSubmit(event) {
    event.preventDefault();

    setStatus("");
    setIsSubmitting(true);

    try {
      const response = await apiFetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = response.data;

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message.");
      }

      setStatus("success");

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <p className="contact-label">GET IN TOUCH</p>

        <h1>
          We'd love to
          <span> hear from you.</span>
        </h1>

        <p>
          Have a question about SmartClinic Pro?
          Send us a message and our team will get back
          to you.
        </p>
      </section>

      <section className="contact-content">
        <div className="contact-info">
          <h2>Let's talk.</h2>

          <p>
            Whether you have a question, need support,
            or want to learn more about our platform,
            we're here to help.
          </p>

          <div className="contact-item">
            <h3>Email</h3>
            <p>support@smartclinicpro.com</p>
          </div>

          <div className="contact-item">
            <h3>Phone</h3>
            <p>+251 900 000 000</p>
          </div>

          <div className="contact-item">
            <h3>Location</h3>
            <p>Addis Ababa, Ethiopia</p>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>

            <input
              id="subject"
              name="subject"
              type="text"
              placeholder="How can we help?"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>

            <textarea
              id="message"
              name="message"
              placeholder="Write your message..."
              rows="6"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>

          {status === "success" && (
            <p className="contact-success">
              Your message has been sent successfully!
            </p>
          )}

          {status === "error" && (
            <p className="contact-error">
              Something went wrong. Please try again.
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Contact;
