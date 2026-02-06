import { useMembership } from "../hooks/useMembership";
import { useNavigate } from "react-router-dom";

export default function RequireMembership({ children }) {
  const { loading, membershipActive } = useMembership();
  const navigate = useNavigate();

  if (loading) {
    return <p style={{ color: "#fff" }}>Checking membership...</p>;
  }

  if (!membershipActive) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#fff" }}>
        <h2>Membership required</h2>
        <p>
          You need an active Coach Membership to access this feature.
        </p>

        <button
          className="primaryBtn"
          onClick={() => navigate("/coach-membership")}
        >
          Activate membership
        </button>
      </div>
    );
  }

  return children;
}


