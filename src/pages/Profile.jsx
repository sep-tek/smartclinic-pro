import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import ErrorMessage from "../components/ErrorMessage";
import "./Profile.css";

function Profile() {
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // =====================================================
  // LOAD PROFILE
  // =====================================================

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        "http://localhost:5000/api/profile"
      );

      const user = response.data?.user;

      if (!user) {
        throw new Error("Profile information could not be loaded.");
      }

      setProfile(user);
      setName(user.name || "");
      setEmail(user.email || "");
    } catch (error) {
      console.error("Load profile error:", error);

      setError(
        error.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (!name.trim() || !email.trim()) {
      setProfileError("Name and email are required.");
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(
        "http://localhost:5000/api/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
          }),
        }
      );

      const updatedUser = response.data?.user;

      if (updatedUser) {
        setProfile(updatedUser);
        setName(updatedUser.name || "");
        setEmail(updatedUser.email || "");
      }

      setProfileMessage(
        response.data?.message ||
          "Profile updated successfully."
      );

      setEditing(false);
    } catch (error) {
      console.error("Update profile error:", error);

      setProfileError(
        error.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirmation password do not match."
      );
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await apiFetch(
        "http://localhost:5000/api/profile/password",
        {
          method: "PUT",
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      setPasswordMessage(
        response.data?.message ||
          "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change password error:", error);

      setPasswordError(
        error.message ||
          "Unable to change your password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !profile) {
    return (
      <div className="profile-page">
        <ErrorMessage
          message={
            error ||
            "Unable to load your profile."
          }
          onRetry={loadProfile}
        />
      </div>
    );
  }

  // =====================================================
  // HELPERS
  // =====================================================

  const roleLabel =
    profile.role === "admin"
      ? "Administrator"
      : profile.role === "doctor"
      ? "Doctor"
      : "Patient";

  const initial =
    profile.name?.charAt(0)?.toUpperCase() || "U";

  const createdDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : "Not available";

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="profile-page">

      {/* HEADER */}

      <div className="profile-page-header">
        <div>
          <span className="profile-eyebrow">
            ACCOUNT
          </span>

          <h1>My Profile</h1>

          <p>
            Manage your personal information and
            account security.
          </p>
        </div>
      </div>

      {/* PROFILE SUMMARY */}

      <section className="profile-card profile-summary-card">
        <div className="profile-avatar">
          {initial}
        </div>

        <div className="profile-summary-info">
          <h2>{profile.name}</h2>

          <p>{profile.email}</p>

          <span className="profile-role">
            {roleLabel}
          </span>
        </div>

        <div className="profile-status">
          <span
            className={
              profile.is_active
                ? "status-dot active"
                : "status-dot inactive"
            }
          ></span>

          {profile.is_active
            ? "Active account"
            : "Inactive account"}
        </div>
      </section>

      {/* PERSONAL INFORMATION */}

      <section className="profile-card">

        <div className="profile-card-header">
          <div>
            <h2>Personal Information</h2>

            <p>
              Update the information associated with
              your account.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              className="profile-edit-button"
              onClick={() => {
                setProfileMessage("");
                setProfileError("");
                setEditing(true);
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {profileMessage && (
          <div className="profile-success">
            {profileMessage}
          </div>
        )}

        {profileError && (
          <div className="profile-form-error">
            {profileError}
          </div>
        )}

        <form
          className="profile-form"
          onSubmit={handleProfileSubmit}
        >

          <div className="profile-form-grid">

            <div className="profile-field">
              <label htmlFor="profile-name">
                Full Name
              </label>

              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                disabled={!editing || saving}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-email">
                Email Address
              </label>

              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                disabled={!editing || saving}
              />
            </div>

            <div className="profile-field">
              <label>Account Type</label>

              <input
                type="text"
                value={roleLabel}
                disabled
                readOnly
              />
            </div>

            <div className="profile-field">
              <label>Member Since</label>

              <input
                type="text"
                value={createdDate}
                disabled
                readOnly
              />
            </div>

          </div>

          {editing && (
            <div className="profile-form-actions">

              <button
                type="button"
                className="profile-cancel-button"
                onClick={() => {
                  setName(profile.name || "");
                  setEmail(profile.email || "");
                  setProfileError("");
                  setEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>
          )}

        </form>
      </section>

      {/* SECURITY */}

      <section className="profile-card">

        <div className="profile-card-header">
          <div>
            <h2>Security</h2>

            <p>
              Change your password to keep your
              account secure.
            </p>
          </div>
        </div>

        {passwordMessage && (
          <div className="profile-success">
            {passwordMessage}
          </div>
        )}

        {passwordError && (
          <div className="profile-form-error">
            {passwordError}
          </div>
        )}

        <form
          className="profile-password-form"
          onSubmit={handlePasswordSubmit}
        >

          <div className="profile-field">
            <label htmlFor="current-password">
              Current Password
            </label>

            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              placeholder="Enter your current password"
              disabled={passwordLoading}
            />
          </div>

          <div className="profile-password-grid">

            <div className="profile-field">
              <label htmlFor="new-password">
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                placeholder="At least 6 characters"
                disabled={passwordLoading}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Repeat your new password"
                disabled={passwordLoading}
              />
            </div>

          </div>

          <div className="profile-password-actions">
            <button
              type="submit"
              className="profile-save-button"
              disabled={passwordLoading}
            >
              {passwordLoading
                ? "Changing Password..."
                : "Change Password"}
            </button>
          </div>

        </form>

      </section>

    </div>
  );
}

export default Profile;