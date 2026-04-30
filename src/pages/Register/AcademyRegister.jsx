import { useState } from "react";
import Button from "../../components/ui/Button";
import "../Register/auth.css";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import "react-phone-number-input/style.css";
import PhoneInput, {
  isValidPhoneNumber,
  getCountryCallingCode,
} from "react-phone-number-input";

const EMAIL_API_URL =
  "https://email-api-vert-beta.vercel.app/api/send-registration-request";

const academyMembershipPlans = [
  {
    id: "access",
    name: "Access",
    price: "Free",
    description: "Paying per job post, with discounts for 3 or 5 posts.",
  },
  {
    id: "member",
    name: "Member",
    price: "300€ / year",
    description:
      "Unlimited job posts, access to database, communication support and Instagram promotion.",
  },
];

export default function AcademyRegister() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [country, setCountry] = useState("RS");
  const callingCode = country ? `+${getCountryCallingCode(country)}` : "";

  const [form, setForm] = useState({
    contactName: "",
    email: "",
    password: "",
    phone: "",
    organisationName: "",
    address: "",
    city: "",
    region: "",
    membershipPlan: "",
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

    if (!form.membershipPlan) {
      alert("Please choose a membership plan.");
      return;
    }

    if (!form.acceptedTerms) {
      alert("Please accept Terms of Use and Privacy Policy.");
      return;
    }

    const selectedPlan = academyMembershipPlans.find(
      (plan) => plan.id === form.membershipPlan
    );

    const membershipData = {
      id: selectedPlan?.id || form.membershipPlan,
      name: selectedPlan?.name || "",
      price: selectedPlan?.price || "",
      description: selectedPlan?.description || "",
    };

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

        organisationName: form.organisationName,
        contactName: form.contactName,

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

        membershipPlan: form.membershipPlan,
        membership: membershipData,
        membershipStatus: "pending",

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

        membershipPlan: form.membershipPlan,
        membership: membershipData,
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

          <h2 style={{ textAlign: "center" }}>Request sent successfully</h2>

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

        <p className="authSubtitle">Create your organisation profile</p>

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
                <span className="phonePrefix">{callingCode}</span>

                <PhoneInput
                  defaultCountry="RS"
                  country={country}
                  placeholder="Phone number *"
                  value={form.phone}
                  onCountryChange={(value) => {
                    if (value) setCountry(value);
                  }}
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
                <option value="Africa">Africa</option>
                <option value="South America">South America</option>
                <option value="Australia & Oceania">
                  Australia & Oceania
                </option>
              </select>
            </div>
          </div>

          <div className="formSection">
            <h3>Membership Plan</h3>

            <div className="membershipSelect">
              {academyMembershipPlans.map((plan) => (
                <label
                  key={plan.id}
                  className={`membershipOption ${
                    form.membershipPlan === plan.id ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="membershipPlan"
                    value={plan.id}
                    checked={form.membershipPlan === plan.id}
                    onChange={handleChange}
                    required
                  />

                  <div>
                    <strong>{plan.name}</strong>
                    <span>{plan.price}</span>
                    <p>{plan.description}</p>
                  </div>
                </label>
              ))}
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
              I agree to{" "}
              <a href="/terms" target="_blank" rel="noreferrer">
                Terms
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
            </span>
          </label>

          <Button className="primaryBtn full" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Create Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}