import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import "../Register/auth.css";

// 🔥 Firebase
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      // 2️⃣ Učitaj user podatke iz Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User profile not found.");
      }

      const userData = userSnap.data();

      // 3️⃣ Redirect na osnovu role
      if (userData.role === "coach") {
        navigate(`/coach/${userData.profileId}`);
        return;
      }

      if (userData.role === "academy") {
        navigate(`/academy/${userData.profileId}`);
        return;
      }

      throw new Error("Unknown user role.");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Log in</h1>
        <p className="authSubtitle">
          Welcome back to Tennis Coach Careers
        </p>

        <form onSubmit={handleSubmit} className="authForm">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error && <div className="authError">{error}</div>}

          <div className="loginBtnWrap">
  <Button type="submit" disabled={loading}>
    {loading ? "Logging in..." : "Log in"}
  </Button>
</div>

        </form>

        <div className="authFooter">
          <span>Don’t have an account?</span>
          <button
            className="linkBtn"
            onClick={() => navigate("/choose-role")}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
