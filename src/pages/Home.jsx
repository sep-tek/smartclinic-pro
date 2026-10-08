import { Link } from "react-router-dom";
import { useRef } from "react";

import {
  motion,
  useScroll,
  useTransform,
} from "motion/react";

import EnergyCoreVisual from "../components/EnergyCoreVisual";

import "./Home.css";

function Home() {
  const heroRef = useRef(null);
  const experienceRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  // Subtle hero image parallax.
  // The image moves slightly downward as the hero leaves the screen.
  const heroImageY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, 80]
  );

  const {
  scrollYProgress: experienceScrollProgress,
} = useScroll({
  target: experienceRef,
  offset: ["start end", "end start"],
});

const experienceRotate = useTransform(
  experienceScrollProgress,
  [0, 1],
  [-12, 12]
);

const experienceScale = useTransform(
  experienceScrollProgress,
  [0, 0.5, 1],
  [0.92, 1, 0.96]
);

  return (
    <main className="home">

      {/* =========================
          HERO
      ========================= */}

      <section
        ref={heroRef}
        className="home-hero"
      >
        <div className="hero-topline">
          <span>SMARTCLINIC PRO</span>
          <span>HEALTHCARE / 01</span>
        </div>

        <div className="hero-main">

          <div className="hero-copy">

            <p className="hero-label">
              A NEW WAY TO MANAGE HEALTHCARE
            </p>

            <h1>
              Healthcare
              <span>simplified.</span>
            </h1>

            <p className="hero-description">
              A connected healthcare platform bringing
              patients, doctors, and clinics together
              through one intelligent experience.
            </p>

            <div className="hero-actions">

              <Link
                to="/register"
                className="hero-primary"
              >
                Get started
                <span>↗</span>
              </Link>

              <Link
                to="/about"
                className="hero-secondary"
              >
                Explore
              </Link>

            </div>

          </div>

          <div className="hero-art">

            <div className="hero-art-glow"></div>

            <motion.div
              className="hero-art-image"
              style={{
                y: heroImageY,
              }}
            >
              <img
                src="/images/hero-healthcare.png"
                alt="SmartClinic Pro healthcare technology"
              />
            </motion.div>

            <div className="hero-art-label">
              <span>01</span>
              <span>CONNECTED CARE</span>
            </div>

          </div>

        </div>

        <div className="hero-bottom">

          <span>
            Scroll to explore
          </span>

          <span className="scroll-line"></span>

          <span>
            ↓
          </span>

        </div>

      </section>


      {/* =========================
          INTRO
      ========================= */}

      <motion.section
        className="home-intro"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{
          once: false,
          amount: 0.5,
        }}
        transition={{
          duration: 1.5,
          ease: [0.16, 1, 0.3, 1],
        }}
      >

        <div className="section-index">
          02 / INTRODUCTION
        </div>

        <div className="intro-content">

          <p className="intro-small">
            HEALTHCARE IS COMPLEX.
            <br />
            THE EXPERIENCE DOESN'T HAVE TO BE.
          </p>

          <motion.h2
            initial={{
              opacity: 0,
              y: 100,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: false,
              amount: 0.5,
            }}
            transition={{
              duration: 1.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            We believe managing{" "}
            <span>healthcare</span>{" "}
            should feel{" "}
            <em>effortless.</em>
          </motion.h2>
          <motion.p
            className="intro-description"
            initial={{
              opacity: 0,
              y: 60,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: false,
              amount: 0.5,
            }}
            transition={{
              duration: 1.3,
              delay: 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            SmartClinic Pro removes unnecessary complexity
            from healthcare management and creates a
            seamless connection between the people who
            provide care and the people who need it.
          </motion.p>

        </div>

      </motion.section>


      {/* =========================
          PLATFORM
      ========================= */}

      <section className="platform-section">

        <div className="section-index">
          03 / THE PLATFORM
        </div>

        <div className="platform-heading">

          <p>
            ONE PLATFORM.
          </p>

          <h2>
            Three connected
            <span> experiences.</span>
          </h2>

        </div>

        <motion.div
          className="platform-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: false,
            amount: 0.35,
          }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.45,
              },
            },
          }}
        >

            <motion.article
              className="platform-item"
              variants={{
                hidden: {
                  opacity: 0,
                  x: -80,
                },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    duration: 1.4,
                    ease: [0.16, 1, 0.3, 1],
                  },
                },
              }}
            >

              <div className="platform-number">
                01
              </div>

              <div className="platform-line"></div>

              <h3>
                Patients
              </h3>

              <p>
                Find doctors, book appointments,
                and manage your healthcare journey
                from one place.
              </p>

              <Link to="/services">
                <span>Explore patient care →</span>
              </Link>

            </motion.article>


            <motion.article
              className="platform-item"
              variants={{
                hidden: {
                  opacity: 0,
                  x: -80,
                },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    duration: 1.4,
                    ease: [0.16, 1, 0.3, 1],
                  },
                },
              }}
            >

              <div className="platform-number">
                02
              </div>

              <div className="platform-line"></div>

              <h3>
                Doctors
              </h3>

              <p>
                Manage appointments, patients,
                and professional information
                through a connected workspace.
              </p>

              <Link to="/doctors">
                <span>Explore doctor tools →</span>
              </Link>

            </motion.article>


            <motion.article
              className="platform-item"
              variants={{
                hidden: {
                  opacity: 0,
                  x: -80,
                },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    duration: 1.4,
                    ease: [0.16, 1, 0.3, 1],
                  },
                },
              }}
            >

              <div className="platform-number">
                03
              </div>

              <div className="platform-line"></div>

              <h3>
                Clinics
              </h3>

              <p>
                Organize healthcare operations,
                manage users, and keep everything
                connected in one system.
              </p>

              <Link to="/about">
                <span>Explore clinic management →</span>
              </Link>

            </motion.article>

          </motion.div>

      </section>


      {/* =========================
          EXPERIENCE
      ========================= */}

      <section
  ref={experienceRef}
  className="experience-section"
>

        <div className="section-index">
          04 / THE EXPERIENCE
        </div>

        <div className="experience-content">

          <div className="experience-heading">

            <p>
              DESIGNED AROUND PEOPLE
            </p>

            <h2>
              Better technology.
              <br />
              <span>Better care.</span>
            </h2>

          </div>

          <div className="experience-text">

            <p>
              From booking an appointment to managing
              an entire clinic, every part of SmartClinic Pro
              is designed to reduce friction and create a
              clearer healthcare experience.
            </p>

            <Link to="/services">
              Discover our services
              <span>↗</span>
            </Link>

          </div>

        </div>

        <motion.div
  className="experience-visual"
  initial={{ opacity: 0, y: 48 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: false, amount: 0.4 }}
  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
  style={{
    rotate: experienceRotate,
    scale: experienceScale,
  }}
>

          <EnergyCoreVisual />

        </motion.div>

      </section>


      {/* =========================
          CTA
      ========================= */}

      <section className="home-final">

        <p>
          READY WHEN YOU ARE
        </p>

        <h2>
          Let's make healthcare
          <span> better.</span>
        </h2>

        <Link
          to="/register"
          className="final-button"
        >
          Get started
          <span>↗</span>
        </Link>

      </section>

    </main>
  );
}

export default Home;