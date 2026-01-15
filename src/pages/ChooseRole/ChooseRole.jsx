import { useNavigate } from "react-router-dom";
import "../Register/auth.css";
import Button from "../../components/ui/Button";

export default function ChooseRole() {
  const navigate = useNavigate();

  return (
    <div className="authPage">
      <div className="authCard chooseRoleCard">
        <img
          src="/images/logo.png"
          alt="Tennis Coach Careers"
          className="authLogo"
        />

        <h2 className="chooseRoleTitle">
          Join Tennis Coach Careers
        </h2>

        <p className="authSubtitle">
          Tell us how you want to use the platform
        </p>

        {/* WRAPPER ZA DUGMAD */}
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
  );
}
