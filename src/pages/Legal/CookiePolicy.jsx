import "./LegalPage.css";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/SEO";

export default function CookiePolicy() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Cookie Policy"
        description="Read the Cookie Policy for Tennis Coach Careers and learn how cookies are used for login, preferences, performance and account security."
        url="https://tennis-coach-careers.com/cookies"
      />

      <main className="legalPage">
        <div className="legalCard">
          <button className="legalBack" onClick={() => navigate("/")}>
            ← Back to Home
          </button>

          <h1>Cookie Policy</h1>
          <p className="legalUpdated">Last updated: January 2026</p>

          <p>
            This Cookie Policy explains how Tennis Coach Careers uses cookies
            and similar technologies.
          </p>

          <h2>1. What are cookies?</h2>
          <p>
            Cookies are small text files stored on your device. They help
            websites remember information about your visit.
          </p>

          <h2>2. How we use cookies</h2>
          <p>We may use cookies to:</p>
          <ul>
            <li>keep users logged in,</li>
            <li>remember cookie preferences,</li>
            <li>improve website performance,</li>
            <li>protect account security.</li>
          </ul>

          <h2>3. Essential cookies</h2>
          <p>
            Some cookies are necessary for the platform to work properly, such
            as authentication and security-related cookies.
          </p>

          <h2>4. Cookie consent</h2>
          <p>
            When you first visit the website, you may see a cookie banner. By
            accepting cookies, you agree to the use of cookies described in this
            policy.
          </p>

          <h2>5. Managing cookies</h2>
          <p>
            You can delete or block cookies through your browser settings.
            However, some parts of the platform may not work correctly if
            cookies are disabled.
          </p>

          <h2>6. Contact</h2>
          <p>
            For questions about this Cookie Policy, please contact us through
            the Contact page.
          </p>
        </div>
      </main>
    </>
  );
}