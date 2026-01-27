import "./home.css";
import Shell from "../../components/layout/Shell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Shell>
      
      <div className="home">
        {/* DESKTOP HEADER */}
<header className="desktopHeader">
  <div className="desktopHeaderInner">
    <img
      src="/images/logo.png"
      alt="Tennis Coach Careers"
      className="desktopHeaderLogo"
    />

    <nav className="desktopNav">
      <button onClick={() => navigate("/jobs")}>Jobs</button>
      <button onClick={() => navigate("/coaches")}>Coaches</button>
      <button onClick={() => navigate("/login")}>Log in</button>
      <button
        className="headerCta"
        onClick={() => navigate("/choose-role")}
      >
        Sign up
      </button>
    </nav>
  </div>
</header>

        {/* HERO */}
        <section className="hero">
          <img
            src="/images/logo.png"
            alt="Tennis Coach Careers"
            className="homeLogo"
              onClick={() => navigate("/")}
          />

          <h1 className="homeTitle">Tennis Coach Careers</h1>

          <p className="homeSubtitle">
            Connecting tennis coaches & academies worldwide
          </p>

          <div className="homeAuth">
            <Button onClick={() => navigate("/choose-role")}>
              Sign up
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Log in
            </Button>
          </div>
        </section>

        {/* ACTION CARDS */}
        <section className="homeActions">
          <Card
            className="homeActionCard"
            onClick={() => navigate("/jobs")}
            style={{
              backgroundImage: "url('/images/find-job.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="homeActionContent">
              <div className="homeActionTitle">Find a Job</div>
              <div className="homeActionText">
                Browse coaching opportunities worldwide
              </div>
            </div>
          </Card>

          <Card
            className="homeActionCard"
            onClick={() => navigate("/coaches")}
            style={{
              backgroundImage: "url('/images/find-coach.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="homeActionContent">
              <div className="homeActionTitle">Find a Coach</div>
              <div className="homeActionText">
                Clubs and academies can post job listings
              </div>
            </div>
          </Card>
        </section>

  {/* ABOUT */}
<section className="about">
  <h2 className="aboutTitle">About Tennis Coach Careers</h2>
  <p className="aboutText">
   Tennis Coach Careers connect tennis coaches with top clubs worldwide. Discover career opportunities, grow your network, and take your coaching to the next level.

Focused on careers.
  </p>
</section>

      </div>
    </Shell>
  );
}
