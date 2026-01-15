import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function CoachList({ onClose }) {
  const [coaches, setCoaches] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCoaches() {
      const snap = await getDocs(collection(db, "coaches"));

      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCoaches(list);
    }

    fetchCoaches();
  }, []);

  const filteredCoaches = coaches.filter((coach) =>
    `${coach.firstName} ${coach.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3>Available Coaches</h3>
        <button className="secondaryBtn" onClick={onClose}>
          Close
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name or surname"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredCoaches.length === 0 && (
        <p className="muted">No coaches found</p>
      )}

      {filteredCoaches.map((coach) => (
        <div key={coach.id} className="coachRow">
          <div>
            <strong>
              {coach.firstName} {coach.lastName}
            </strong>
            <div className="muted">
              {coach.city} • {coach.region}
            </div>
          </div>

          <button className="secondaryBtn">
            View Profile
          </button>
        </div>
      ))}
    </div>
  );
}
