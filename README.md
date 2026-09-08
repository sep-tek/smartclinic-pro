# SmartClinic Pro

SmartClinic Pro is a full-stack clinic management web application built with React, Node.js, Express, and PostgreSQL.

The project provides separate experiences for patients, doctors, and administrators, with authentication, appointment management, user management, doctor management, and contact message handling.

## Features

### Public

- Home, About, Services, Doctors, and Contact pages
- Public doctor directory
- Contact form with database storage
- Responsive navigation
- Privacy Policy and Terms & Conditions pages
- Custom 404 page

### Authentication

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Account activation and deactivation

### Patient

- Patient dashboard
- View available doctors
- Book appointments
- View personal appointments
- Appointment status tracking

### Doctor

- Doctor authentication
- Doctor dashboard
- Access restricted to the authenticated doctor
- Doctor profile and appointment-related API endpoints

### Administrator

- Admin dashboard
- User management
- Activate and deactivate user accounts
- Doctor management
- Create, update, and delete doctor accounts
- Appointment management
- Contact message management
- Search and filtering functionality

## Technology Stack

### Frontend

- React
- Vite
- React Router
- JavaScript
- CSS

### Backend

- Node.js
- Express
- JWT
- bcrypt

### Database

- PostgreSQL
- node-postgres (`pg`)

## Project Structure

```text
smartclinic-pro/
├── backend/
│   ├── database/
│   ├── middleware/
│   ├── routes/
│   ├── db.js
│   └── server.js
│
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── layouts/
│   ├── pages/
│   └── routes/
│
├── public/
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

## Security

The application implements several backend security measures:

- JWT authentication for protected API routes
- Role-based authorization
- Password hashing with bcrypt
- Authentication middleware for protected resources
- Verification that authenticated users still exist
- Account status checks
- Ownership checks for patient and doctor resources
- Protected administrative endpoints
- Environment variables for database credentials and JWT configuration

Sensitive configuration files such as `.env` are excluded from version control.

## Database

The application uses PostgreSQL to store application data.

The main tables include:

- `users`
- `doctors`
- `appointments`
- `contact_messages`

Relationships between users, doctors, and appointments are enforced through database constraints.

## API

The backend provides REST API endpoints for:

- Authentication
- Users
- Doctors
- Appointments
- Admin operations
- Contact messages
- Patient and doctor dashboards

Protected endpoints require a valid JWT access token.

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- PostgreSQL
- Git

### Clone the repository

```bash
git clone https://github.com/sep-tek/smartclinic-pro.git
cd smartclinic-pro
```

### Install frontend dependencies

```bash
npm install
```

### Install backend dependencies

```bash
cd backend
npm install
```

### Configure environment variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000

DB_USER=your_database_user
DB_HOST=localhost
DB_NAME=smartclinic
DB_PASSWORD=your_database_password
DB_PORT=5432

JWT_SECRET=your_jwt_secret
```

Do not commit the `.env` file to GitHub.

### Start the backend

From the `backend` directory:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

### Start the frontend

From the project root:

```bash
npm run dev
```

The frontend runs on the Vite development server.

## Testing

The project has been tested across the main authentication and authorization flows, including:

- User registration
- User login
- JWT authentication
- Role-based authorization
- Patient appointment access
- Doctor resource ownership
- Administrative access
- Protected API endpoints
- Contact form submission
- Appointment management

## Responsive Design

The frontend is designed to work across desktop, tablet, and mobile screen sizes.

## Future Improvements

Planned improvements include:

- Complete doctor dashboard functionality
- Appointment scheduling improvements
- Email notifications
- Advanced appointment filtering
- Improved reporting and analytics
- Production deployment
- Automated testing
- Improved error logging and monitoring

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Author

Teklehaymanot Gashaw

Software Engineering Student

GitHub: https://github.com/sep-tek