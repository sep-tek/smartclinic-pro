import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../api/api";
import { apiFetch } from "../api/api";
import "./AdminUsers.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Scroll target for filtered results
  const resultsRef = useRef(null);

  /* Bumped only by a deliberate click on a filter button, so the
     effect below can tell "the user asked to see results" apart
     from "the page is rendering". That keeps the initial load
     from scrolling, while a click on an already-selected filter
     (Total Users included) still scrolls, because the value
     changes even though `selectedRole` does not. */

  const [scrollRequest, setScrollRequest] = useState(0);

  // Bring the filtered results into view after a filter is clicked
  /* Runs after the click has been committed, so the newly
     filtered rows are already rendered. `loading` is a dependency
     so a click that lands mid-request scrolls once the rows
     arrive rather than being dropped. */

  useEffect(() => {
    if (scrollRequest === 0 || loading) {
      return;
    }

    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [scrollRequest, loading]);

  function handleFilterSelect(role) {
    setSelectedRole(role);
    setScrollRequest((previous) => previous + 1);
  }


  // =====================================================
  // LOAD USERS
  // =====================================================

  async function loadUsers() {
    try {

      setError("");

      const response = await apiFetch(
        `${API_BASE_URL}/api/users`
      );

      const data = response.data;

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load users."
        );
      }

      setUsers(data);

    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "Unable to load users."
      );

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    loadUsers();
  }, []);


  // =====================================================
  // ACTIVATE / DEACTIVATE USER
  // =====================================================

  async function handleAccountStatus(user) {

    const action = user.is_active
      ? "deactivate"
      : "activate";


    const confirmed = window.confirm(
      user.is_active
        ? `Are you sure you want to deactivate ${user.name}'s account?`
        : `Are you sure you want to reactivate ${user.name}'s account?`
    );


    if (!confirmed) {
      return;
    }


    try {

      setActionLoading(user.id);

      setError("");
      setMessage("");


      const response = await apiFetch(
        `${API_BASE_URL}/api/users/${user.id}/${action}`,
        {
          method: "PATCH",
        }
      );


      const data = response.data;


      if (!response.ok) {

        throw new Error(
          data.message ||
          `Failed to ${action} user.`
        );

      }


      // Update user directly in the current list

      setUsers((previousUsers) =>
        previousUsers.map((currentUser) =>
          currentUser.id === user.id
            ? data.user
            : currentUser
        )
      );


      setMessage(
        data.message
      );


    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "Something went wrong."
      );

    } finally {

      setActionLoading(null);

    }

  }


  // =====================================================
  // FILTER USERS
  // =====================================================

  const filteredUsers =
    users.filter((user) => {

      const matchesRole =
        selectedRole === "all" ||
        user.role === selectedRole;


      const search =
        searchTerm.toLowerCase().trim();


      const matchesSearch =
        !search ||
        user.name
          .toLowerCase()
          .includes(search) ||
        user.email
          .toLowerCase()
          .includes(search);


      return (
        matchesRole &&
        matchesSearch
      );

    });


  // =====================================================
  // COUNTS
  // =====================================================

  const patientCount = users.filter(
    (user) => user.role === "patient"
  ).length;


  const doctorCount = users.filter(
    (user) => user.role === "doctor"
  ).length;


  const adminCount = users.filter(
    (user) => user.role === "admin"
  ).length;


  const activeCount = users.filter(
    (user) => user.is_active
  ).length;


  const inactiveCount = users.filter(
    (user) => !user.is_active
  ).length;


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="admin-users-page">

      <div className="admin-users-container">


        {/* HEADER */}

        <div className="admin-users-header">

          <div>

            <p>
              Administration
            </p>

            <h1>
              Manage Users
            </h1>

            <span>
              View and manage registered SmartClinic Pro users.
            </span>

          </div>

        </div>


        {/* MESSAGE */}

        {message && (

          <div className="users-message success">
            {message}
          </div>

        )}


        {error && (

          <div className="users-message error">
            {error}
          </div>

        )}


        {/* STATISTICS */}

        <div className="user-statistics">


          {/* TOTAL */}

          <button
            className={
              selectedRole === "all"
                ? "user-stat active"
                : "user-stat"
            }
            onClick={() =>
              handleFilterSelect("all")
            }
          >

            <span>
              Total Users
            </span>

            <small>
              Click to view everyone →
            </small>

            <strong>
              {users.length}
            </strong>

          </button>


          {/* PATIENTS */}

          <button
            className={
              selectedRole === "patient"
                ? "user-stat active"
                : "user-stat"
            }
            onClick={() =>
              handleFilterSelect("patient")
            }
          >

            <span>
              Patients
            </span>

            <small>
              Click to view patient accounts →
            </small>

            <strong>
              {patientCount}
            </strong>

          </button>


          {/* DOCTORS */}

          <button
            className={
              selectedRole === "doctor"
                ? "user-stat active"
                : "user-stat"
            }
            onClick={() =>
              handleFilterSelect("doctor")
            }
          >

            <span>
              Doctors
            </span>

            <small>
              Click to view doctor accounts →
            </small>

            <strong>
              {doctorCount}
            </strong>

          </button>


          {/* ADMINS */}

          <button
            className={
              selectedRole === "admin"
                ? "user-stat active"
                : "user-stat"
            }
            onClick={() =>
              handleFilterSelect("admin")
            }
          >

            <span>
              Administrators
            </span>

            <small>
              Click to view administrators →
            </small>

            <strong>
              {adminCount}
            </strong>

          </button>

        </div>


        {/* SEARCH */}

        <div className="users-search">

          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

        </div>

        <p className="users-count-note">
          These counts are user accounts that can sign in. Doctor
          and patient profiles are managed on the Doctors and
          Appointments pages.
        </p>


        {/* USER LIST */}

        <div
          className="users-section"
          ref={resultsRef}
        >

          <div className="users-section-header">

            <div>

              <h2>
                {selectedRole === "all"
                  ? "All Users"
                  : `${selectedRole
                      .charAt(0)
                      .toUpperCase()}${selectedRole.slice(1)}s`}
              </h2>

              <p>
                {filteredUsers.length} user
                {filteredUsers.length !== 1
                  ? "s"
                  : ""}
              </p>

            </div>

          </div>


          {loading ? (

            <div className="users-message">
              Loading users...
            </div>

          ) : filteredUsers.length === 0 ? (

            <div className="users-message">
              No users found.
            </div>

          ) : (

            <div className="users-table-wrapper">

              <table className="users-table">

                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Registered
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredUsers.map(
                    (user) => (

                      <tr key={user.id}>

                        <td>
                          {user.id}
                        </td>


                        <td>
                          <strong>
                            {user.name}
                          </strong>
                        </td>


                        <td>
                          {user.email}
                        </td>


                        <td>

                          <span
                            className={`user-role ${user.role}`}
                          >
                            {user.role}
                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={
                              user.is_active
                                ? "user-status active"
                                : "user-status inactive"
                            }
                          >

                            {user.is_active
                              ? "Active"
                              : "Inactive"}

                          </span>

                        </td>


                        {/* REGISTERED */}

                        <td>

                          {new Date(
                            user.created_at
                          ).toLocaleDateString()}

                        </td>


                        {/* ACTION */}

                        <td>

                          {user.role === "admin" ? (

                            <span className="admin-protected">
                              Protected
                            </span>

                          ) : (

                            <button
                              className={
                                user.is_active
                                  ? "user-action deactivate"
                                  : "user-action activate"
                              }
                              disabled={
                                actionLoading === user.id
                              }
                              onClick={() =>
                                handleAccountStatus(user)
                              }
                            >

                              {actionLoading === user.id

                                ? "Updating..."

                                : user.is_active
                                  ? "Deactivate"
                                  : "Reactivate"}

                            </button>

                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default AdminUsers;
