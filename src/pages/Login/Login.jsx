import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import "../Register/auth.css";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import SEO from "../../components/SEO";
export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [alertModal, setAlertModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "error",
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function showAlert(title, message, type = "error") {
    setAlertModal({
      show: true,
      title,
      message,
      type,
    });
  }

  function closeAlert() {
    setAlertModal({
      show: false,
      title: "",
      message: "",
      type: "error",
    });
  }

  function getFriendlyLoginError(error) {
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      return {
        title: "Login failed",
        message: "Invalid email or password. Please check your details and try again.",
      };
    }

    if (error.code === "auth/invalid-email") {
      return {
        title: "Invalid email",
        message: "Please enter a valid email address.",
      };
    }

    if (error.message === "User profile not found.") {
      return {
        title: "Profile not found",
        message:
          "Your account exists, but the profile data could not be found. Please contact support.",
      };
    }

    if (error.message === "Unknown user role.") {
      return {
        title: "Unknown account type",
        message:
          "Your account type could not be recognized. Please contact support.",
      };
    }

    return {
      title: "Login failed",
      message: "Something went wrong. Please try again.",
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User profile not found.");
      }

      const userData = userSnap.data();

      if (userData.role === "admin") {
        navigate("/admin");
        return;
      }

      if (userData.role === "coach") {
        navigate(`/coach/${user.uid}`);
        return;
      }

      if (userData.role === "academy") {
        const academyId = userData.academyId || userData.profileId || user.uid;

        navigate(`/academy/${academyId}`);
        return;
      }

      throw new Error("Unknown user role.");
    } catch (error) {
      console.error(error);

      const friendlyError = getFriendlyLoginError(error);
      showAlert(friendlyError.title, friendlyError.message);
    } finally {
      setLoading(false);
    }
  }

return (
  <>
    <SEO
      title="Login"
      description="Login to your Tennis Coach Careers account."
      noindex
    />

    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">Log in</h1>

        <p className="authSubtitle">Welcome back to Tennis Coach Careers</p>

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
            type="button"
            onClick={() => navigate("/choose-role")}
          >
            Sign up
          </button>
        </div>

        {alertModal.show && (
          <div className="authAlertOverlay" onClick={closeAlert}>
            <div
              className="authAlertModal"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`authAlertIcon ${
                  alertModal.type === "success" ? "success" : "error"
                }`}
              >
                {alertModal.type === "success" ? "✓" : "!"}
              </div>

              <h3>{alertModal.title}</h3>
              <p>{alertModal.message}</p>

              <button
                className="primaryBtn full"
                type="button"
                onClick={closeAlert}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
       </div>
  </>
);
}