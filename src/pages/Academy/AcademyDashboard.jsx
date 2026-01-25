import "./academyProfile.css";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import CoachList from "../Coach/CoachList";
import { serverTimestamp } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";


export default function AcademyDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
async function handleLogout() {
  const ok = window.confirm("Are you sure you want to log out?");
  if (!ok) return;

  await signOut(auth);
navigate("/login", { replace: true });

}


  const [academy, setAcademy] = useState(null);
  const [formData, setFormData] = useState(null);
  const [editMode, setEditMode] = useState(false);
const [showCoaches, setShowCoaches] = useState(false);
const [checkingAuth, setCheckingAuth] = useState(true);

  /* JOBS */
  const [jobs, setJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
  title: "",
  salary: "",
  benefits: "",
  description: "",
  date: "",

  country: "",
  city: "",
  address: "",
});
/* ================= AUTH GUARD ================= */
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





/* ================= FETCH ================= */
useEffect(() => {
  if (!id) return;

  async function fetchAcademy() {
    const snap = await getDoc(doc(db, "academies", id));
    if (snap.exists()) {
      setAcademy(snap.data());
      setFormData(snap.data());
    }
  }

  async function fetchJobs() {
    const snap = await getDocs(collection(db, "academies", id, "jobs"));
    setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  fetchAcademy();
  fetchJobs();
}, [id]);

/* ⬇️ SAD JE OK */
if (checkingAuth) {
  return (
    <div className="loader">
      <p>Checking access…</p>
    </div>
  );
}

  if (!academy || !formData) {
 return (
  <div className="loader">
    <p>Loading academy profile…</p>
  </div>
);

}


  /* ================= HANDLERS ================= */
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }

  async function handleSaveProfile() {
    await updateDoc(doc(db, "academies", id), formData);
    setAcademy(formData);
    setEditMode(false);
  }

async function saveJob() {
  if (editingJob) {
    await updateDoc(
      doc(db, "academies", id, "jobs", editingJob.id),
      jobForm
    );

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

    setJobs((prev) => [
      ...prev,
      { ...jobForm, id: docRef.id },
    ]);
  }

  setShowJobForm(false);
  setEditingJob(null);
  setJobForm({
    title: "",
    salary: "",
    benefits: "",
    description: "",
    date: "",
    country: "",
    city: "",
    address: "",
  });
}


 async function deleteJob(jobId) {
  const ok = window.confirm("Are you sure you want to delete this job post?");
  if (!ok) return;

  await deleteDoc(doc(db, "academies", id, "jobs", jobId));
  setJobs((prev) => prev.filter((j) => j.id !== jobId));
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
                <input
                  className="inputHero"
                  name="organisationName"
                  value={formData.organisationName || ""}
                  onChange={handleChange}
                />
                <input
                  className="inputHero small"
                  name="city"
                  value={formData.city || ""}
                  onChange={handleChange}
                />
                <input
                  className="inputHero small"
                  name="region"
                  value={formData.region || ""}
                  onChange={handleChange}
                />
                <input
                  className="inputHero small"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  placeholder="Address"
                />
              </>
            ) : (
              <>
                <h1>{academy.organisationName}</h1>
                <p>
                  {academy.city} • {academy.region}
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
      onClick={handleLogout}
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
        setJobForm({
          title: "",
          salary: "",
          benefits: "",
          description: "",
          date: "",
          country: "",
          city: "",
          address: "",
        });
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
            onChange={(e) =>
              setJobForm({ ...jobForm, title: e.target.value })
            }
          />
          <input
  placeholder="Country"
  value={jobForm.country}
  onChange={(e) =>
    setJobForm({ ...jobForm, country: e.target.value })
  }
/>

<input
  placeholder="City"
  value={jobForm.city}
  onChange={(e) =>
    setJobForm({ ...jobForm, city: e.target.value })
  }
/>

<input
  placeholder="Address"
  value={jobForm.address}
  onChange={(e) =>
    setJobForm({ ...jobForm, address: e.target.value })
  }
/>

          <input
            placeholder="Salary / Budget"
            value={jobForm.salary}
            onChange={(e) =>
              setJobForm({ ...jobForm, salary: e.target.value })
            }
          />
          <input
            placeholder="Job benefits"
            value={jobForm.benefits}
            onChange={(e) =>
              setJobForm({ ...jobForm, benefits: e.target.value })
            }
          />
          <textarea
            placeholder="Description"
            value={jobForm.description}
            onChange={(e) =>
              setJobForm({ ...jobForm, description: e.target.value })
            }
          />
          <input
            type="date"
            value={jobForm.date}
            onChange={(e) =>
              setJobForm({ ...jobForm, date: e.target.value })
            }
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
      {/* JOB LIST */}
{!showCoaches && (
  <div className="jobsList">
    {jobs.map((job) => (
      <div key={job.id} className="card">
        <h4>{job.title}</h4>
        <p><strong>Salary:</strong> {job.salary}</p>
        <p><strong>Benefits:</strong> {job.benefits}</p>
        <p><strong>Description:</strong> {job.description}</p>
        <p><strong>Date:</strong> {job.date}</p>
<p>
  <strong>Location:</strong>{" "}
  {job.city}, {job.country}
</p>
<p>
  <strong>Address:</strong>{" "}
  {job.address}
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
          <button
            className="dangerBtn"
            onClick={() => deleteJob(job.id)}
          >
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
    </div>
  );
}
