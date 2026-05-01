import "./jobs.css";
import { useEffect, useMemo, useState } from "react";
import {
  collectionGroup,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/SEO";
export default function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  const [countries, setCountries] = useState([]);
  const [maxSalary, setMaxSalary] = useState(10000);

  const [filters, setFilters] = useState({
    country: "",
    city: "",
    minSalary: 0,
  });

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [coach, setCoach] = useState(null);
  const [applications, setApplications] = useState([]);

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const [noticeModal, setNoticeModal] = useState({
    show: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setUserRole(null);
        setCoach(null);
        setApplications([]);
        return;
      }

      const userSnap = await getDoc(doc(db, "users", u.uid));

      if (userSnap.exists()) {
        setUserRole(userSnap.data().role || null);
      }

      const coachSnap = await getDoc(doc(db, "coaches", u.uid));

      if (coachSnap.exists()) {
        setCoach(coachSnap.data());
      } else {
        setCoach(null);
      }

      await fetchApplications(u.uid);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchJobs() {
      const snap = await getDocs(collectionGroup(db, "jobs"));

      const jobsData = snap.docs.map((d) => ({
        id: d.id,
        jobPath: d.ref.path,
        ...d.data(),
      }));

      setJobs(jobsData);

      const uniqueCountries = [
        ...new Set(jobsData.map((j) => j.country).filter(Boolean)),
      ];

      setCountries(uniqueCountries);

      const salaries = jobsData
        .flatMap((j) => [Number(j.minSalary), Number(j.maxSalary)])
        .filter((s) => Number.isFinite(s) && s > 0);

      if (salaries.length) {
        setMaxSalary(Math.max(...salaries));
      }
    }

    fetchJobs();
  }, []);

  async function fetchApplications(coachId) {
    const q = query(
      collection(db, "jobApplications"),
      where("coachId", "==", coachId)
    );

    const snap = await getDocs(q);

    setApplications(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  }

  function parseSalary(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
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

  function isCoachMembershipActive() {
    if (userRole !== "coach") return true;
    return isProfileActive(coach?.expiresAt);
  }

  function getMembershipKey() {
    return (
      coach?.membership?.id ||
      coach?.membershipPlan ||
      coach?.membership ||
      "standard"
    )
      .toString()
      .toLowerCase();
  }

  function hasApplied(job) {
    return applications.some(
      (app) => app.jobPath === job.jobPath || app.jobId === job.id
    );
  }

  function openNotice(title, message) {
    setNoticeModal({
      show: true,
      title,
      message,
    });
  }

  async function handleApply(job) {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    if (userRole !== "coach") {
      openNotice("Coach account required", "Only coaches can apply for jobs.");
      return;
    }

    if (!coach) {
      openNotice(
        "Profile not found",
        "Your coach profile could not be loaded."
      );
      return;
    }

    if (!isProfileActive(coach.expiresAt)) {
      openNotice(
        "Membership expired",
        "Your membership has expired. Please request an extension before applying for jobs."
      );
      return;
    }

    if (hasApplied(job)) {
      openNotice("Already applied", "You have already applied for this job.");
      return;
    }

    const membership = getMembershipKey();

    if (membership === "standard" && applications.length >= 5) {
      openNotice(
        "Application limit reached",
        "Standard membership allows only 5 job applications. Please upgrade your membership to apply for more jobs."
      );
      return;
    }

    await addDoc(collection(db, "jobApplications"), {
      jobId: job.id,
      jobPath: job.jobPath,

      jobTitle: job.title || "",
      academyId: job.academyId || "",
      academyName: job.academyName || "",

      coachId: user.uid,
      coachName: coach.fullName || "",
      coachEmail: coach.email || user.email || "",
      coachNationality: coach.nationality || "",
      coachResidence: coach.residence || "",
      coachRegion: coach.region || "",
      coachProfileImage: coach.profileImage || "",

      membership,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    const newApplication = {
      jobId: job.id,
      jobPath: job.jobPath,
      status: "pending",
    };

    setApplications((prev) => [...prev, newApplication]);

    openNotice(
      "Application sent",
      "Your application has been successfully sent to the academy."
    );
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchCountry =
        !filters.country ||
        job.country?.toLowerCase().includes(filters.country.toLowerCase());

      const matchCity =
        !filters.city ||
        job.city?.toLowerCase().includes(filters.city.toLowerCase());

      const selectedMinSalary = parseSalary(filters.minSalary);
      const jobMinSalary = parseSalary(job.minSalary);
      const jobMaxSalary = parseSalary(job.maxSalary);

      const matchSalary =
        selectedMinSalary === 0 ||
        jobMinSalary >= selectedMinSalary ||
        jobMaxSalary >= selectedMinSalary;

      const academyVisible = job.academyProfileVisible !== false;

      const academyApproved =
        !job.academyApprovalStatus || job.academyApprovalStatus === "approved";

      const academyActive =
        !job.academyExpiresAt || isProfileActive(job.academyExpiresAt);

      return (
        academyVisible &&
        academyApproved &&
        academyActive &&
        matchCountry &&
        matchCity &&
        matchSalary
      );
    });
  }, [jobs, filters]);

  function requireAuth(action) {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    if (userRole === "coach" && coach && !isCoachMembershipActive()) {
      openNotice(
        "Membership expired",
        "Your membership has expired. Please request an extension before viewing job details."
      );
      return;
    }

    action?.();
  }

  const salaryPercent =
    maxSalary > 0 ? (filters.minSalary / maxSalary) * 100 : 0;

 return (
  <>
    <SEO
      title="Tennis Coaching Jobs Worldwide"
      description="Browse tennis coaching jobs and academy opportunities worldwide. Find tennis coach roles by country, city and salary."
      url="https://tennis-coach-careers.com/jobs"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Tennis Coaching Jobs Worldwide",
        url: "https://tennis-coach-careers.com/jobs",
        description:
          "Browse tennis coaching jobs and academy opportunities worldwide. Find tennis coach roles by country, city and salary.",
        isPartOf: {
          "@type": "WebSite",
          name: "Tennis Coach Careers",
          url: "https://tennis-coach-careers.com/",
        },
      }}
    />

    <div className="jobsPage">
      <button className="backBtn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1>Available Coaching Jobs</h1>

      {!selectedJob && (
        <>
          <div className="jobsFilters animateFilters">
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

            <input
              placeholder="City"
              value={filters.city ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, city: e.target.value })
              }
            />

            <div className="salarySlider" style={!user ? { opacity: 0.6 } : {}}>
              <label>
                Min salary:{" "}
                <strong>€{filters.minSalary.toLocaleString()}</strong>
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

          <p className="jobsCount">
            {filteredJobs.length} job{filteredJobs.length !== 1 && "s"} found
          </p>
        </>
      )}

      {!selectedJob && (
        <div className="jobsGrid">
          {filteredJobs.map((job) => {
            const applied = hasApplied(job);

            return (
              <div
                key={job.jobPath}
                className="jobCard"
                onClick={() =>
                  requireAuth(() => {
                    setSelectedJob(job);
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <h3>{job.title}</h3>

                <p className="jobMeta">
                  📍 {job.city || "—"}, {job.country || "—"}
                </p>

                {user && (
                  <>
                    <p className="jobOrg">{job.academyName}</p>

                    <p className="jobMeta">
                      💰{" "}
                      {job.minSalary && job.maxSalary
                        ? `€${Number(
                            job.minSalary
                          ).toLocaleString()} – €${Number(
                            job.maxSalary
                          ).toLocaleString()}`
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
                        disabled={applied}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(job);
                        }}
                      >
                        {applied ? "Applied" : "Apply"}
                      </button>
                    </div>
                  </>
                )}

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
            );
          })}
        </div>
      )}

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
                ? `€${Number(
                    selectedJob.minSalary
                  ).toLocaleString()} – €${Number(
                    selectedJob.maxSalary
                  ).toLocaleString()}`
                : "Negotiable"}{" "}
              • 📍 {selectedJob.country}, {selectedJob.city},{" "}
              {selectedJob.address}
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

            <button
              className="primaryBtn"
              disabled={hasApplied(selectedJob)}
              onClick={() => handleApply(selectedJob)}
            >
              {hasApplied(selectedJob) ? "Applied" : "Apply for this job"}
            </button>
          </div>
        </div>
      )}

      {showAuthPrompt && (
        <div className="authOverlay">
          <div className="authModal" onClick={(e) => e.stopPropagation()}>
            <h3>Login required</h3>

            <p>You must log in or sign up to view full job details and apply.</p>

            <div className="authActions">
              <button className="primaryBtn" onClick={() => navigate("/login")}>
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

      {noticeModal.show && (
        <div className="authOverlay">
          <div className="authModal" onClick={(e) => e.stopPropagation()}>
            <h3>{noticeModal.title}</h3>

            <p>{noticeModal.message}</p>

            <div className="authActions">
              <button
                className="primaryBtn"
                onClick={() =>
                  setNoticeModal({
                    show: false,
                    title: "",
                    message: "",
                  })
                }
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
       </div>
  </>
);
}