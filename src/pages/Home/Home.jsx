import "./home.css";
import Shell from "../../components/layout/Shell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import SEO from "../../components/SEO";
export default function Home() {
  const navigate = useNavigate();
  const [showCookies, setShowCookies] = useState(false);
const [blogPosts, setBlogPosts] = useState([]);
  useEffect(() => {
    const accepted = localStorage.getItem("cookiesAccepted");
    if (!accepted) {
      setShowCookies(true);
    }
  }, []);
useEffect(() => {
  async function fetchBlogPosts() {
    try {
      const q = query(
        collection(db, "blogPosts"),
        orderBy("createdAt", "desc"),
        limit(3)
      );

      const snap = await getDocs(q);

      setBlogPosts(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  fetchBlogPosts();
}, []);
  function acceptCookies() {
    localStorage.setItem("cookiesAccepted", "true");
    setShowCookies(false);
  }

return (
  <>
    <SEO
      title="Tennis Jobs for Coaches and Academies"
      description="Tennis Coach Careers connects tennis coaches with academies worldwide. Create your profile, discover tennis job opportunities, and connect with tennis professionals."
      url="https://tennis-coach-careers.com/"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Tennis Coach Careers",
        url: "https://tennis-coach-careers.com/",
        description:
          "Tennis Coach Careers connects tennis coaches with academies worldwide. Create your profile, discover tennis job opportunities, and connect with tennis professionals.",
        publisher: {
          "@type": "Organization",
          name: "Tennis Coach Careers",
          url: "https://tennis-coach-careers.com/",
          logo: {
            "@type": "ImageObject",
            url: "https://tennis-coach-careers.com/favicon.png",
          },
        },
      }}
    />

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
            <Button onClick={() => navigate("/choose-role")}>Sign up</Button>

            <Button variant="outline" onClick={() => navigate("/login")}>
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
            Tennis Coach Careers connect tennis coaches with top clubs
            worldwide. Discover career opportunities, grow your network, and
            take your coaching to the next level.
            <br />
            <br />
            Focused on careers.
          </p>
        </section>

{/* MEMBERSHIP */}
<section className="membership">
  <div className="membershipHeader">
    <span className="membershipEyebrow">Plans & Pricing</span>

    <h2 className="membershipTitle">Membership Plans</h2>

    <p className="membershipSubtitle">
      Choose the plan that fits your journey.
    </p>
  </div>

  <div className="membershipBlock">
    <div className="membershipBlockHeader">
      <span className="membershipLabel">Coach Memberships</span>
      <h3>For tennis coaches looking for opportunities worldwide.</h3>
    </div>

    <div className="membershipSlider">
      <div className="membershipPlanCard blue">
        <div className="planTop">
          <span>Standard</span>
          <strong>50€</strong>
          <small>per year*</small>
        </div>

        <ul>
          <li>Public coach profile</li>
          <li>5 job applications / month</li>
          <li>CV advice</li>
          <li>Video portfolio advice</li>
        </ul>

        <Button onClick={() => navigate("/choose-role")}>Get Started</Button>
      </div>

      <div className="membershipPlanCard blue diamond">
        <div className="planBadge">Best Value</div>

        <div className="planTop">
          <span>Diamond</span>
          <strong>220€</strong>
          <small>per year*</small>
        </div>

        <ul>
          <li>Public coach profile</li>
          <li>Unlimited job applications</li>
          <li>Negotiation guide</li>
          <li>Professional CV creation</li>
          <li>Video portfolio creation</li>
          <li>Instagram promotion</li>
        </ul>

        <Button onClick={() => navigate("/choose-role")}>Get Started</Button>
      </div>

      <div className="membershipPlanCard blue">
        <div className="planTop">
          <span>Premium</span>
          <strong>130€</strong>
          <small>per year*</small>
        </div>

        <ul>
          <li>Public coach profile</li>
          <li>Unlimited job applications</li>
          <li>Professional CV creation</li>
          <li>Video portfolio advice</li>
          <li>Negotiation guide</li>
        </ul>

        <Button onClick={() => navigate("/choose-role")}>Get Started</Button>
      </div>
    </div>
  </div>

  <div className="membershipBlock">
    <div className="membershipBlockHeader">
      <span className="membershipLabel yellowLabel">
        Clubs / Agents / Academies
      </span>
      <h3>For organisations looking to hire tennis coaches.</h3>
    </div>

    <div className="membershipSlider twoPlans">
      <div className="membershipPlanCard yellow">
        <div className="planTop">
          <span>Access</span>
          <strong>Free</strong>
          <small>paying per post*</small>
        </div>

        <ul>
          <li>Paying per job post</li>
          <li>Discount for 3 posts</li>
          <li>Discount for 5 posts</li>
        </ul>

        <Button onClick={() => navigate("/choose-role")}>Get Started</Button>
      </div>

      <div className="membershipPlanCard yellow">
        <div className="planTop">
          <span>Member</span>
          <strong>300€</strong>
          <small>per year*</small>
        </div>

        <ul>
          <li>Unlimited job posts</li>
          <li>Access to database</li>
          <li>Communication support</li>
          <li>Instagram promotion</li>
          <li>Ad creation support</li>
        </ul>

        <Button onClick={() => navigate("/choose-role")}>Get Started</Button>
      </div>
    </div>
  </div>
</section>
{blogPosts.length > 0 && (
  <section className="homeBlog compactBlog">
    <div className="homeBlogHeader">
      <span className="homeBlogEyebrow">From the blog</span>
      <h2 className="homeBlogTitle">Latest posts</h2>
      <p className="homeBlogSubtitle">
        Short insights, updates and content for coaches and academies.
      </p>
    </div>

    <div className="homeBlogGrid compactBlogGrid">
      {blogPosts.map((post) => (
        <article
          className="homeBlogCard compactBlogCard"
          key={post.id}
          onClick={() => navigate(`/blog/${post.id}`)}
        >
          <div className="homeBlogContent">
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>

            <button
              className="blogReadBtn"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/blog/${post.id}`);
              }}
            >
              Read more
            </button>
          </div>
        </article>
      ))}
    </div>
  </section>
)}
        {/* TESTIMONIALS */}
        <section className="testimonials">
          <h2 className="testimonialsTitle">What Coaches Say</h2>
          <p className="testimonialsSubtitle">
            Real experiences from tennis coaches using our platform
          </p>

          <div className="testimonialsGrid">
            <div className="testimonialCard">
              <p className="testimonialText">
                “Tennis Coach Careers helped me connect with international
                academies. The platform is clean, professional and easy to use.”
              </p>

              <div className="testimonialAuthor">
                <strong>Marko J.</strong>
                <span>Professional Tennis Coach</span>
              </div>
            </div>

            <div className="testimonialCard">
              <p className="testimonialText">
                “I received multiple job offers within weeks. Having my profile
                and videos in one place makes a huge difference.”
              </p>

              <div className="testimonialAuthor">
                <strong>Lucas R.</strong>
                <span>ATP Certified Coach</span>
              </div>
            </div>

            <div className="testimonialCard">
              <p className="testimonialText">
                “Finally a platform focused only on coaching careers. It feels
                premium and serious — exactly what the tennis world needs.”
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
          <p>Join tennis coaches and academies building careers worldwide.</p>

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
              Membership unlocks full access to job applications and profile
              visibility.
            </p>
          </div>

          <div className="faqItem">
            <h4>Can I cancel anytime?</h4>
            <p>
              Memberships are annual and can be renewed or cancelled before
              expiration.
            </p>
          </div>

          <div className="faqItem">
            <h4>Is this platform only for tennis?</h4>
            <p>
              Yes. Tennis Coach Careers is focused exclusively on tennis
              coaching roles.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footerInner">
            <div className="footerBrand">Tennis Coach Careers</div>

            <div className="footerLinks">
              <button onClick={() => navigate("/terms")}>Terms of Use</button>
              <button onClick={() => navigate("/privacy")}>
                Privacy Policy
              </button>
              <button onClick={() => navigate("/cookies")}>
                Cookie Policy
              </button>
              <button onClick={() => navigate("/contact")}>Contact</button>
            </div>

            <p className="footerCopy">
              © {new Date().getFullYear()} Tennis Coach Careers. All rights
              reserved.
            </p>
          </div>
        </footer>

        {/* COOKIE BANNER */}
        {showCookies && (
          <div className="cookieBanner">
            <p>
              We use cookies to improve your experience and keep your session
              secure.
            </p>

            <div className="cookieActions">
              <button onClick={() => navigate("/cookies")}>Learn more</button>
              <button className="acceptCookieBtn" onClick={acceptCookies}>
                Accept
              </button>
            </div>
          </div>
        )}
      </div>
      </Shell>
  </>
);
}