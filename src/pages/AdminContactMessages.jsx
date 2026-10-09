import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../api/api";
import { apiFetch } from "../api/api";
import "./AdminContactMessages.css";

function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const detailsRef = useRef(null);

  // Bring the opened message into view when the admin clicks "View"
  useEffect(() => {
    if (selectedMessage && detailsRef.current) {
      detailsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedMessage]);

  // =====================================================
  // LOAD CONTACT MESSAGES
  // =====================================================

  async function loadMessages() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        `${API_BASE_URL}/api/admin/contact-messages`
      );

      const data = response.data;

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load contact messages."
        );
      }

      setMessages(data);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to load contact messages."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  // =====================================================
  // DELETE MESSAGE
  // =====================================================

  async function handleDelete(messageItem) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the message from ${messageItem.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(messageItem.id);
      setError("");
      setMessage("");

      const response = await apiFetch(
        `${API_BASE_URL}/api/admin/contact-messages/${messageItem.id}`,
        {
          method: "DELETE",
        }
      );

      const data = response.data;

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete message."
        );
      }

      setMessages((previousMessages) =>
        previousMessages.filter(
          (item) => item.id !== messageItem.id
        )
      );

      if (
        selectedMessage &&
        selectedMessage.id === messageItem.id
      ) {
        setSelectedMessage(null);
      }

      setMessage(data.message);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Something went wrong while deleting the message."
      );
    } finally {
      setActionLoading(null);
    }
  }

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredMessages = messages.filter(
    (messageItem) => {
      const search = searchTerm.toLowerCase().trim();

      if (!search) {
        return true;
      }

      return (
        messageItem.name
          .toLowerCase()
          .includes(search) ||
        messageItem.email
          .toLowerCase()
          .includes(search) ||
        messageItem.subject
          .toLowerCase()
          .includes(search) ||
        messageItem.message
          .toLowerCase()
          .includes(search)
      );
    }
  );

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="admin-contact-page">
      <div className="admin-contact-container">

        {/* HEADER */}

        <div className="admin-contact-header">
          <div>
            <p>Administration</p>

            <h1>Contact Messages</h1>

            <span>
              View and manage messages submitted through
              the SmartClinic Pro contact form.
            </span>
          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <div className="contact-admin-message success">
            {message}
          </div>
        )}

        {error && (
          <div className="contact-admin-message error">
            {error}
          </div>
        )}

        {/* STATISTICS */}

        <div className="contact-statistics">

          <div className="contact-stat">
            <span>Total Messages</span>

            <small>
              Messages received from visitors
            </small>

            <strong>
              {messages.length}
            </strong>
          </div>

          <div className="contact-stat">
            <span>Showing</span>

            <small>
              Results matching your search
            </small>

            <strong>
              {filteredMessages.length}
            </strong>
          </div>

        </div>

        {/* SEARCH */}

        <div className="contact-search">
          <input
            type="text"
            placeholder="Search by name, email, subject, or message"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        {/* MESSAGE LIST */}

        <div className="contact-messages-section">

          <div className="contact-section-header">
            <div>
              <h2>Received Messages</h2>

              <p>
                {filteredMessages.length} message
                {filteredMessages.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="contact-admin-message">
              Loading contact messages...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="contact-admin-message">
              No contact messages found.
            </div>
          ) : (
            <div className="contact-table-wrapper">

              <table className="contact-table">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sender</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Received</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredMessages.map(
                    (messageItem) => (

                      <tr key={messageItem.id}>

                        <td>
                          {messageItem.id}
                        </td>

                        <td>
                          <strong>
                            {messageItem.name}
                          </strong>
                        </td>

                        <td>
                          {messageItem.email}
                        </td>

                        <td>
                          {messageItem.subject}
                        </td>

                        <td>
                          {new Date(
                            messageItem.created_at
                          ).toLocaleDateString()}
                        </td>

                        <td>

                          <div className="contact-actions">

                            <button
                              className="contact-view-button"
                              onClick={() =>
                                setSelectedMessage(
                                  messageItem
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              className="contact-delete-button"
                              disabled={
                                actionLoading ===
                                messageItem.id
                              }
                              onClick={() =>
                                handleDelete(
                                  messageItem
                                )
                              }
                            >
                              {actionLoading ===
                              messageItem.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* MESSAGE DETAILS */}

        {selectedMessage && (
          <div
            className="contact-message-details"
            ref={detailsRef}
            tabIndex={-1}
          >

            <div className="contact-details-header">

              <div>
                <p>Message Details</p>

                <h2>
                  {selectedMessage.subject}
                </h2>
              </div>

              <button
                className="contact-close-button"
                onClick={() =>
                  setSelectedMessage(null)
                }
              >
                Close
              </button>

            </div>

            <div className="contact-details-info">

              <div>
                <span>From</span>
                <strong>
                  {selectedMessage.name}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {selectedMessage.email}
                </strong>
              </div>

              <div>
                <span>Received</span>
                <strong>
                  {new Date(
                    selectedMessage.created_at
                  ).toLocaleString()}
                </strong>
              </div>

            </div>

            <div className="contact-details-message">

              <span>Message</span>

              <p>
                {selectedMessage.message}
              </p>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default AdminContactMessages;