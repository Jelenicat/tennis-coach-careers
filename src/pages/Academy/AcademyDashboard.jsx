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
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /* JOBS */
  const [jobs, setJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
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

  /* ================= HANDLERS (MORAJU BITI PRE RETURN-A) ================= */

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
          job.id === editingJob.id
            ? { ...jobForm, id: editingJob.id }
            : job
        )
      );
    } else {
      const docRef = await addDoc(collection(db, "academies", id, "jobs"), {
        ...jobForm,
        academyId: id,
        academyName: academy.organisationName,
        createdAt: serverTimestamp(),
      });

      setJobs((prev) => [...prev, { ...jobForm, id: docRef.id }]);
    }

    setShowJobForm(false);
    setEditingJob(null);
    resetJobForm();
  }, [academy, editingJob, id, jobForm, resetJobForm]);

  const deleteJob = useCallback(
    async (jobId) => {
      const ok = window.confirm("Are you sure you want to delete this job post?");
      if (!ok) return;

      await deleteDoc(doc(db, "academies", id, "jobs", jobId));
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    },
    [id]
  );

  /* ================= EFFECTS ================= */

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
      if (!user || user.uid !== id) {
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
  }, [navigate, id]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function fetchAcademy() {
      const snap = await getDoc(doc(db, "academies", id));
      if (active && snap.exists()) {
        setAcademy(snap.data());
        setFormData(snap.data());
      }
    }

    async function fetchJobs() {
      const snap = await getDocs(collection(db, "academies", id, "jobs"));
      if (!active) return;
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    fetchAcademy();
    fetchJobs();

    return () => {
      active = false;
    };
  }, [id]);

  /* ================= EARLY RETURNS ================= */

  if (checkingAuth) {
    return <div className="loader"><p>Checking access...</p></div>;
  }

  if (!academy || !formData) {
    return <div className="loader"><p>Loading academy profile...</p></div>;
  }

  /* ================= RENDER ================= */
  return (
    <div className="coachProfilePage">
      {/* HERO */}
      <div className="coachHero">
        <div className="coachHeroContent">
          <div className="coachInfo">
            {editMode ? (
     <>
  {/* ORGANISATION NAME */}
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

      {/* CONTACT INFO */}
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

      {/* ACTIONS */}
      {!editMode && (
        <div className="dashboardActions">
          <button
            className="primaryBtn"
            onClick={() => {
              setShowJobForm(true);
              setEditingJob(null);
              resetJobForm();
            }}
          >
            Add Job Post
          </button>

          <button
            className="secondaryBtn"
            onClick={() => {
              setShowCoaches(true);
              setShowJobForm(false);
              setEditingJob(null);
            }}
          >
            View Coaches
          </button>
        </div>
      )}

      {/* JOB FORM */}
      {showJobForm && !showCoaches && (
        <div className="card">
          <h3>{editingJob ? "Edit Job" : "Add Job"}</h3>

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
              Save
            </button>
            <button
              className="secondaryBtn"
              onClick={() => setShowJobForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* JOB LIST */}
      {!showCoaches && (
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

      {showCoaches && (
        <div className="editSection">
          <CoachList onClose={() => setShowCoaches(false)} />
        </div>
      )}
      {showLogoutModal && (
        <div
          className="modalOverlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="logoutModal"
            onClick={(e) => e.stopPropagation()}
          >
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
    </div>
  );
}
