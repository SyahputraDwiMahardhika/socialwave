/**
 * HomePage.jsx
 *
 * Main feed page showing all approved posts sorted by newest.
 * Features:
 *  - Create post button (opens PostFormModal)
 *  - Hashtag filter search bar
 *  - Infinite scroll pagination (Load More button)
 *  - Post cards with edit/delete for owner
 */

import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import PostFormModal from "../components/PostFormModal";
import api from "../services/api";

export default function HomePage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [hashtag, setHashtag] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notice, setNotice] = useState("");

  /**
   * fetchPosts — Loads the approved post feed from the API.
   */
  const fetchPosts = useCallback(async (page = 1, tag = "", append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const params = { page };
      if (tag) params.hashtag = tag.replace("#", "");

      const res = await api.get("/posts", { params });
      const { data, current_page, last_page } = res.data.data;

      setPosts((prev) => (append ? [...prev, ...data] : data));
      setCurrentPage(current_page);
      setLastPage(last_page);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts(1, hashtag);
  }, [hashtag]);

  /**
   * handleHashtagSearch — Filter feed by hashtag.
   */
  const handleHashtagSearch = (e) => {
    e.preventDefault();
    const tag = searchInput.trim();
    setHashtag(tag);
    setPosts([]);
    setCurrentPage(1);
  };

  /**
   * handleClearSearch — Clear hashtag filter.
   */
  const handleClearSearch = () => {
    setSearchInput("");
    setHashtag("");
    setPosts([]);
    setCurrentPage(1);
  };

  /**
   * handleHashtagClick — Click hashtag in post to filter feed.
   */
  const handleHashtagClick = (tag) => {
    const clean = tag.replace("#", "");
    setSearchInput(clean);
    setHashtag(clean);
    setPosts([]);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * handleLoadMore — Load next page.
   */
  const handleLoadMore = () => {
    if (currentPage < lastPage) {
      fetchPosts(currentPage + 1, hashtag, true);
    }
  };

  /**
   * handlePostCreated — Called after new post submitted.
   * Post langsung approved dan masuk feed.
   * Kalau flagged, tetap masuk feed tapi tampilkan notice.
   */
  const handlePostCreated = (newPost) => {
    setShowCreateModal(false);
    // Semua post langsung approved — tambahkan ke feed
    setPosts((prev) => [newPost, ...prev]);
    if (newPost.is_flagged) {
      setNotice(
        "⚠️ Post published, but flagged for admin review due to inappropriate content.",
      );
      setTimeout(() => setNotice(""), 6000);
    }
  };

  /**
   * handlePostDeleted — Remove deleted post from list.
   */
  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  /**
   * handlePostUpdated — Replace updated post in list.
   */
  const handlePostUpdated = (updatedPost) => {
    if (updatedPost.status === "approved") {
      setPosts((prev) =>
        prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
      );
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== updatedPost.id));
    }
  };

  return (
    <div className="sw-main">
      <Container>
        <Row>
          <Col lg={8} className="mx-auto">
            {/* Notice banner */}
            {notice && (
              <Alert
                variant="info"
                dismissible
                onClose={() => setNotice("")}
                className="mb-3"
              >
                {notice}
              </Alert>
            )}

            {/* Hashtag search bar */}
            <div className="hashtag-search">
              <form onSubmit={handleHashtagSearch}>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <div style={{ position: "relative", flex: 1 }}>
                    <i
                      className="bi bi-hash"
                      style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--sw-accent)",
                        fontSize: "1rem",
                        pointerEvents: "none",
                      }}
                    ></i>
                    <input
                      type="text"
                      className="sw-form-control form-control"
                      placeholder="Filter by hashtag…  e.g. coding"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      style={{ paddingLeft: "2rem" }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-sw-primary"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    <i className="bi bi-search me-1"></i> Search
                  </button>
                  {hashtag && (
                    <button
                      type="button"
                      className="btn-sw-ghost"
                      onClick={handleClearSearch}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </form>

              {hashtag && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8rem",
                    color: "var(--sw-text-muted)",
                  }}
                >
                  Showing posts tagged{" "}
                  <span style={{ color: "var(--sw-accent)", fontWeight: 600 }}>
                    #{hashtag}
                  </span>
                </div>
              )}
            </div>

            {/* Create post button */}
            <div
              className="sw-card mb-4"
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
              onClick={() => setShowCreateModal(true)}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--sw-accent-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--sw-accent)",
                  fontSize: "1.1rem",
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-pencil"></i>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "var(--sw-surface2)",
                  borderRadius: "var(--sw-radius-sm)",
                  padding: "0.6rem 1rem",
                  color: "var(--sw-text-muted)",
                  fontSize: "0.9rem",
                  border: "1px solid var(--sw-border)",
                }}
              >
                What's on your mind, {user?.name?.split(" ")[0]}?
              </div>
              <button
                className="btn-sw-primary"
                style={{ whiteSpace: "nowrap", flexShrink: 0 }}
              >
                <i className="bi bi-plus-lg me-1"></i> Post
              </button>
            </div>

            {/* Feed */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-sw" role="status">
                  <span className="visually-hidden">Loading feed…</span>
                </div>
                <p
                  style={{
                    color: "var(--sw-text-muted)",
                    marginTop: "1rem",
                    fontSize: "0.875rem",
                  }}
                >
                  Loading feed…
                </p>
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-broadcast"></i>
                <p>
                  {hashtag
                    ? `No posts found with #${hashtag}`
                    : "The feed is empty. Be the first to post!"}
                </p>
                {hashtag && (
                  <button
                    className="btn-sw-ghost mt-2"
                    onClick={handleClearSearch}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDeleted={handlePostDeleted}
                    onUpdated={handlePostUpdated}
                    onHashtagClick={handleHashtagClick}
                  />
                ))}

                {/* Load more */}
                {currentPage < lastPage && (
                  <div className="text-center mt-3 mb-2">
                    <button
                      className="btn-sw-ghost"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Loading…
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-down-circle me-2"></i>Load
                          More
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>

      {/* Create post modal */}
      <PostFormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={handlePostCreated}
      />
    </div>
  );
}
