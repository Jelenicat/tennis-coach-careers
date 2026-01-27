import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import "../Register/auth.css";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function AcademyRegister() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    contactName: "",
    email: "",
    password: "",
    phone: "",
    organisationName: "",
    address: "",
    city: "",
    region: "",
     membership: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    if (!form.membership) {
  alert("Please select a membership plan.");
  setLoading(false);
  return;
}

    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Create Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const uid = userCredential.user.uid;
// 🔹 USERS COLLECTION (za login & routing)
await setDoc(doc(db, "users", uid), {
  role: "academy",
  profileId: uid,
  email: form.email,
   membership: form.membership,        // ⬅️
  membershipStatus: "inactive",
  createdAt: serverTimestamp(),
});

      // 2️⃣ Save academy profile
      await setDoc(doc(db, "academies", uid), {
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        organisationName: form.organisationName,
        address: form.address,
        city: form.city,
        region: form.region,
        role: "academy",
         membership: form.membership,        // ⬅️
  membershipStatus: "inactive",
        createdAt: serverTimestamp(),
      });

      console.log("ACADEMY REGISTERED:", uid);

      // 3️⃣ Redirect to dashboard
      navigate(`/academy/${uid}`);

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <img
          src="/images/logo.png"
          alt="Tennis Coach Careers"
          className="authLogo"
        />

        <h2 style={{ textAlign: "center", marginBottom: 6 }}>
          Academy / Club Registration
        </h2>

        <p className="authSubtitle">
          Create your organisation profile
        </p>

        <form onSubmit={handleSubmit}>
          {/* CONTACT */}
          <div className="formSection">
            <h3>Contact Information</h3>

            <input
              type="text"
              name="contactName"
              placeholder="Contact name *"
              value={form.contactName}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password *"
              value={form.password}
              onChange={handleChange}
              required
            />

            <input
              type="tel"
              name="phone"
              placeholder="Contact number *"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* ORGANISATION */}
          <div className="formSection">
            <h3>Organisation</h3>

            <input
              type="text"
              name="organisationName"
              placeholder="Organisation name *"
              value={form.organisationName}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="address"
              placeholder="Address *"
              value={form.address}
              onChange={handleChange}
              required
            />

            <div className="twoCols">
              <input
                type="text"
                name="city"
                placeholder="City *"
                value={form.city}
                onChange={handleChange}
                required
              />

              <select
                name="region"
                value={form.region}
                onChange={handleChange}
                required
              >
                <option value="">Choose region *</option>
                <option value="Europe">Europe</option>
                <option value="North America">North America</option>
                <option value="South America">South America</option>
                <option value="Asia">Asia</option>
                <option value="Africa">Africa</option>
                <option value="Australia">Australia</option>
              </select>
            </div>
          </div>
{/* ================= MEMBERSHIP ================= */}
<div className="formSection">
  <h3>Membership Plan</h3>
  <p className="formHint">
    Choose a membership plan to activate job posting features.
  </p>

  <div className="membershipSelect">
    <label className={`membershipOption ${form.membership === "academy_basic" ? "active" : ""}`}>
      <input
        type="radio"
        name="membership"
        value="academy_basic"
        checked={form.membership === "academy_basic"}
        onChange={handleChange}
        required
      />

      <div>
        <strong>Academy Membership</strong>
        <span>€199 / year</span>
        <p>Post jobs, access coach profiles and contact coaches directly</p>
      </div>
    </label>
  </div>
</div>

          <Button className="primaryBtn full" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Academy Profile"}
          </Button>
        </form>

        <div className="authFooter">
          You will be able to post multiple job listings after registration
        </div>
      </div>
    </div>
  );
}
