import "./Privacy.css";

function Privacy() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">

        <div className="privacy-header">
          <p>SmartClinic Pro</p>
          <h1>Privacy Policy</h1>
          <span>
            Your privacy matters to us. This policy explains how
            SmartClinic Pro collects, uses, and protects your information.
          </span>
        </div>

        <div className="privacy-content">

          <section>
            <h2>1. Information We Collect</h2>
            <p>
              When you use SmartClinic Pro, we may collect information
              necessary to provide our services. This may include your name,
              email address, account information, appointment information,
              and messages submitted through our contact form.
            </p>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>
              We use collected information to create and manage user
              accounts, provide appointment services, communicate with
              users, manage clinic operations, and improve the SmartClinic
              Pro platform.
            </p>
          </section>

          <section>
            <h2>3. Account Information</h2>
            <p>
              Users are responsible for providing accurate information when
              creating an account. Account credentials should be kept
              confidential and should not be shared with other people.
            </p>
          </section>

          <section>
            <h2>4. Appointment Information</h2>
            <p>
              Information related to appointments may be stored in our
              system so that patients, doctors, and authorized administrators
              can manage appointments and provide appropriate services.
            </p>
          </section>

          <section>
            <h2>5. Data Security</h2>
            <p>
              We take reasonable technical and organizational measures to
              protect user information against unauthorized access,
              alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2>6. Cookies and Local Storage</h2>
            <p>
              SmartClinic Pro stores information in your browser to keep
              you signed in and to remember your preferences.
            </p>
            <p>
              When you sign in, one cookie named token is set. It holds
              your session token and is marked HttpOnly so that scripts
              cannot read it, marked SameSite=Lax, marked Secure on the
              deployed site, and set to expire after 24 hours. It is
              cleared when you sign out.
            </p>
            <p>
              Your browser's local storage is also used. It holds your
              token and your basic account details while you are signed
              in, your chosen theme, and, for doctors, which
              notifications have already been viewed. The API accepts
              either the session cookie or the stored token, so
              authentication does not depend on the cookie alone.
            </p>
            <p>
              Signing out clears the authentication token and your stored
              account details from both local storage and the cookie. Your
              theme choice and any notification state are kept after you
              sign out. To remove everything this site has stored in your
              browser, sign out and then clear site data for this site
              using your browser's settings.
            </p>
            <p>
              This information is used to maintain your session, to apply
              the appearance you selected, and to avoid repeating
              notifications you have already seen. It is not used for
              advertising or profiling, and the application does not
              include analytics or tracking scripts.
            </p>
          </section>

          <section>
            <h2>7. Information Sharing</h2>
            <p>
              We do not intentionally sell personal information to third
              parties. Information may be accessible to authorized users
              within the platform when necessary for providing clinic
              services and managing the system.
            </p>
          </section>

          <section>
            <h2>8. Contact Messages</h2>
            <p>
              Information submitted through the contact form may be stored
              so that authorized clinic administrators can review and respond
              to inquiries.
            </p>
          </section>

          <section>
            <h2>9. Data Retention</h2>
            <p>
              We retain information for as long as reasonably necessary to
              provide the services, maintain accounts, manage appointments,
              and fulfill legitimate administrative requirements.
            </p>
          </section>

          <section>
            <h2>10. Your Privacy Choices</h2>
            <p>
              If you have questions about your personal information or
              believe your information has been handled incorrectly, you
              can contact the SmartClinic Pro administration team.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>
              This Privacy Policy may be updated from time to time as
              SmartClinic Pro evolves. Any significant changes should be
              reflected on this page.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please use
              the contact form available on the SmartClinic Pro website.
            </p>
          </section>

        </div>

        <div className="privacy-footer">
          <span>Last updated: October 2026</span>
        </div>

      </div>
    </div>
  );
}

export default Privacy;
