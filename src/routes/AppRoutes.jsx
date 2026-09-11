import { Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";

import Home from "../pages/Home";
import About from "../pages/About";
import Services from "../pages/Services";
import Doctors from "../pages/Doctors";
import Contact from "../pages/Contact";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Appointments from "../pages/Appointments";

import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";

import AdminDoctors from "../pages/AdminDoctors";
import AdminUsers from "../pages/AdminUsers";
import AdminAppointments from "../pages/AdminAppointments";
import AdminDashboard from "../pages/AdminDashboard";
import AdminContactMessages from "../pages/AdminContactMessages";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";

function AppRoutes() {
  return (
    <Routes>

      {/* =========================
          PUBLIC WEBSITE
      ========================= */}

      <Route element={<PublicLayout />}>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/services"
          element={<Services />}
        />

        <Route
          path="/doctors"
          element={<Doctors />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
      <Route path="/privacy" element={<Privacy />} />

      <Route path="/terms" element={<Terms />} />

      <Route path="*" element={<NotFound />} />

        {/* =========================
            PATIENT DASHBOARD
        ========================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          }
        />

        <Route path="/profile" element={<Profile />} />

      </Route>


      {/* =========================
          ADMIN PANEL
      ========================= */}

      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />

        <Route
          path="/admin/doctors"
          element={<AdminDoctors />}
        />

        <Route
          path="/admin/appointments"
          element={<AdminAppointments />}
        />

        <Route
          path="/admin/contact-messages"
          element={<AdminContactMessages />}
        />

      </Route>

    </Routes>
  );
}


export default AppRoutes;