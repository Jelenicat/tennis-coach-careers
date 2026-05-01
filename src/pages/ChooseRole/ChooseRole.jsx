import { useNavigate } from "react-router-dom";
import "../Register/auth.css";
import Button from "../../components/ui/Button";
import SEO from "../../components/SEO";

export default function ChooseRole() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Join as a Coach or Academy"
        description="Join Tennis Coach Careers as a tennis coach or tennis academy and connect with tennis opportunities worldwide."
        url="https://tennis-coach-careers.com/choose-role"
      />

      <div className="authPage">
        <div className="authCard chooseRoleCard">
          <img
            src="/images/logo.png"
            alt="Tennis Coach Careers"
            className="authLogo"
          />

          <h2 className="chooseRoleTitle">Join Tennis Coach Careers</h2>

          <p className="authSubtitle">
            Tell us how you want to use the platform
          </p>

          <div className="roleButtons">
            <Button
              className="primaryBtn full"
              onClick={() => navigate("/register/coach")}
            >
              I am a Tennis Coach
            </Button>

            <Button
              variant="outline"
              className="secondaryBtn"
              onClick={() => navigate("/register/academy")}
            >
              I represent a Club / Academy
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}