import { useState } from "react";
import Button from "../../components/ui/Button";
import "../Register/auth.css";

import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import "react-phone-number-input/style.css";
import PhoneInput, {
  isValidPhoneNumber,
  getCountryCallingCode,
} from "react-phone-number-input";
import { Link } from "react-router-dom";
import SEO from "../../components/SEO";
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
const [alertModal, setAlertModal] = useState({
  show: false,
  title: "",
  message: "",
  type: "error",
});
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

function getFriendlyAuthError(error) {
  if (error.code === "auth/email-already-in-use") {
    return {
      title: "Email already exists",
      message:
        "This email address is already registered. Please use another email or log in to your existing account.",
    };
  }

  if (error.code === "auth/invalid-email") {
    return {
      title: "Invalid email",
      message: "Please enter a valid email address.",
    };
  }

  if (error.code === "auth/weak-password") {
    return {
      title: "Password is too weak",
      message: "Password should be at least 6 characters long.",
    };
  }

  return {
    title: "Something went wrong",
    message: "Your request could not be sent. Please try again.",
  };
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
      showAlert("Invalid phone number", "Please enter a valid phone number.");
      return;
    }

    if (!form.membershipPlan) {
     showAlert("Membership required", "Please choose a membership plan.");
      return;
    }

    if (!form.acceptedTerms) {
     showAlert(
  "Terms required",
  "Please accept Terms of Use and Privacy Policy before continuing."
);
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

let createdUser = null;

try {
  const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const uid = userCredential.user.uid;
createdUser = userCredential.user;
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
  if (createdUser?.uid) {
    try {
      await deleteDoc(doc(db, "users", createdUser.uid));
      await deleteDoc(doc(db, "academies", createdUser.uid));
      await deleteUser(createdUser);
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
  }

  console.error(error);

  const friendlyError = getFriendlyAuthError(error);
  showAlert(friendlyError.title, friendlyError.message);
} finally {
  setLoading(false);
}
  }

 if (success) {
  return (
    <>
      <SEO
        title="Academy Registration Submitted"
        description="Your Tennis Coach Careers academy registration request has been submitted."
        noindex
      />

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
    </>
  );
}

return (
  <>
    <SEO
      title="Register Your Tennis Academy"
      description="Register your tennis academy or club on Tennis Coach Careers, publish tennis coaching jobs and connect with qualified tennis coaches worldwide."
      url="https://tennis-coach-careers.com/register/academy"
    />

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
        <div className="authFooter">
  Already have an account?{" "}
  <Link to="/login" className="authFooterLink">
    Log in
  </Link>
</div>
{alertModal.show && (
  <div className="authAlertOverlay" onClick={closeAlert}>
    <div className="authAlertModal" onClick={(e) => e.stopPropagation()}>
      <div
        className={`authAlertIcon ${
          alertModal.type === "success" ? "success" : "error"
        }`}
      >
        {alertModal.type === "success" ? "✓" : "!"}
      </div>

      <h3>{alertModal.title}</h3>
      <p>{alertModal.message}</p>

      <button className="primaryBtn full" type="button" onClick={closeAlert}>
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