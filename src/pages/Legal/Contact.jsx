import "./LegalPage.css";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/SEO";

export default function Contact() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Contact"
        description="Contact Tennis Coach Careers for support, membership questions, coach profiles, academy accounts and tennis job listings."
        url="https://tennis-coach-careers.com/contact"
      />

      <main className="legalPage">
        <div className="legalCard">
          <button className="legalBack" onClick={() => navigate("/")}>
            ← Back to Home
          </button>

          <h1>Contact</h1>
          <p className="legalUpdated">We are here to help.</p>

          <p>
            For support, questions about memberships, coach profiles, academy
            accounts or job listings, please contact us.
          </p>

          <h2>Email</h2>
          <p>support@tennis-coach-careers.com</p>

          <h2>Business inquiries</h2>
          <p>
            If you are an academy, club or organization interested in using
            Tennis Coach Careers, you can contact us by email.
          </p>

          <h2>Response time</h2>
          <p>
            We aim to respond to all inquiries as soon as possible during
            business days.
          </p>
        </div>
      </main>
    </>
  );
}