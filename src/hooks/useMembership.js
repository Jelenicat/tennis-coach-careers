import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export function useMembership() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [membershipActive, setMembershipActive] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setMembershipActive(false);
        setLoading(false);
        return;
      }

      setUser(u);

      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        setMembershipActive(!!snap.data().membershipActive);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { loading, user, membershipActive };
}
