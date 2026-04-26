import { useEffect, useMemo, useState } from "react";
import "./AdminPanel.css";

import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { auth, db, storage } from "../../firebase";

const ADMIN_EMAIL = "jelenatanaskovicj@gmail.com";

export default function AdminPanel() {
  const [coaches, setCoaches] = useState([]);
  const [academies, setAcademies] = useState([]);
  const [activeCoaches, setActiveCoaches] = useState([]);
  const [activeAcademies, setActiveAcademies] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeTab, setActiveTab] = useState("requests");
  const [requestFilter, setRequestFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [showBlogForm, setShowBlogForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedProfileType, setSelectedProfileType] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "",
    danger: false,
    onConfirm: null,
  });

  const [blogFile, setBlogFile] = useState(null);
  const [uploadingBlog, setUploadingBlog] = useState(false);

  const [blogForm, setBlogForm] = useState({
    title: "",
    excerpt: "",
    content: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(user?.email === ADMIN_EMAIL);
      setCheckingAdmin(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
      fetchActiveProfiles();
      fetchBlogPosts();
    }
  }, [isAdmin]);

  const pendingCount = coaches.length + academies.length;
  const activeProfilesCount = activeCoaches.length + activeAcademies.length;

  const expiringSoonProfiles = useMemo(() => {
    return [
      ...activeCoaches.map((profile) => ({ ...profile, type: "coach" })),
      ...activeAcademies.map((profile) => ({ ...profile, type: "academy" })),
    ].filter((profile) => {
      const days = getDaysUntilExpiry(profile.expiresAt);
      return days !== null && days >= 0 && days <= 30;
    });
  }, [activeCoaches, activeAcademies]);

  const extensionRequests = useMemo(() => {
    return activeCoaches.filter((coach) => coach.extensionRequested === true);
  }, [activeCoaches]);

  const filteredActiveCoaches = useMemo(() => {
    if (profileFilter === "academies") return [];

    if (profileFilter === "expiring") {
      return activeCoaches.filter((coach) => {
        const days = getDaysUntilExpiry(coach.expiresAt);
        return days !== null && days >= 0 && days <= 30;
      });
    }

    if (profileFilter === "extensionRequests") {
      return activeCoaches.filter((coach) => coach.extensionRequested === true);
    }

    return activeCoaches;
  }, [activeCoaches, profileFilter]);

  const filteredActiveAcademies = useMemo(() => {
    if (profileFilter === "coaches") return [];
    if (profileFilter === "extensionRequests") return [];

    if (profileFilter === "expiring") {
      return activeAcademies.filter((academy) => {
        const days = getDaysUntilExpiry(academy.expiresAt);
        return days !== null && days >= 0 && days <= 30;
      });
    }

    return activeAcademies;
  }, [activeAcademies, profileFilter]);

  const searchedCoaches = useMemo(() => {
    return coaches.filter(matchesSearch);
  }, [coaches, searchTerm]);

  const searchedAcademies = useMemo(() => {
    return academies.filter(matchesSearch);
  }, [academies, searchTerm]);

  const searchedActiveCoaches = useMemo(() => {
    return filteredActiveCoaches.filter(matchesSearch);
  }, [filteredActiveCoaches, searchTerm]);

  const searchedActiveAcademies = useMemo(() => {
    return filteredActiveAcademies.filter(matchesSearch);
  }, [filteredActiveAcademies, searchTerm]);

  function openProfileModal(type, profile) {
    setSelectedProfileType(type);
    setSelectedProfile(profile);
  }

  function closeProfileModal() {
    setSelectedProfile(null);
    setSelectedProfileType(null);
  }

  function openConfirm({
    title,
    message,
    confirmText,
    danger = false,
    onConfirm,
  }) {
    setConfirmModal({
      open: true,
      title,
      message,
      confirmText,
      danger,
      onConfirm,
    });
  }

  function closeConfirm() {
    setConfirmModal({
      open: false,
      title: "",
      message: "",
      confirmText: "",
      danger: false,
      onConfirm: null,
    });
  }

  async function runConfirmAction() {
    if (!confirmModal.onConfirm) return;
    await confirmModal.onConfirm();
    closeConfirm();
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase().trim();
  }

  function matchesSearch(profile) {
    const term = normalizeText(searchTerm);
    if (!term) return true;

    const searchableText = [
      profile.fullName,
      profile.organisationName,
      profile.contactName,
      profile.email,
      profile.phone,
      profile.city,
      profile.region,
      profile.nationality,
      profile.residence,
      profile.address,
    ]
      .map(normalizeText)
      .join(" ");

    return searchableText.includes(term);
  }

  function getOneYearFromNow() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }

  function getDateObject(value) {
    if (!value) return null;
    return value.toDate ? value.toDate() : new Date(value);
  }

  function formatDate(timestamp) {
    const date = getDateObject(timestamp);
    if (!date || Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getDaysUntilExpiry(expiresAt) {
    const expiryDate = getDateObject(expiresAt);
    if (!expiryDate || Number.isNaN(expiryDate.getTime())) return null;

    return Math.ceil(
      (expiryDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  function getProfileStatus(expiresAt) {
    const diffDays = getDaysUntilExpiry(expiresAt);

    if (diffDays === null) return "No expiration date";
    if (diffDays < 0) return "Expired";
    if (diffDays <= 30) return `Expires soon (${diffDays} days left)`;

    return `Active (${diffDays} days left)`;
  }

  function getStatusClass(expiresAt) {
    const diffDays = getDaysUntilExpiry(expiresAt);

    if (diffDays === null) return "statusNeutral";
    if (diffDays < 0) return "statusExpired";
    if (diffDays <= 30) return "statusSoon";

    return "statusActive";
  }

  async function fetchRequests() {
    setLoading(true);

    try {
      const coachQuery = query(
        collection(db, "coaches"),
        where("approvalStatus", "==", "pending")
      );

      const academyQuery = query(
        collection(db, "academies"),
        where("approvalStatus", "==", "pending")
      );

      const [coachSnap, academySnap] = await Promise.all([
        getDocs(coachQuery),
        getDocs(academyQuery),
      ]);

      setCoaches(
        coachSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );

      setAcademies(
        academySnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    } catch (error) {
      console.error(error);
      alert("Failed to load admin requests.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchActiveProfiles() {
    try {
      const coachQuery = query(
        collection(db, "coaches"),
        where("approvalStatus", "==", "approved")
      );

      const academyQuery = query(
        collection(db, "academies"),
        where("approvalStatus", "==", "approved")
      );

      const [coachSnap, academySnap] = await Promise.all([
        getDocs(coachQuery),
        getDocs(academyQuery),
      ]);

      setActiveCoaches(
        coachSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );

      setActiveAcademies(
        academySnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    } catch (error) {
      console.error(error);
      alert("Failed to load active profiles.");
    }
  }

  async function fetchBlogPosts() {
    setLoadingBlogs(true);

    try {
      const blogQuery = query(
        collection(db, "blogPosts"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(blogQuery);

      setBlogPosts(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    } catch (error) {
      console.error(error);
      alert("Failed to load blog posts.");
    } finally {
      setLoadingBlogs(false);
    }
  }

  async function approveProfile(type, id) {
    try {
      const response = await fetch(
        `https://email-api-vert-beta.vercel.app/api/approve-user?uid=${id}&type=${type}`
      );

      if (!response.ok) throw new Error("Approve failed");

      const collectionName = type === "coach" ? "coaches" : "academies";

      await updateDoc(doc(db, collectionName, id), {
        approvalStatus: "approved",
        profileVisible: true,
        approvedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(getOneYearFromNow()),
        extensionRequested: false,
      });

      await fetchRequests();
      await fetchActiveProfiles();

      alert("Profile approved.");
    } catch (error) {
      console.error(error);
      alert("Failed to approve profile.");
    }
  }

  async function extendProfile(type, id, currentExpiresAt) {
    openConfirm({
      title: "Extend profile",
      message: "Extend this profile for another 1 year?",
      confirmText: "Extend",
      onConfirm: async () => {
        try {
          const collectionName = type === "coach" ? "coaches" : "academies";

          const currentDate =
            currentExpiresAt?.toDate && currentExpiresAt.toDate() > new Date()
              ? currentExpiresAt.toDate()
              : new Date();

          currentDate.setFullYear(currentDate.getFullYear() + 1);

          await updateDoc(doc(db, collectionName, id), {
            approvalStatus: "approved",
            profileVisible: true,
            expiresAt: Timestamp.fromDate(currentDate),
            extensionRequested: false,
            extensionResolvedAt: serverTimestamp(),
          });

          await fetchActiveProfiles();

          alert("Profile extended for 1 year.");
        } catch (error) {
          console.error(error);
          alert("Failed to extend profile.");
        }
      },
    });
  }

  async function toggleProfileVisibility(type, id, currentVisible) {
    try {
      const collectionName = type === "coach" ? "coaches" : "academies";

      await updateDoc(doc(db, collectionName, id), {
        profileVisible: !currentVisible,
      });

      await fetchActiveProfiles();

      alert(currentVisible ? "Profile hidden." : "Profile is now visible.");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile visibility.");
    }
  }

  async function rejectProfile(type, id) {
    openConfirm({
      title: "Reject profile",
      message: "Are you sure you want to reject this profile?",
      confirmText: "Reject",
      danger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(
            `https://email-api-vert-beta.vercel.app/api/reject-user?uid=${id}&type=${type}`
          );

          if (!response.ok) throw new Error("Reject failed");

          await fetchRequests();

          alert("Profile rejected.");
        } catch (error) {
          console.error(error);
          alert("Failed to reject profile.");
        }
      },
    });
  }

  async function deleteProfile(type, id) {
    openConfirm({
      title: "Delete profile",
      message: "Are you sure you want to permanently delete this profile?",
      confirmText: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          const collectionName = type === "coach" ? "coaches" : "academies";

          await deleteDoc(doc(db, collectionName, id));

          await fetchRequests();
          await fetchActiveProfiles();

          alert("Profile deleted.");
        } catch (error) {
          console.error(error);
          alert("Failed to delete profile.");
        }
      },
    });
  }

  async function deleteBlogPost(postId) {
    openConfirm({
      title: "Delete blog post",
      message: "Are you sure you want to delete this blog post?",
      confirmText: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "blogPosts", postId));
          setBlogPosts((prev) => prev.filter((post) => post.id !== postId));
          alert("Blog post deleted.");
        } catch (error) {
          console.error(error);
          alert("Failed to delete blog post.");
        }
      },
    });
  }

  function handleBlogChange(e) {
    const { name, value } = e.target;

    setBlogForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleBlogFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Please select an image or video.");
      return;
    }

    setBlogFile(file);
  }

  async function uploadBlogMedia() {
    if (!blogFile) {
      return {
        mediaUrl: "",
        mediaType: "",
      };
    }

    const cleanName = blogFile.name.replace(/\s+/g, "-").toLowerCase();
    const filePath = `blog-media/${Date.now()}-${cleanName}`;
    const fileRef = ref(storage, filePath);

    await uploadBytes(fileRef, blogFile);

    const mediaUrl = await getDownloadURL(fileRef);
    const mediaType = blogFile.type.startsWith("video/") ? "video" : "image";

    return {
      mediaUrl,
      mediaType,
    };
  }

  async function createBlogPost(e) {
    e.preventDefault();

    if (!blogForm.title || !blogForm.content) {
      alert("Title and content are required.");
      return;
    }

    try {
      setUploadingBlog(true);

      const { mediaUrl, mediaType } = await uploadBlogMedia();

      await addDoc(collection(db, "blogPosts"), {
        title: blogForm.title,
        excerpt: blogForm.excerpt,
        content: blogForm.content,
        mediaUrl,
        mediaType,
        published: true,
        createdAt: serverTimestamp(),
      });

      setBlogForm({
        title: "",
        excerpt: "",
        content: "",
      });

      setBlogFile(null);
      setShowBlogForm(false);

      await fetchBlogPosts();

      alert("Blog post created.");
    } catch (error) {
      console.error(error);
      alert("Failed to create blog post.");
    } finally {
      setUploadingBlog(false);
    }
  }

  if (checkingAdmin) {
    return (
      <main className="adminPage">
        <div className="adminShell">
          <div className="adminLoading">Checking admin access...</div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="adminPage">
        <div className="adminShell">
          <section className="adminSection">
            <h2>Access denied</h2>
            <p className="emptyText">
              You do not have permission to access this page.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="adminPage">
      <div className="adminShell">
        <header className="adminHeader">
          <div>
            <h1>Admin Panel</h1>
            <p>Manage approvals, active profiles, expirations and blog posts.</p>
          </div>

          <div className="adminHeaderActions">
            <button
              className="refreshBtn"
              onClick={() => {
                fetchRequests();
                fetchActiveProfiles();
                fetchBlogPosts();
              }}
            >
              Refresh
            </button>

            <button
              className="refreshBtn"
              type="button"
              onClick={() => {
                setActiveTab("blog");
                setShowBlogForm((prev) => !prev);
              }}
            >
              {showBlogForm ? "Close blog form" : "Create blog post"}
            </button>
          </div>
        </header>

        <section className="adminStatsGrid">
          <button
            className={`adminStatCard ${
              activeTab === "requests" ? "activeStatCard" : ""
            }`}
            type="button"
            onClick={() => setActiveTab("requests")}
          >
            <span>Pending requests</span>
            <strong>{pendingCount}</strong>
          </button>

          <button
            className={`adminStatCard ${
              activeTab === "active" ? "activeStatCard" : ""
            }`}
            type="button"
            onClick={() => setActiveTab("active")}
          >
            <span>Active profiles</span>
            <strong>{activeProfilesCount}</strong>
          </button>

          <button
            className="adminStatCard warningStatCard"
            type="button"
            onClick={() => {
              setActiveTab("active");
              setProfileFilter("expiring");
            }}
          >
            <span>Expiring soon</span>
            <strong>{expiringSoonProfiles.length}</strong>
          </button>

          <button
            className="adminStatCard warningStatCard"
            type="button"
            onClick={() => {
              setActiveTab("active");
              setProfileFilter("extensionRequests");
            }}
          >
            <span>Extension requests</span>
            <strong>{extensionRequests.length}</strong>
          </button>

          <button
            className={`adminStatCard ${
              activeTab === "blog" ? "activeStatCard" : ""
            }`}
            type="button"
            onClick={() => setActiveTab("blog")}
          >
            <span>Blog posts</span>
            <strong>{blogPosts.length}</strong>
          </button>
        </section>

        <nav className="adminTabs">
          <button
            className={activeTab === "requests" ? "activeTab" : ""}
            type="button"
            onClick={() => setActiveTab("requests")}
          >
            Requests
          </button>

          <button
            className={activeTab === "active" ? "activeTab" : ""}
            type="button"
            onClick={() => setActiveTab("active")}
          >
            Active profiles
          </button>

          <button
            className={activeTab === "blog" ? "activeTab" : ""}
            type="button"
            onClick={() => setActiveTab("blog")}
          >
            Blog
          </button>
        </nav>

        <div className="adminSearchWrap">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone, city, region..."
          />

          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm("")}>
              Clear
            </button>
          )}
        </div>

        {activeTab === "requests" && (
          <>
            <div className="adminDividerTitle">
              Pending requests ({pendingCount})
            </div>

            <div className="adminFilters">
              <button
                className={requestFilter === "all" ? "activeFilter" : ""}
                type="button"
                onClick={() => setRequestFilter("all")}
              >
                All
              </button>

              <button
                className={requestFilter === "coaches" ? "activeFilter" : ""}
                type="button"
                onClick={() => setRequestFilter("coaches")}
              >
                Coaches
              </button>

              <button
                className={requestFilter === "academies" ? "activeFilter" : ""}
                type="button"
                onClick={() => setRequestFilter("academies")}
              >
                Academies
              </button>
            </div>

            {loading ? (
              <div className="adminLoading">Loading requests...</div>
            ) : (
              <>
                {(requestFilter === "all" || requestFilter === "coaches") && (
                  <section className="adminSection requestsSection">
                    <h2>Coach Requests ({searchedCoaches.length})</h2>

                    {searchedCoaches.length === 0 ? (
                      <p className="emptyText">No pending coach requests.</p>
                    ) : (
                      <div className="requestGrid">
                        {searchedCoaches.map((coach) => (
                          <div className="requestCard" key={coach.id}>
                            <div className="cardTopLine">
                              <span className="typeBadge">Coach</span>
                              <span>{formatDate(coach.createdAt)}</span>
                            </div>

                            <h3>{coach.fullName || "Unnamed coach"}</h3>

                            <p>
                              <strong>Email:</strong> {coach.email || "-"}
                            </p>
                            <p>
                              <strong>Phone:</strong> {coach.phone || "-"}
                            </p>
                            <p>
                              <strong>Nationality:</strong>{" "}
                              {coach.nationality || "-"}
                            </p>
                            <p>
                              <strong>Region:</strong> {coach.region || "-"}
                            </p>

                            <div className="requestActions threeButtons">
                              <button
                                className="viewBtn"
                                type="button"
                                onClick={() =>
                                  openProfileModal("coach", coach)
                                }
                              >
                                View profile
                              </button>

                              <button
                                className="approveBtn"
                                onClick={() =>
                                  approveProfile("coach", coach.id)
                                }
                              >
                                Approve
                              </button>

                              <button
                                className="rejectBtn"
                                onClick={() =>
                                  rejectProfile("coach", coach.id)
                                }
                              >
                                Reject
                              </button>

                              <button
                                className="rejectBtn deleteProfileBtn"
                                onClick={() =>
                                  deleteProfile("coach", coach.id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {(requestFilter === "all" || requestFilter === "academies") && (
                  <section className="adminSection requestsSection">
                    <h2>Academy Requests ({searchedAcademies.length})</h2>

                    {searchedAcademies.length === 0 ? (
                      <p className="emptyText">No pending academy requests.</p>
                    ) : (
                      <div className="requestGrid">
                        {searchedAcademies.map((academy) => (
                          <div className="requestCard" key={academy.id}>
                            <div className="cardTopLine">
                              <span className="typeBadge academyBadge">
                                Academy
                              </span>
                              <span>{formatDate(academy.createdAt)}</span>
                            </div>

                            <h3>
                              {academy.organisationName || "Unnamed academy"}
                            </h3>

                            <p>
                              <strong>Contact:</strong>{" "}
                              {academy.contactName || "-"}
                            </p>
                            <p>
                              <strong>Email:</strong> {academy.email || "-"}
                            </p>
                            <p>
                              <strong>Phone:</strong> {academy.phone || "-"}
                            </p>
                            <p>
                              <strong>City:</strong> {academy.city || "-"}
                            </p>
                            <p>
                              <strong>Region:</strong> {academy.region || "-"}
                            </p>

                            <div className="requestActions threeButtons">
                              <button
                                className="viewBtn"
                                type="button"
                                onClick={() =>
                                  openProfileModal("academy", academy)
                                }
                              >
                                View profile
                              </button>

                              <button
                                className="approveBtn"
                                onClick={() =>
                                  approveProfile("academy", academy.id)
                                }
                              >
                                Approve
                              </button>

                              <button
                                className="rejectBtn"
                                onClick={() =>
                                  rejectProfile("academy", academy.id)
                                }
                              >
                                Reject
                              </button>

                              <button
                                className="rejectBtn deleteProfileBtn"
                                onClick={() =>
                                  deleteProfile("academy", academy.id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "active" && (
          <>
            <div className="adminDividerTitle">Active profiles</div>

            <div className="adminFilters">
              <button
                className={profileFilter === "all" ? "activeFilter" : ""}
                type="button"
                onClick={() => setProfileFilter("all")}
              >
                All
              </button>

              <button
                className={profileFilter === "coaches" ? "activeFilter" : ""}
                type="button"
                onClick={() => setProfileFilter("coaches")}
              >
                Coaches
              </button>

              <button
                className={profileFilter === "academies" ? "activeFilter" : ""}
                type="button"
                onClick={() => setProfileFilter("academies")}
              >
                Academies
              </button>

              <button
                className={profileFilter === "expiring" ? "activeFilter" : ""}
                type="button"
                onClick={() => setProfileFilter("expiring")}
              >
                Expiring soon
              </button>

              <button
                className={
                  profileFilter === "extensionRequests" ? "activeFilter" : ""
                }
                type="button"
                onClick={() => setProfileFilter("extensionRequests")}
              >
                Extension requests
              </button>
            </div>

            {(profileFilter === "all" ||
              profileFilter === "coaches" ||
              profileFilter === "expiring" ||
              profileFilter === "extensionRequests") && (
              <section className="adminSection profilesSection">
                <h2>Active Coach Profiles ({searchedActiveCoaches.length})</h2>

                {searchedActiveCoaches.length === 0 ? (
                  <p className="emptyText">No active coach profiles.</p>
                ) : (
                  <div className="requestGrid">
                    {searchedActiveCoaches.map((coach) => (
                      <div className="requestCard" key={coach.id}>
                        <div className="cardTopLine">
                          <span className="typeBadge">Coach</span>
                          <span className={getStatusClass(coach.expiresAt)}>
                            {getProfileStatus(coach.expiresAt)}
                          </span>
                        </div>

                        <h3>{coach.fullName || "Unnamed coach"}</h3>

                        {coach.extensionRequested && (
                          <p className="extensionRequestText">
                            <strong>Extension request:</strong> Requested
                          </p>
                        )}

                        <p>
                          <strong>Email:</strong> {coach.email || "-"}
                        </p>

                        <p>
                          <strong>Visible:</strong>{" "}
                          {coach.profileVisible === false
                            ? "Hidden"
                            : "Visible"}
                        </p>

                        <p>
                          <strong>Approved:</strong>{" "}
                          {formatDate(coach.approvedAt)}
                        </p>

                        <p>
                          <strong>Expires:</strong>{" "}
                          {formatDate(coach.expiresAt)}
                        </p>

                        <div className="requestActions profileActions">
                          <button
                            className="viewBtn"
                            type="button"
                            onClick={() => openProfileModal("coach", coach)}
                          >
                            View profile
                          </button>

                          <button
                            className="hideBtn"
                            type="button"
                            onClick={() =>
                              toggleProfileVisibility(
                                "coach",
                                coach.id,
                                coach.profileVisible !== false
                              )
                            }
                          >
                            {coach.profileVisible === false
                              ? "Show profile"
                              : "Hide profile"}
                          </button>

                          <button
                            className="extendBtn"
                            onClick={() =>
                              extendProfile(
                                "coach",
                                coach.id,
                                coach.expiresAt
                              )
                            }
                          >
                            Extend 1 year
                          </button>

                          <button
                            className="rejectBtn deleteProfileBtn"
                            onClick={() => deleteProfile("coach", coach.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {(profileFilter === "all" ||
              profileFilter === "academies" ||
              profileFilter === "expiring") && (
              <section className="adminSection profilesSection">
                <h2>
                  Active Academy Profiles ({searchedActiveAcademies.length})
                </h2>

                {searchedActiveAcademies.length === 0 ? (
                  <p className="emptyText">No active academy profiles.</p>
                ) : (
                  <div className="requestGrid">
                    {searchedActiveAcademies.map((academy) => (
                      <div className="requestCard" key={academy.id}>
                        <div className="cardTopLine">
                          <span className="typeBadge academyBadge">
                            Academy
                          </span>
                          <span className={getStatusClass(academy.expiresAt)}>
                            {getProfileStatus(academy.expiresAt)}
                          </span>
                        </div>

                        <h3>
                          {academy.organisationName || "Unnamed academy"}
                        </h3>

                        <p>
                          <strong>Email:</strong> {academy.email || "-"}
                        </p>

                        <p>
                          <strong>Visible:</strong>{" "}
                          {academy.profileVisible === false
                            ? "Hidden"
                            : "Visible"}
                        </p>

                        <p>
                          <strong>Approved:</strong>{" "}
                          {formatDate(academy.approvedAt)}
                        </p>

                        <p>
                          <strong>Expires:</strong>{" "}
                          {formatDate(academy.expiresAt)}
                        </p>

                        <div className="requestActions profileActions">
                          <button
                            className="viewBtn"
                            type="button"
                            onClick={() =>
                              openProfileModal("academy", academy)
                            }
                          >
                            View profile
                          </button>

                          <button
                            className="hideBtn"
                            type="button"
                            onClick={() =>
                              toggleProfileVisibility(
                                "academy",
                                academy.id,
                                academy.profileVisible !== false
                              )
                            }
                          >
                            {academy.profileVisible === false
                              ? "Show profile"
                              : "Hide profile"}
                          </button>

                          <button
                            className="extendBtn"
                            onClick={() =>
                              extendProfile(
                                "academy",
                                academy.id,
                                academy.expiresAt
                              )
                            }
                          >
                            Extend 1 year
                          </button>

                          <button
                            className="rejectBtn deleteProfileBtn"
                            onClick={() =>
                              deleteProfile("academy", academy.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {activeTab === "blog" && (
          <>
            <div className="adminDividerTitle">Blog management</div>

            {showBlogForm && (
              <section className="adminSection blogSection">
                <h2>Create Blog Post</h2>

                <form className="blogForm" onSubmit={createBlogPost}>
                  <input
                    type="text"
                    name="title"
                    placeholder="Blog title"
                    value={blogForm.title}
                    onChange={handleBlogChange}
                  />

                  <input
                    type="text"
                    name="excerpt"
                    placeholder="Short excerpt"
                    value={blogForm.excerpt}
                    onChange={handleBlogChange}
                  />

                  <textarea
                    name="content"
                    placeholder="Blog content"
                    rows={8}
                    value={blogForm.content}
                    onChange={handleBlogChange}
                  />

                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleBlogFileChange}
                  />

                  {blogFile && (
                    <p className="emptyText">Selected file: {blogFile.name}</p>
                  )}

                  <button
                    className="publishBtn"
                    type="submit"
                    disabled={uploadingBlog}
                  >
                    {uploadingBlog ? "Publishing..." : "Publish Blog Post"}
                  </button>
                </form>
              </section>
            )}

            <section className="adminSection blogAdminSection">
              <h2>Blog Posts ({blogPosts.length})</h2>

              {loadingBlogs ? (
                <p className="emptyText">Loading blog posts...</p>
              ) : blogPosts.length === 0 ? (
                <p className="emptyText">No blog posts yet.</p>
              ) : (
                <div className="requestGrid">
                  {blogPosts.map((post) => (
                    <div className="requestCard" key={post.id}>
                      <div className="cardTopLine">
                        <span className="typeBadge blogBadge">Blog</span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>

                      {post.mediaType === "image" && post.mediaUrl && (
                        <img
                          src={post.mediaUrl}
                          alt={post.title}
                          style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 14,
                            marginBottom: 14,
                          }}
                        />
                      )}

                      {post.mediaType === "video" && post.mediaUrl && (
                        <video
                          src={post.mediaUrl}
                          controls
                          style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 14,
                            marginBottom: 14,
                          }}
                        />
                      )}

                      <h3>{post.title || "Untitled post"}</h3>
                      <p>{post.excerpt || "No excerpt."}</p>

                      <div className="requestActions">
                        <button
                          className="rejectBtn"
                          onClick={() => deleteBlogPost(post.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {confirmModal.open && (
          <div className="confirmModalOverlay" onClick={closeConfirm}>
            <div className="confirmModal" onClick={(e) => e.stopPropagation()}>
              <h2>{confirmModal.title}</h2>
              <p>{confirmModal.message}</p>

              <div className="confirmActions">
                <button className="cancelConfirmBtn" onClick={closeConfirm}>
                  Cancel
                </button>

                <button
                  className={
                    confirmModal.danger ? "dangerConfirmBtn" : "confirmBtn"
                  }
                  onClick={runConfirmAction}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedProfile && (
          <div className="profileModalOverlay" onClick={closeProfileModal}>
            <div className="profileModal" onClick={(e) => e.stopPropagation()}>
              <button className="modalCloseBtn" onClick={closeProfileModal}>
                ×
              </button>

              {selectedProfileType === "coach" ? (
                <>
                  <div className="profileModalHeader">
                    {selectedProfile.profileImage ? (
                      <img
                        src={selectedProfile.profileImage}
                        alt={selectedProfile.fullName}
                        className="modalProfileImage"
                      />
                    ) : (
                      <div className="modalProfilePlaceholder">
                        {selectedProfile.fullName?.charAt(0) || "C"}
                      </div>
                    )}

                    <div>
                      <h2>{selectedProfile.fullName || "Unnamed coach"}</h2>
                      <p>{selectedProfile.region || "No region selected"}</p>
                    </div>
                  </div>

                  <div className="profileModalGrid">
                    <p>
                      <strong>Email:</strong> {selectedProfile.email || "-"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedProfile.phone || "-"}
                    </p>
                    <p>
                      <strong>Age:</strong> {selectedProfile.age || "-"}
                    </p>
                    <p>
                      <strong>Nationality:</strong>{" "}
                      {selectedProfile.nationality || "-"}
                    </p>
                    <p>
                      <strong>Residence:</strong>{" "}
                      {selectedProfile.residence || "-"}
                    </p>
                    <p>
                      <strong>Region:</strong> {selectedProfile.region || "-"}
                    </p>
                    <p>
                      <strong>Visible:</strong>{" "}
                      {selectedProfile.profileVisible === false
                        ? "Hidden"
                        : "Visible"}
                    </p>
                    <p>
                      <strong>Extension request:</strong>{" "}
                      {selectedProfile.extensionRequested ? "Requested" : "No"}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatDate(selectedProfile.createdAt)}
                    </p>
                    <p>
                      <strong>Expires:</strong>{" "}
                      {formatDate(selectedProfile.expiresAt)}
                    </p>
                  </div>

                  <div className="profileModalBlock">
                    <h3>About</h3>
                    <p>{selectedProfile.about || "No about text."}</p>
                  </div>

                  <div className="profileModalBlock">
                    <h3>Certifications</h3>
                    <p>
                      {selectedProfile.certifications ||
                        "No certifications added."}
                    </p>
                  </div>

                  <div className="profileModalBlock">
                    <h3>Videos</h3>

                    {selectedProfile.playingVideo ? (
                      <a
                        href={selectedProfile.playingVideo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Playing video
                      </a>
                    ) : (
                      <p>No playing video.</p>
                    )}

                    {selectedProfile.coachingVideo ? (
                      <a
                        href={selectedProfile.coachingVideo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Coaching video
                      </a>
                    ) : (
                      <p>No coaching video.</p>
                    )}
                  </div>

                  <div className="profileModalBlock">
                    <h3>Recommendation</h3>
                    <p>
                      <strong>
                        {selectedProfile.recommenderName || "No recommender"}
                      </strong>
                    </p>
                    <p>
                      {selectedProfile.recommendationText ||
                        "No recommendation text."}
                    </p>
                  </div>

                  {selectedProfile.galleryImages?.length > 0 && (
                    <div className="profileModalBlock">
                      <h3>Gallery</h3>

                      <div className="modalGallery">
                        {selectedProfile.galleryImages.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Gallery ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="profileModalHeader">
                    <div className="modalProfilePlaceholder">
                      {selectedProfile.organisationName?.charAt(0) || "A"}
                    </div>

                    <div>
                      <h2>
                        {selectedProfile.organisationName || "Unnamed academy"}
                      </h2>
                      <p>
                        {selectedProfile.city || "No city"} •{" "}
                        {selectedProfile.region || "No region"}
                      </p>
                    </div>
                  </div>

                  <div className="profileModalGrid">
                    <p>
                      <strong>Contact:</strong>{" "}
                      {selectedProfile.contactName || "-"}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedProfile.email || "-"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedProfile.phone || "-"}
                    </p>
                    <p>
                      <strong>Organisation:</strong>{" "}
                      {selectedProfile.organisationName || "-"}
                    </p>
                    <p>
                      <strong>Address:</strong>{" "}
                      {selectedProfile.address || "-"}
                    </p>
                    <p>
                      <strong>City:</strong> {selectedProfile.city || "-"}
                    </p>
                    <p>
                      <strong>Region:</strong> {selectedProfile.region || "-"}
                    </p>
                    <p>
                      <strong>Visible:</strong>{" "}
                      {selectedProfile.profileVisible === false
                        ? "Hidden"
                        : "Visible"}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatDate(selectedProfile.createdAt)}
                    </p>
                    <p>
                      <strong>Expires:</strong>{" "}
                      {formatDate(selectedProfile.expiresAt)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}