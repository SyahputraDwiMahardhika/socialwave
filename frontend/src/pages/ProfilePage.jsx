/**
 * ProfilePage.jsx
 *
 * User profile page.
 * Shows:
 *  - Profile picture, name, bio, role badge
 *  - Edit profile form (name, bio, profile picture)
 *  - All posts by the user (including pending/rejected) with status indicators
 */

import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Alert, Tab, Tabs } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import api from "../services/api";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  // Profile edit state
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user?.profile_picture_url ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const avatarRef = useRef();

  /**
   * Sync local state when auth user changes (e.g. after profile update).
   */
  useEffect(() => {
    setName(user?.name ?? "");
    setBio(user?.bio ?? "");
    setAvatarPreview(user?.profile_picture_url ?? null);
  }, [user]);

  /**
   * Fetch all posts by the authenticated user (including pending/rejected).
   */
  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await api.get("/my-posts");
      setPosts(res.data.data.data ?? []);
    } catch {
      // silent fail
    } finally {
      setPostsLoading(false);
    }
  };

  /**
   * handleAvatarChange — Preview the new avatar image before uploading.
   */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  /**
   * handleSaveProfile — POSTs the updated profile fields to the API.
   * Uses FormData to support the profile picture file upload.
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    setSaveError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      if (avatarFile) formData.append("profile_picture", avatarFile);

      const res = await api.post("/user/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update context dulu, reload setelah pesan muncul
      updateUser(res.data.data);
      setSaveMsg("Profile updated successfully!");
      setAvatarFile(null);
      if (avatarRef.current) avatarRef.current.value = "";
      // Reload setelah 2 detik agar user sempat lihat pesan sukses
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors ?? {})[0]?.[0] ||
        "Failed to update profile.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  /**
   * handlePostDeleted — Removes a deleted post from the local list.
   */
  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  /**
   * handlePostUpdated — Replaces an updated post in the local list.
   */
  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
    );
  };

  // Stats
  const approvedCount = posts.filter((p) => p.status === "approved").length;
  const pendingCount = posts.filter((p) => p.status === "pending").length;
  const rejectedCount = posts.filter((p) => p.status === "rejected").length;

  return (
    <div className="sw-main">
      <Container>
        <Row>
          <Col lg={8} className="mx-auto">
            {/* Profile header card */}
            <div className="profile-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.25rem",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {/* Avatar */}
                <div className="profile-avatar-wrap">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="profile-avatar"
                    />
                  ) : (
                    <div
                      className="profile-avatar"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(135deg, var(--sw-accent-dim), var(--sw-surface2))",
                        color: "var(--sw-accent)",
                        fontSize: "2rem",
                        fontFamily: "Space Grotesk, sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name, role, bio */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
                      {user?.name}
                    </h2>
                    {user?.role === "admin" && (
                      <span className="sw-badge badge-pending">
                        <i className="bi bi-shield-check me-1"></i>Admin
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      color: "var(--sw-text-muted)",
                      fontSize: "0.85rem",
                      marginTop: "0.2rem",
                    }}
                  >
                    {user?.email}
                  </div>
                  {user?.bio && (
                    <p
                      style={{
                        color: "var(--sw-text)",
                        fontSize: "0.9rem",
                        marginTop: "0.5rem",
                        marginBottom: 0,
                      }}
                    >
                      {user.bio}
                    </p>
                  )}

                  {/* Post stats */}
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginTop: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontFamily: "Space Grotesk",
                          fontWeight: 700,
                          color: "var(--sw-accent)",
                        }}
                      >
                        {approvedCount}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--sw-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Posts
                      </div>
                    </div>
                    {pendingCount > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontFamily: "Space Grotesk",
                            fontWeight: 700,
                            color: "var(--sw-pending)",
                          }}
                        >
                          {pendingCount}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--sw-text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Pending
                        </div>
                      </div>
                    )}
                    {rejectedCount > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontFamily: "Space Grotesk",
                            fontWeight: 700,
                            color: "var(--sw-rejected)",
                          }}
                        >
                          {rejectedCount}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--sw-text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Rejected
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs: Edit Profile / My Posts */}
            <Tabs defaultActiveKey="posts" className="mb-3">
              {/* My Posts tab */}
              <Tab
                eventKey="posts"
                title={
                  <>
                    <i className="bi bi-grid-3x3-gap me-1"></i>My Posts
                  </>
                }
              >
                {postsLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border spinner-sw"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-pencil-square"></i>
                    <p>You haven't posted anything yet.</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onDeleted={handlePostDeleted}
                      onUpdated={handlePostUpdated}
                      onHashtagClick={() => {}}
                      showStatus={true}
                    />
                  ))
                )}
              </Tab>

              {/* Edit Profile tab */}
              <Tab
                eventKey="edit"
                title={
                  <>
                    <i className="bi bi-pencil me-1"></i>Edit Profile
                  </>
                }
              >
                <div className="sw-card">
                  {saveMsg && (
                    <Alert variant="success" className="py-2 mb-3">
                      {saveMsg}
                    </Alert>
                  )}
                  {saveError && (
                    <Alert variant="danger" className="py-2 mb-3">
                      {saveError}
                    </Alert>
                  )}

                  <form onSubmit={handleSaveProfile}>
                    {/* Avatar upload */}
                    <div className="mb-4">
                      <label className="sw-label">Profile Picture</label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="avatar"
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid var(--sw-accent)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: "50%",
                              background: "var(--sw-surface2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--sw-accent)",
                              fontSize: "1.6rem",
                              fontFamily: "Space Grotesk",
                              fontWeight: 700,
                              border: "2px dashed var(--sw-border)",
                            }}
                          >
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <label
                            className="btn-sw-ghost"
                            style={{
                              cursor: "pointer",
                              display: "inline-block",
                            }}
                          >
                            <i className="bi bi-camera me-1"></i> Choose Photo
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                              hidden
                              ref={avatarRef}
                              onChange={handleAvatarChange}
                            />
                          </label>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--sw-text-muted)",
                              marginTop: "0.25rem",
                            }}
                          >
                            JPG, PNG, GIF, WebP — max 2MB
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="mb-3">
                      <label className="sw-label">Display Name</label>
                      <input
                        type="text"
                        className="sw-form-control form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                        maxLength={255}
                      />
                    </div>

                    {/* Bio */}
                    <div className="mb-4">
                      <label className="sw-label">Bio</label>
                      <textarea
                        className="sw-form-control form-control"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell the world a little about yourself…"
                        maxLength={500}
                        style={{ resize: "none" }}
                      />
                      <div className="char-counter">
                        {500 - bio.length} characters remaining
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-sw-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving…
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-1"></i>Save Changes
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
