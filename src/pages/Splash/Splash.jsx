import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./splash.css";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate("/home", { replace: true });
    }, 1600); // trajanje splasha (ms)

    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="splash">
      <img
        src="/images/logo.png"
        alt="Tennis Coach Careers"
        className="splashLogo"
      />
      <div className="splashGlow" />
    </div>
  );
}
