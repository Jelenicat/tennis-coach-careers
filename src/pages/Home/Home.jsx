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
{/* MEMBERSHIP */}
<section className="membership">
  <h2 className="membershipTitle">Membership Plans</h2>
  <p className="membershipSubtitle">
    Simple annual plans designed for coaches and academies.
  </p>

  <div className="membershipGrid">
    {/* COACH PLAN */}
    <div className="membershipCard">
      <h3>Coach Membership</h3>
      <p className="membershipPrice">€99 / year</p>

      <p className="membershipDesc">
        Create a professional coaching profile, showcase your experience
        and apply for coaching jobs worldwide.
      </p>

      <ul className="membershipFeatures">
        <li>Public coach profile</li>
        <li>Apply for jobs</li>
        <li>Video & gallery showcase</li>
      </ul>

      <Button onClick={() => navigate("/choose-role")}>
        Get Started
      </Button>
    </div>

    {/* ACADEMY PLAN */}
 <div className="membershipCard highlight featured">
  <div className="featuredBadge">Most Popular</div>

  <h3>Academy Membership</h3>
  <p className="membershipPrice">€199 / year</p>

      <p className="membershipDesc">
        Post job openings, connect with qualified coaches
        and grow your academy globally.
      </p>

      <ul className="membershipFeatures">
        <li>Post job listings</li>
        <li>Access coach database</li>
        <li>Direct coach contact</li>
      </ul>

      <Button onClick={() => navigate("/choose-role")}>
        Post a Job
      </Button>
    </div>
  </div>
</section>
{/* TESTIMONIALS */}
<section className="testimonials">
  <h2 className="testimonialsTitle">What Coaches Say</h2>
  <p className="testimonialsSubtitle">
    Real experiences from tennis coaches using our platform
  </p>

  <div className="testimonialsGrid">
    <div className="testimonialCard">
      <p className="testimonialText">
        “Tennis Coach Careers helped me connect with international academies.
        The platform is clean, professional and easy to use.”
      </p>

      <div className="testimonialAuthor">
        <strong>Marko J.</strong>
        <span>Professional Tennis Coach</span>
      </div>
    </div>

    <div className="testimonialCard">
      <p className="testimonialText">
        “I received multiple job offers within weeks.
        Having my profile and videos in one place makes a huge difference.”
      </p>

      <div className="testimonialAuthor">
        <strong>Lucas R.</strong>
        <span>ATP Certified Coach</span>
      </div>
    </div>

    <div className="testimonialCard">
      <p className="testimonialText">
        “Finally a platform focused only on coaching careers.
        It feels premium and serious — exactly what the tennis world needs.”
      </p>

      <div className="testimonialAuthor">
        <strong>Elena P.</strong>
        <span>Tennis Coach • Europe</span>
      </div>
    </div>
  </div>
</section>

{/* FINAL CTA */}
<section className="finalCta">
  <h2>Ready to take the next step?</h2>
  <p>
    Join tennis coaches and academies building careers worldwide.
  </p>

  <div className="finalCtaActions">
    <Button onClick={() => navigate("/choose-role")}>
      Get Started
    </Button>

    <Button variant="outline" onClick={() => navigate("/jobs")}>
      Browse Jobs
    </Button>
  </div>
</section>
{/* STATS */}
<section className="stats">
  <div className="statsGrid">
    <div>
      <strong>100+</strong>
      <span>Coaches</span>
    </div>
    <div>
      <strong>50+</strong>
      <span>Academies</span>
    </div>
    <div>
      <strong>20+</strong>
      <span>Countries</span>
    </div>
  </div>
</section>
{/* FAQ */}
<section className="faq">
  <h2>Frequently Asked Questions</h2>

  <div className="faqItem">
    <h4>Is membership required?</h4>
    <p>
      Membership unlocks full access to job applications and profile visibility.
    </p>
  </div>

  <div className="faqItem">
    <h4>Can I cancel anytime?</h4>
    <p>
      Memberships are annual and can be renewed or cancelled before expiration.
    </p>
  </div>

  <div className="faqItem">
    <h4>Is this platform only for tennis?</h4>
    <p>
      Yes. Tennis Coach Careers is focused exclusively on tennis coaching roles.
    </p>
  </div>
</section>

      </div>
    </Shell>
  );
}
