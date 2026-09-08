CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'patient',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    specialty VARCHAR(100) NOT NULL,

    experience_years INTEGER NOT NULL,

    description TEXT,

    user_id INTEGER UNIQUE,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,

    patient_id INTEGER NOT NULL,

    doctor_id INTEGER NOT NULL,

    appointment_date TIMESTAMP NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patient
        FOREIGN KEY (patient_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL,

    subject VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO services (name, description)
VALUES
(
    'General Consultation',
    'General medical consultation and primary healthcare services.'
),
(
    'Emergency Care',
    'Immediate medical attention for urgent healthcare needs.'
),
(
    'Medical Checkups',
    'Routine medical examinations and preventive healthcare.'
),
(
    'Online Appointments',
    'Schedule appointments with healthcare professionals online.'
),
(
    'Laboratory Services',
    'Essential laboratory testing and diagnostic services.'
),
(
    'Specialist Consultation',
    'Consultation with specialized healthcare professionals.'
)
ON CONFLICT DO NOTHING;