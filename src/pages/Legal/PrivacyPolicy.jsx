import "./LegalPage.css";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <main className="legalPage">
      <div className="legalCard">
        <button className="legalBack" onClick={() => navigate("/")}>
          ← Back to Home
        </button>

        <h1>Privacy Policy</h1>
        <p className="legalUpdated">Last updated: January 2026</p>

        <p>
          This Privacy Policy explains how Tennis Coach Careers collects, uses
          and protects your personal information.
        </p>

        <h2>1. Information we collect</h2>
        <p>We may collect the following information:</p>
        <ul>
          <li>name and surname,</li>
          <li>email address,</li>
          <li>phone number,</li>
          <li>profile information,</li>
          <li>academy or organization details,</li>
          <li>uploaded images, videos or gallery content,</li>
          <li>job listings and application-related data.</li>
        </ul>

        <h2>2. How we use your information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>create and manage accounts,</li>
          <li>display coach and academy profiles,</li>
          <li>allow academies to post job listings,</li>
          <li>allow coaches to apply for jobs,</li>
          <li>improve platform functionality and security.</li>
        </ul>

        <h2>3. Data storage</h2>
        <p>
          User data may be stored using secure third-party services such as
          Firebase, including authentication, database and file storage services.
        </p>

        <h2>4. Sharing of information</h2>
        <p>
          We do not sell your personal data. Some profile information may be
          visible to other users depending on your account type and platform
          settings.
        </p>

        <h2>5. Uploaded content</h2>
        <p>
          If you upload images, videos or profile materials, you confirm that
          you have the right to use and share that content.
        </p>

        <h2>6. Your rights</h2>
        <p>
          You may request access, correction or deletion of your personal data
          by contacting us.
        </p>

        <h2>7. Security</h2>
        <p>
          We take reasonable steps to protect your data, but no online platform
          can guarantee complete security.
        </p>

        <h2>8. Contact</h2>
        <p>
          For privacy-related questions, please contact us through the Contact
          page.
        </p>
      </div>
    </main>
  );
}