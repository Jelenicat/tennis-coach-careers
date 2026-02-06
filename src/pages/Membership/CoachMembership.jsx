import "./membership.css";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function CoachMembership() {
  const navigate = useNavigate();

  function handlePay() {
    // ZA SAD SAMO PLACEHOLDER
    alert("Stripe checkout coming next ✨");
  }

  return (
    <div className="membershipPage">
      <div className="membershipCard">
        <h1>Coach Membership</h1>

        <p className="membershipSubtitle">
          Unlock full access to Tennis Coach Careers
        </p>

        <div className="membershipBox">
          <h2>€99 / year</h2>

          <ul>
            <li>✔ Apply for coaching jobs</li>
            <li>✔ View salary ranges</li>
            <li>✔ Get visibility to academies</li>
            <li>✔ Professional coach profile</li>
          </ul>
        </div>

        <Button className="primaryBtn full" onClick={handlePay}>
          Pay €99
        </Button>

        <button
          className="secondaryLink"
          onClick={() => navigate("/")}
        >
          I’ll do this later
        </button>

        <p className="membershipNote">
          Membership will be activated immediately after payment.
        </p>
      </div>
    </div>
  );
}
