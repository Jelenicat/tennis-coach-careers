import "./LegalPage.css";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/SEO";

export default function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Terms of Use"
        description="Read the Terms of Use for Tennis Coach Careers, including accounts, memberships, coach profiles, academy job listings and platform rules."
        url="https://tennis-coach-careers.com/terms"
      />

      <main className="legalPage">
        <div className="legalCard">
          <button className="legalBack" onClick={() => navigate("/")}>
            ← Back to Home
          </button>

          <h1>Terms of Use</h1>
          <p className="legalUpdated">Last updated: January 2026</p>

          <p>
            Welcome to Tennis Coach Careers. By using this platform, you agree
            to these Terms of Use.
          </p>

          <h2>1. Platform purpose</h2>
          <p>
            Tennis Coach Careers connects tennis coaches with academies, clubs
            and organizations looking for tennis professionals.
          </p>

          <h2>2. User accounts</h2>
          <p>
            Coaches and academies may create accounts and profiles. You are
            responsible for keeping your account information accurate and
            secure.
          </p>

          <h2>3. Membership</h2>
          <p>
            Certain features may require an active membership. Membership plans,
            prices and included features are displayed on the platform.
          </p>

          <h2>4. Job listings and profiles</h2>
          <p>
            Academies are responsible for the accuracy of job listings they
            post. Coaches are responsible for the accuracy of their profiles,
            qualifications, experience and uploaded content.
          </p>

          <h2>5. No employment guarantee</h2>
          <p>
            Tennis Coach Careers does not guarantee that coaches will receive
            job offers or that academies will find suitable candidates.
          </p>

          <h2>6. User conduct</h2>
          <p>You agree not to use the platform for:</p>
          <ul>
            <li>false or misleading information,</li>
            <li>spam or abusive communication,</li>
            <li>illegal activity,</li>
            <li>uploading harmful or inappropriate content.</li>
          </ul>

          <h2>7. Limitation of responsibility</h2>
          <p>
            Tennis Coach Careers provides the platform as a connection service.
            Agreements, interviews, employment contracts and payments between
            coaches and academies are the responsibility of those parties.
          </p>

          <h2>8. Changes to terms</h2>
          <p>
            We may update these Terms of Use from time to time. Continued use of
            the platform means you accept the updated terms.
          </p>

          <h2>9. Contact</h2>
          <p>
            For questions about these terms, please contact us through the
            Contact page.
          </p>
        </div>
      </main>
    </>
  );
}