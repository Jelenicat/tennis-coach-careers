import "./jobs.css";
import { useEffect, useMemo, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  const [countries, setCountries] = useState([]);
  const [maxSalary, setMaxSalary] = useState(10000);

const [filters, setFilters] = useState({
  country: "",
  city: "",
  minSalary: 0   // ⬅️ BITNO
});


  // ✅ auth state
  const [user, setUser] = useState(null);

  // ✅ auth prompt modal
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchJobs() {
      const snap = await getDocs(collectionGroup(db, "jobs"));

      const jobsData = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setJobs(jobsData);

      // dropdown countries
      const uniqueCountries = [
        ...new Set(jobsData.map((j) => j.country).filter(Boolean)),
      ];
      setCountries(uniqueCountries);

      // max salary for slider
const salaries = jobsData
  .map((j) => Number(j.maxSalary))
  .filter((s) => Number.isFinite(s) && s > 0);

if (salaries.length) {
  setMaxSalary(Math.max(...salaries));
}

    }

    fetchJobs();
  }, []);

const filteredJobs = useMemo(() => {
  return jobs.filter((job) => {
    const matchCountry =
      !filters.country ||
      job.country?.toLowerCase().includes(filters.country.toLowerCase());

    const matchCity =
      !filters.city ||
      job.city?.toLowerCase().includes(filters.city.toLowerCase());

    const matchSalary =
      !filters.minSalary ||
      Number(job.maxSalary || 0) >= Number(filters.minSalary);

    return matchCountry && matchCity && matchSalary;
  });
}, [jobs, filters]);


  function requireAuth(action) {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    action?.();
  }

const salaryPercent =
  maxSalary > 0 ? (filters.minSalary / maxSalary) * 100 : 0;


  return (
    <div className="jobsPage">
      <button
  className="backBtn"
  onClick={() => navigate(-1)}
>
  ← Back
</button>

      <h1>Available Coaching Jobs</h1>

      {/* ================= FILTERS ================= */}
      {!selectedJob && (
        <>
          <div className="jobsFilters animateFilters">
            {/* COUNTRY DROPDOWN */}
            <select
              value={filters.country}
              onChange={(e) =>
                setFilters({ ...filters, country: e.target.value })
              }
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* CITY */}
            <input
              placeholder="City"
              value={filters.city ?? ""}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />

            {/* SALARY SLIDER – samo za ulogovane */}
<div className="salarySlider" style={!user ? { opacity: 0.6 } : {}}>
  <label>
    Min salary: <strong>€{filters.minSalary.toLocaleString()}</strong>
  </label>

<input
  type="range"
  min={0}
  max={maxSalary}
  step={100}
  value={filters.minSalary}
  disabled={!user}
  style={{
    background: `linear-gradient(
      to right,
      #facc15 0%,
      #facc15 ${salaryPercent}%,
      rgba(255,255,255,0.3) ${salaryPercent}%,
      rgba(255,255,255,0.3) 100%
    )`,
  }}
  onChange={(e) =>
    setFilters({
      ...filters,
      minSalary: Number(e.target.value),
    })
  }
/>



  {!user && (
    <small className="sliderHint">
      Log in to filter jobs by salary
    </small>
  )}
</div>



            <button
              className="secondaryBtn"
              onClick={() =>
             setFilters({ country: "", city: "", minSalary: 0 })

              }
            >
              Reset
            </button>
          </div>

          {/* COUNTER */}
          <p className="jobsCount">
            {filteredJobs.length} job{filteredJobs.length !== 1 && "s"} found
          </p>
        </>
      )}

      {/* ================= LIST VIEW ================= */}
      {!selectedJob && (
        <div className="jobsGrid">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="jobCard"
              onClick={() =>
                requireAuth(() => {
                  setSelectedJob(job);
                })
              }
              style={{ cursor: "pointer" }}
            >
              {/* ALWAYS VISIBLE */}
              <h3>{job.title}</h3>

              <p className="jobMeta">
                📍 {job.city || "—"}, {job.country || "—"}
              </p>

              {/* ONLY FOR LOGGED IN USERS */}
              {user && (
                <>
                  <p className="jobOrg">{job.academyName}</p>

                  <p className="jobMeta">
                  💰{" "}
{job.minSalary && job.maxSalary
  ? `€${job.minSalary.toLocaleString()} – €${job.maxSalary.toLocaleString()}`
  : "Negotiable"}

                  </p>

                  <p className="jobDesc">
                    <strong>Description:</strong> {job.description}
                  </p>

                  {job.benefits && (
                    <p className="jobBenefits">
                      <strong>Benefits:</strong> {job.benefits}
                    </p>
                  )}

                  <div className="jobFooter">
                    <span className="jobDate">{job.date}</span>
                    <button
                      className="primaryBtn"
                      onClick={(e) => {
                        e.stopPropagation();
                        requireAuth(() => {
                          // kasnije: apply flow
                        });
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </>
              )}

              {/* GUEST FOOTER (samo dugme) */}
              {!user && (
                <div className="jobFooter">
                  <span className="jobDate">{job.date}</span>
                  <button
                    className="primaryBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAuthPrompt(true);
                    }}
                  >
                    View / Apply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= DETAIL VIEW (LOGGED IN ONLY) ================= */}
      {selectedJob && user && (
        <div className="jobDetail">
          <button
            className="secondaryBtn"
            onClick={() => setSelectedJob(null)}
          >
            ← Back to jobs
          </button>

          <div className="jobCard expanded" style={{ cursor: "default" }}>
            <h2>{selectedJob.title}</h2>

            <p className="jobOrg">{selectedJob.academyName}</p>

          <p className="jobMeta">
  💰{" "}
  {selectedJob.minSalary && selectedJob.maxSalary
    ? `€${selectedJob.minSalary.toLocaleString()} – €${selectedJob.maxSalary.toLocaleString()}`
    : "Negotiable"} 
  • 📍 {selectedJob.country}, {selectedJob.city}, {selectedJob.address}
</p>


            <p className="jobAddress">{selectedJob.address}</p>

            <p className="jobDesc">
              <strong>Description:</strong>
              <br />
              {selectedJob.description}
            </p>

            {selectedJob.benefits && (
              <p className="jobBenefits">
                <strong>Benefits:</strong> {selectedJob.benefits}
              </p>
            )}

            <p className="jobDate">Posted: {selectedJob.date}</p>

            <button className="primaryBtn">
              Apply for this job
            </button>
          </div>
        </div>
      )}

      {/* ================= AUTH PROMPT (MODAL) ================= */}
      {showAuthPrompt && (
        <div className="authOverlay">

          <div className="authModal" onClick={(e) => e.stopPropagation()}>
            <h3>Login required</h3>
            <p>You must log in or sign up to view full job details and apply.</p>

            <div className="authActions">
              <button
                className="primaryBtn"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>

              <button
                className="secondaryBtn"
                onClick={() => navigate("/choose-role")}
              >
                Sign up
              </button>
            </div>

            <button
              className="authClose"
              onClick={() => setShowAuthPrompt(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}