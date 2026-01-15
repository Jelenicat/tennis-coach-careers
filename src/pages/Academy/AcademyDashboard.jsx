import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import "./academyDashboard.css";

export default function AcademyDashboard() {
  const navigate = useNavigate();

  // ⬇️ privremeni mock (kasnije iz baze)
  const jobs = [
    {
      id: 1,
      title: "Tennis Coach",
      city: "Barcelona",
      date: "2024-09-15",
    },
    {
      id: 2,
      title: "Head Coach",
      city: "Dubai",
      date: "2024-10-01",
    },
  ];

  return (
    <div className="academyDashboard">
      {/* HEADER */}
      <header className="academyHeader">
        <div>
          <h1>My Academy</h1>
          <p className="academySub">
            Manage your job listings
          </p>
        </div>

        <Button onClick={() => navigate("/academy/job/new")}>
          + Post New Job
        </Button>
      </header>

      {/* STATS */}
      <section className="academyStats">
        <Card>
          <strong>{jobs.length}</strong>
          <span>Active Jobs</span>
        </Card>
      </section>

      {/* JOB LIST */}
      <section className="academyJobs">
        {jobs.length === 0 ? (
          <p>No jobs posted yet.</p>
        ) : (
          jobs.map((job) => (
            <Card
              key={job.id}
              className="jobCard"
              onClick={() =>
                navigate(`/academy/job/${job.id}`)
              }
            >
              <h3>{job.title}</h3>
              <p>{job.city}</p>
              <small>Start date: {job.date}</small>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
