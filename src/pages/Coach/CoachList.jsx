import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../Academy/academyProfile.css";

export default function CoachList({ onClose }) {
  const navigate = useNavigate();

  const [coaches, setCoaches] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  /* ================= AUTH ================= */
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  /* ================= FETCH COACHES ================= */
  useEffect(() => {
    async function fetchCoaches() {
      const snap = await getDocs(collection(db, "coaches"));
      setCoaches(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    }
    fetchCoaches();
  }, []);

  /* ================= SEARCH ================= */
  const filteredCoaches = coaches.filter((coach) =>
    (coach.fullName || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function getDisplayName(fullName) {
    if (!fullName) return "Coach";
    if (user) return fullName;

    const parts = fullName.split(" ");
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
  }

  /* ================= RENDER ================= */
  return (
    <div className="coachOverlay" onClick={onClose}>
      <div
        className="coachListCard"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="coachListHeader">
          <h3>Available Coaches</h3>
          <button className="secondaryBtn" onClick={onClose}>
            Close
          </button>
        </div>

        {/* SEARCH */}
        <div className="coachSearchWrap">
          <input
            className="coachSearch"
            placeholder="Search by coach name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* LIST */}
        {filteredCoaches.length === 0 && (
          <p className="coachEmpty">No coaches found</p>
        )}

        {filteredCoaches.map((coach) => (
          <div key={coach.id} className="coachRow">
            <div className="coachInfoLeft">
              <img
                src={coach.profileImage || "/images/avatar-placeholder.png"}
                className="coachAvatarSmall"
                alt=""
              />

              <div>
                <div className="coachName">
                  {getDisplayName(coach.fullName)}
                </div>
                <div className="coachLocation">
                  {coach.region || coach.city || "—"}
                </div>
              </div>
            </div>

            <button
              className="secondaryBtn"
              onClick={() => {
                if (!user) {
                  setShowAuthPrompt(true);
                } else {
                  navigate(`/coach/${coach.id}`);
                }
              }}
            >
              View Profile
            </button>
          </div>
        ))}

        {/* AUTH MODAL */}
        {showAuthPrompt && (
          <div
            className="authOverlay"
            onClick={() => setShowAuthPrompt(false)}
          >
            <div
              className="authModal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Login required</h3>
              <p>You must log in to view coach profiles.</p>

              <div className="authActions">
                <button
                  className="primaryBtn"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </button>
                <button
                  className="secondaryBtn"
                  onClick={() => navigate("/choose-role")}
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
