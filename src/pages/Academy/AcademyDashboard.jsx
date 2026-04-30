import "./academyProfile.css";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import CoachList from "../Coach/CoachList";

export default function AcademyDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [academy, setAcademy] = useState(null);
  const [formData, setFormData] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [showCoaches, setShowCoaches] = useState(false);
  const [showApplications, setShowApplications] = useState(false);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [successModal, setSuccessModal] = useState({
    show: false,
    title: "",
    message: "",
  });

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [selectedExtensionPlan, setSelectedExtensionPlan] = useState("");

  const membershipId = academy?.membership?.id || academy?.membershipPlan;
  const isMemberAcademy = membershipId === "member";
  const isAccessAcademy = membershipId === "access";

  const MEMBERSHIP_PLANS = useMemo(
    () => [
      {
        id: "access",
        name: "Access",
        price: "Free",
      },
      {
        id: "member",
        name: "Member",
        price: "300€",
      },
    ],
    []
  );

  const currentMembershipId = membershipId || "access";

  const REGIONS = [
    "Europe",
    "North America",
    "South America",
    "Asia",
    "Africa",
    "Australia / Oceania",
    "Middle East",
  ];

  const emptyJobForm = useMemo(
    () => ({
      title: "",
      minSalary: "",
      maxSalary: "",
      benefits: "",
      description: "",
      date: "",
      country: "",
      city: "",
      address: "",
    }),
    []
  );

  const [jobForm, setJobForm] = useState(emptyJobForm);

  const resetJobForm = useCallback(() => {
    setJobForm(emptyJobForm);
  }, [emptyJobForm]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    navigate("/", { replace: true });
  }, [navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }, []);

  const handleJobChange = useCallback((e) => {
    const { name, value } = e.target;
    setJobForm((p) => ({ ...p, [name]: value }));
  }, []);

  function formatProfileDate(value) {
    if (!value) return "Not set";

    const date = value?.toDate
      ? value.toDate()
      : value?.seconds
      ? new Date(value.seconds * 1000)
      : new Date(value);

    if (Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function isProfileActive(value) {
    if (!value) return false;

    const date = value?.toDate
      ? value.toDate()
      : value?.seconds
      ? new Date(value.seconds * 1000)
      : new Date(value);

    if (Number.isNaN(date.getTime())) return false;

    return date > new Date();
  }

  const fetchApplications = useCallback(async () => {
    if (!id) return;

    const q = query(
      collection(db, "jobApplications"),
      where("academyId", "==", id)
    );

    const snap = await getDocs(q);

    const apps = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setApplications(apps);
  }, [id]);

  const updateApplicationStatus = useCallback(async (appId, status) => {
    await updateDoc(doc(db, "jobApplications", appId), {
      status,
      statusUpdatedAt: serverTimestamp(),
    });

    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status } : app))
    );

    setSuccessModal({
      show: true,
      title:
        status === "accepted"
          ? "Application accepted"
          : "Application rejected",
      message:
        status === "accepted"
          ? "The coach application has been accepted."
          : "The coach application has been rejected.",
    });
  }, []);

  const requestExtension = useCallback(async () => {
    try {
      const planId = selectedExtensionPlan || currentMembershipId;

      const selectedPlan = MEMBERSHIP_PLANS.find((plan) => plan.id === planId);

      if (!selectedPlan) {
        alert("Please select membership plan.");
        return;
      }

      await updateDoc(doc(db, "academies", id), {
        extensionRequested: true,
        extensionRequestedAt: serverTimestamp(),

        requestedExtensionPlan: selectedPlan.id,
        requestedExtensionMembership: {
          id: selectedPlan.id,
          name: selectedPlan.name,
          price: selectedPlan.price,
        },

        previousMembershipPlan: currentMembershipId,
        previousMembership: academy.membership || null,
      });

      setAcademy((prev) => ({
        ...prev,
        extensionRequested: true,
        requestedExtensionPlan: selectedPlan.id,
        requestedExtensionMembership: {
          id: selectedPlan.id,
          name: selectedPlan.name,
          price: selectedPlan.price,
        },
      }));

      setFormData((prev) => ({
        ...prev,
        extensionRequested: true,
        requestedExtensionPlan: selectedPlan.id,
        requestedExtensionMembership: {
          id: selectedPlan.id,
          name: selectedPlan.name,
          price: selectedPlan.price,
        },
      }));

      setSuccessModal({
        show: true,
        title: "Request sent",
        message: `Your extension request for ${selectedPlan.name} membership has been successfully submitted.`,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to send extension request.");
    }
  }, [
    id,
    academy,
    selectedExtensionPlan,
    currentMembershipId,
    MEMBERSHIP_PLANS,
  ]);

  const requestUpgrade = useCallback(async () => {
    try {
      await updateDoc(doc(db, "academies", id), {
        upgradeRequested: true,
        upgradeRequestedAt: serverTimestamp(),
        requestedUpgradeTo: "member",
      });

      setAcademy((prev) => ({
        ...prev,
        upgradeRequested: true,
        requestedUpgradeTo: "member",
      }));

      setFormData((prev) => ({
        ...prev,
        upgradeRequested: true,
        requestedUpgradeTo: "member",
      }));

      setSuccessModal({
        show: true,
        title: "Upgrade request sent",
        message: "Your membership upgrade request has been sent to admin.",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to send upgrade request.");
    }
  }, [id]);

  const handleSaveProfile = useCallback(async () => {
    await updateDoc(doc(db, "academies", id), formData);
    setAcademy(formData);
    setEditMode(false);
  }, [formData, id]);

  const saveJob = useCallback(async () => {
    if (editingJob) {
      await updateDoc(doc(db, "academies", id, "jobs", editingJob.id), jobForm);

      setJobs((prev) =>
        prev.map((job) =>
          job.id === editingJob.id ? { ...jobForm, id: editingJob.id } : job
        )
      );

      setShowJobForm(false);
      setEditingJob(null);
      resetJobForm();
      return;
    }

    if (isAccessAcademy) {
      await addDoc(collection(db, "jobPostRequests"), {
        ...jobForm,
        academyId: id,
        academyName: academy.organisationName,
        academyEmail: academy.email || "",
        membershipPlan: academy.membershipPlan || "",
        membership: academy.membership || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSuccessModal({
        show: true,
        title: "Job request sent",
        message: "Your job post request has been sent to admin for approval.",
      });

      setShowJobForm(false);
      setEditingJob(null);
      resetJobForm();
      return;
    }

    const docRef = await addDoc(collection(db, "academies", id, "jobs"), {
      ...jobForm,
      academyId: id,
      academyName: academy.organisationName,
      createdAt: serverTimestamp(),
    });

    setJobs((prev) => [...prev, { ...jobForm, id: docRef.id }]);

    setShowJobForm(false);
    setEditingJob(null);
    resetJobForm();
  }, [academy, editingJob, id, jobForm, resetJobForm, isAccessAcademy]);

  const deleteJob = useCallback(
    async (jobId) => {
      const ok = window.confirm("Are you sure you want to delete this job post?");
      if (!ok) return;

      await deleteDoc(doc(db, "academies", id, "jobs", jobId));
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    },
    [id]
  );

  useEffect(() => {
    if (!showLogoutModal) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowLogoutModal(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showLogoutModal]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists() || snap.data().role !== "academy") {
        navigate("/login", { replace: true });
        return;
      }

      setCheckingAuth(false);
    });

    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!id) return;

    let active = true;
async function fetchAcademy() {
  const refDoc = doc(db, "academies", id);
  const snap = await getDoc(refDoc);

  if (!active || !snap.exists()) return;

  let data = snap.data();
  const now = new Date();

  // 🔥 AUTO SWITCH MEMBERSHIP
  if (
    data.nextMembershipPlan &&
    data.nextMembershipStartsAt &&
    data.nextMembershipStartsAt.toDate() <= now
  ) {
    await updateDoc(refDoc, {
      membershipPlan: data.nextMembershipPlan,
      membership: data.nextMembership,

      nextMembershipPlan: null,
      nextMembership: null,
      nextMembershipStartsAt: null,
    });

    // reload nakon update-a
    const updatedSnap = await getDoc(refDoc);
    data = updatedSnap.data();
  }

  setAcademy(data);
  setFormData(data);
}
    async function fetchJobs() {
      const snap = await getDocs(collection(db, "academies", id, "jobs"));

      if (!active) return;

      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    fetchAcademy();
    fetchJobs();
    fetchApplications();

    return () => {
      active = false;
    };
  }, [id, fetchApplications]);

  if (checkingAuth) {
    return (
      <div className="loader">
        <p>Checking access...</p>
      </div>
    );
  }

  if (!academy || !formData) {
    return (
      <div className="loader">
        <p>Loading academy profile...</p>
      </div>
    );
  }

  return (
    <div className="coachProfilePage">
      <div className="coachHero">
        <div className="coachHeroContent">
          <div className="coachInfo">
            {editMode ? (
              <>
                <div className="heroField floating">
                  <input
                    className="inputHero"
                    name="organisationName"
                    value={formData.organisationName || ""}
                    onChange={handleChange}
                    placeholder=" "
                  />
                  <label>Organisation name</label>
                </div>

                <div className="heroInputRow">
                  <div className="heroField floating">
                    <input
                      className="inputHero small"
                      name="city"
                      value={formData.city || ""}
                      onChange={handleChange}
                      placeholder=" "
                    />
                    <label>City</label>
                  </div>

                  <div className="heroField floating">
                    <input
                      className="inputHero small"
                      name="region"
                      value={formData.region || ""}
                      onChange={handleChange}
                      placeholder=" "
                      list="region-options"
                    />
                    <label>Region</label>

                    <datalist id="region-options">
                      {REGIONS.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>

                  <div className="heroField floating">
                    <input
                      className="inputHero small"
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      placeholder=" "
                    />
                    <label>Address</label>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1>{academy.organisationName}</h1>

                <p>
                  {academy.city} - {academy.region}
                </p>

                {academy.address && (
                  <p className="academyAddress">{academy.address}</p>
                )}
              </>
            )}

            {!editMode ? (
              <div className="heroActions">
                <button
                  className="secondaryBtn"
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </button>

                <button
                  className="logoutBtn"
                  onClick={() => setShowLogoutModal(true)}
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="editActions">
                <button className="primaryBtn" onClick={handleSaveProfile}>
                  Save
                </button>

                <button
                  className="secondaryBtn"
                  onClick={() => {
                    setFormData(academy);
                    setEditMode(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {editMode && (
        <div className="editSection">
          <h3 className="sectionTitle">Contact Information</h3>

          <div className="editCard">
            <input
              name="contactName"
              placeholder="Contact name"
              value={formData.contactName || ""}
              onChange={handleChange}
            />

            <input
              name="email"
              placeholder="Email"
              value={formData.email || ""}
              onChange={handleChange}
            />

            <input
              name="phone"
              placeholder="Contact number"
              value={formData.phone || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {!editMode && (
        <div className="dashboardActions">
          <button
            className="primaryBtn"
            onClick={() => {
              setShowJobForm(true);
              setShowCoaches(false);
              setShowApplications(false);
              setEditingJob(null);
              resetJobForm();
            }}
          >
            {isAccessAcademy ? "Request Job Post Approval" : "Add Job Post"}
          </button>

          <button
            className="secondaryBtn"
            onClick={async () => {
              await fetchApplications();
              setShowApplications(true);
              setShowCoaches(false);
              setShowJobForm(false);
              setEditingJob(null);
            }}
          >
            View Applications
          </button>

          {isMemberAcademy && (
            <button
              className="secondaryBtn"
              onClick={() => {
                setShowCoaches(true);
                setShowApplications(false);
                setShowJobForm(false);
                setEditingJob(null);
              }}
            >
              View Coaches
            </button>
          )}

          {isAccessAcademy && (
            <p className="muted">
              Your Access plan requires admin approval for job posts. Coach
              database access is available with the Member plan.
            </p>
          )}
        </div>
      )}

      {!editMode && (
        <div className="card membershipCard">
          <h3>Profile validity</h3>

          <p>
            <strong>Membership:</strong>{" "}
            {academy.membership?.name || academy.membershipPlan || "Not set"}
          </p>

          <p>
            <strong>Price:</strong> {academy.membership?.price || "-"}
          </p>

          <p>
            <strong>Valid until:</strong> {formatProfileDate(academy.expiresAt)}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {isProfileActive(academy.expiresAt) ? "Active" : "Expired"}
          </p>
{academy.nextMembershipPlan && (
  <p className="muted">
    <strong>Next membership:</strong>{" "}
    {academy.nextMembership?.name || academy.nextMembershipPlan}
  </p>
)}
          <div className="extensionBox">
            <label className="extensionLabel">
              Choose membership for extension
            </label>

            <select
              className="extensionSelect"
              value={selectedExtensionPlan || currentMembershipId}
              onChange={(e) => setSelectedExtensionPlan(e.target.value)}
              disabled={academy.extensionRequested}
            >
              {MEMBERSHIP_PLANS.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.price}
                </option>
              ))}
            </select>

            <button
              className="primaryBtn"
              onClick={requestExtension}
              disabled={academy.extensionRequested}
            >
              {academy.extensionRequested
                ? "Extension requested"
                : "Request extension"}
            </button>

            {academy.extensionRequested &&
              academy.requestedExtensionMembership && (
                <p className="muted">
                  Requested extension:{" "}
                  <strong>{academy.requestedExtensionMembership.name}</strong>
                </p>
              )}
          </div>

          {isAccessAcademy && (
            <button
              className="secondaryBtn upgradeBtn"
              onClick={requestUpgrade}
              disabled={academy.upgradeRequested}
            >
              {academy.upgradeRequested
                ? "Upgrade requested"
                : "Request upgrade to Member"}
            </button>
          )}
        </div>
      )}

      {showJobForm && !showCoaches && !showApplications && (
        <div className="card">
          <h3>
            {editingJob
              ? "Edit Job"
              : isAccessAcademy
              ? "Request Job Post"
              : "Add Job"}
          </h3>

          {isAccessAcademy && !editingJob && (
            <p className="muted">
              This job post will be sent to admin for approval before it is
              published.
            </p>
          )}

          <input
            placeholder="Job title"
            value={jobForm.title}
            name="title"
            onChange={handleJobChange}
          />

          <input
            placeholder="Country"
            value={jobForm.country}
            name="country"
            onChange={handleJobChange}
          />

          <input
            placeholder="City"
            value={jobForm.city}
            name="city"
            onChange={handleJobChange}
          />

          <input
            placeholder="Address"
            value={jobForm.address}
            name="address"
            onChange={handleJobChange}
          />

          <div className="salaryRow">
            <input
              type="number"
              placeholder="Min salary (€)"
              name="minSalary"
              value={jobForm.minSalary}
              onChange={handleJobChange}
            />

            <input
              type="number"
              placeholder="Max salary (€)"
              name="maxSalary"
              value={jobForm.maxSalary}
              onChange={handleJobChange}
            />
          </div>

          <input
            placeholder="Job benefits"
            value={jobForm.benefits}
            name="benefits"
            onChange={handleJobChange}
          />

          <textarea
            placeholder="Description"
            value={jobForm.description}
            name="description"
            onChange={handleJobChange}
          />

          <input
            type="date"
            value={jobForm.date}
            name="date"
            onChange={handleJobChange}
          />

          <div className="editActions">
            <button className="primaryBtn" onClick={saveJob}>
              {isAccessAcademy && !editingJob ? "Send Request" : "Save"}
            </button>

            <button
              className="secondaryBtn"
              onClick={() => {
                setShowJobForm(false);
                setEditingJob(null);
                resetJobForm();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showApplications && (
        <div className="editSection">
          <h3 className="sectionTitle">Job Applications</h3>

          {applications.length === 0 ? (
            <div className="card">
              <p>No applications yet.</p>
            </div>
          ) : (
            <div className="jobsList">
              {applications.map((app) => (
                <div key={app.id} className="card">
                  <h4>{app.jobTitle || "Job application"}</h4>

                  {app.coachProfileImage && (
                    <img
                      src={app.coachProfileImage}
                      alt={app.coachName}
                      className="coachAvatarSmall"
                    />
                  )}

                  <p>
                    <strong>Coach:</strong> {app.coachName || "-"}
                  </p>

                  <p>
                    <strong>Email:</strong> {app.coachEmail || "-"}
                  </p>

                  <p>
                    <strong>Nationality:</strong>{" "}
                    {app.coachNationality || "-"}
                  </p>

                  <p>
                    <strong>Residence:</strong> {app.coachResidence || "-"}
                  </p>

                  <p>
                    <strong>Region:</strong> {app.coachRegion || "-"}
                  </p>

                  <p>
                    <strong>Membership:</strong> {app.membership || "-"}
                  </p>

                  <p>
                    <strong>Status:</strong> {app.status || "pending"}
                  </p>

                  <div className="jobActions">
                    <button
                      className="secondaryBtn"
                      onClick={() => navigate(`/coach/${app.coachId}`)}
                    >
                      View Profile
                    </button>

                    <button
                      className="primaryBtn"
                      onClick={() =>
                        updateApplicationStatus(app.id, "accepted")
                      }
                      disabled={app.status === "accepted"}
                    >
                      Accept
                    </button>

                    <button
                      className="dangerBtn"
                      onClick={() =>
                        updateApplicationStatus(app.id, "rejected")
                      }
                      disabled={app.status === "rejected"}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!showCoaches && !showApplications && (
        <div className="jobsList">
          {jobs.map((job) => (
            <div key={job.id} className="card">
              <h4>{job.title}</h4>

              <p>
                <strong>Salary:</strong>{" "}
                {job.minSalary && job.maxSalary
                  ? `€${job.minSalary} – €${job.maxSalary}`
                  : "Negotiable"}
              </p>

              <p>
                <strong>Benefits:</strong> {job.benefits}
              </p>

              <p>
                <strong>Description:</strong> {job.description}
              </p>

              <p>
                <strong>Date:</strong> {job.date}
              </p>

              <p>
                <strong>Location:</strong> {job.city}, {job.country}
              </p>

              <p>
                <strong>Address:</strong> {job.address}
              </p>

              <div className="jobActions">
                <button
                  className="secondaryBtn"
                  onClick={() => {
                    setEditingJob(job);
                    setJobForm(job);
                    setShowJobForm(true);
                    setShowApplications(false);
                  }}
                >
                  Edit
                </button>

                <button className="dangerBtn" onClick={() => deleteJob(job.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCoaches && isMemberAcademy && (
        <div className="editSection">
          <CoachList onClose={() => setShowCoaches(false)} />
        </div>
      )}

      {showLogoutModal && (
        <div className="modalOverlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logoutModal" onClick={(e) => e.stopPropagation()}>
            <h3>Sign out?</h3>
            <p>You will be signed out of your account.</p>

            <div className="logoutActions">
              <button
                className="secondaryBtn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>

              <button className="dangerBtn" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {successModal.show && (
        <div
          className="modalOverlay"
          onClick={() =>
            setSuccessModal({ show: false, title: "", message: "" })
          }
        >
          <div className="successModal" onClick={(e) => e.stopPropagation()}>
            <div className="successIcon">✓</div>

            <h3>{successModal.title}</h3>
            <p>{successModal.message}</p>

            <button
              className="primaryBtn"
              onClick={() =>
                setSuccessModal({ show: false, title: "", message: "" })
              }
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}