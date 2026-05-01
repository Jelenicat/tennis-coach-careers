import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../Academy/academyProfile.css";
import { createPortal } from "react-dom";

export default function CoachList({ onClose }) {
  const navigate = useNavigate();

  const [coaches, setCoaches] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  /* ================= AUTH ================= */
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  /* ================= FETCH COACHES ================= */
  useEffect(() => {
    async function fetchCoaches() {
      const q = query(
        collection(db, "coaches"),
        where("approvalStatus", "==", "approved"),
        where("profileVisible", "==", true),
        where("expiresAt", ">", Timestamp.now())
      );

      const snap = await getDocs(q);

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
    (coach.fullName || "").toLowerCase().includes(search.toLowerCase())
  );

  function getDisplayName(fullName) {
    if (!fullName) return "Coach";
    if (user) return fullName;

    const parts = fullName.trim().split(" ").filter(Boolean);

    if (parts.length === 0) return "Coach";
    if (parts.length === 1) return parts[0];

    return `${parts[0]} ${parts[1][0]}.`;
  }

  /* ================= RENDER ================= */
  return (
    <div
      className="coachOverlay"
      onClick={() => {
        if (showAuthPrompt) return;
        onClose?.();
      }}
    >
      <div className="coachListCard" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="coachListHeader">
          <h3>Available Coaches</h3>

          <button className="secondaryBtn" type="button" onClick={onClose}>
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
                alt={coach.fullName || "Coach"}
              />

              <div>
                <div className="coachName">{getDisplayName(coach.fullName)}</div>

                <div className="coachLocation">
                  {coach.region || coach.city || "—"}
                </div>
              </div>
            </div>

            <button
              className="secondaryBtn"
              type="button"
              onClick={() => {
                if (!user) {
                  setShowAuthPrompt(true);
                  return;
                }

                navigate(`/coach/${coach.id}`);
              }}
            >
              View Profile
            </button>
          </div>
        ))}

        {/* AUTH MODAL */}
        {showAuthPrompt &&
          createPortal(
            <div className="authOverlay authOverlayFull">
              <div
                className="authModal authModalFull"
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Login required</h3>

                <p>You must log in to view coach profiles.</p>

                <div className="authActions">
                  <button
                    className="primaryBtn"
                    type="button"
                    onClick={() => {
                      setShowAuthPrompt(false);
                      onClose?.();
                      navigate("/login");
                    }}
                  >
                    Log in
                  </button>

                  <button
                    className="secondaryBtn"
                    type="button"
                    onClick={() => {
                      setShowAuthPrompt(false);
                      onClose?.();
                      navigate("/choose-role");
                    }}
                  >
                    Sign up
                  </button>
                </div>

                <button
                  className="authClose"
                  type="button"
                  onClick={() => setShowAuthPrompt(false)}
                >
                  ✕
                </button>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}