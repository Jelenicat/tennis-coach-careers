import { useState } from "react";
import Button from "../../components/ui/Button";
import "../Register/auth.css";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import "react-phone-number-input/style.css";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

const EMAIL_API_URL =
  "https://email-api-vert-beta.vercel.app/api/send-registration-request";

export default function AcademyRegister() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    contactName: "",
    email: "",
    password: "",
    phone: "",
    organisationName: "",
    address: "",
    city: "",
    region: "",
    acceptedTerms: false,
  });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function sendAdminEmail(payload) {
    await fetch(EMAIL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
if (!form.phone || !isValidPhoneNumber(form.phone)) {
  alert("Please enter a valid phone number.");
  return;
}
    if (!form.acceptedTerms) {
      alert("Please accept Terms of Use and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        role: "academy",
        profileId: uid,
        email: form.email,

        approvalStatus: "pending",
        profileVisible: false,

        approvedAt: null,
        expiresAt: null,

        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "academies", uid), {
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        organisationName: form.organisationName,
        address: form.address,
        city: form.city,
        region: form.region,

        role: "academy",

        approvalStatus: "pending",
        profileVisible: false,

        approvedAt: null,
        expiresAt: null,

        createdAt: serverTimestamp(),
      });

      await sendAdminEmail({
        type: "academy",
        uid,
        email: form.email,
        contactName: form.contactName,
        organisationName: form.organisationName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        region: form.region,
      });

      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="authPage">
        <div className="authCard">
          <img
            src="/images/logo.png"
            alt="Tennis Coach Careers"
            className="authLogo"
          />

          <h2 style={{ textAlign: "center" }}>
            Request sent successfully
          </h2>

          <p className="pendingNotice">
            Your profile is under review. We will contact you soon.
          </p>
        </div>
      </div>
    );
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
          <div className="formSection">
            <h3>Contact Information</h3>

            <input
              name="contactName"
              placeholder="Contact name *"
              value={form.contactName}
              onChange={handleChange}
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email *"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Password *"
              value={form.password}
              onChange={handleChange}
              required
            />

  <div className="phoneInputWrap">
  <div className="phoneField">
    <span className="phonePrefix">+381</span>

    <PhoneInput
      defaultCountry="RS"
      placeholder="Phone number *"
      value={form.phone}
      onChange={(value) =>
        setForm((prev) => ({
          ...prev,
          phone: value || "",
        }))
      }
    />
  </div>
</div>
          </div>

          <div className="formSection">
            <h3>Organisation</h3>

            <input
              name="organisationName"
              placeholder="Organisation name *"
              value={form.organisationName}
              onChange={handleChange}
              required
            />

            <input
              name="address"
              placeholder="Address *"
              value={form.address}
              onChange={handleChange}
              required
            />

            <div className="twoCols">
              <input
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
                <option value="Asia">Asia</option>
              </select>
            </div>
          </div>

          <label className="termsCheck">
            <input
              type="checkbox"
              name="acceptedTerms"
              checked={form.acceptedTerms}
              onChange={handleChange}
              required
            />
            <span>
              I agree to <a href="/terms" target="_blank">Terms</a> and{" "}
              <a href="/privacy" target="_blank">Privacy Policy</a>
            </span>
          </label>

          <Button className="primaryBtn full" disabled={loading}>
            {loading ? "Sending..." : "Create Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}