import { useEffect, useRef, useState } from "react";
import "./auth.css";
import "react-phone-number-input/style.css";

import Button from "../../components/ui/Button";
import PhoneInput, {
  isValidPhoneNumber,
  getCountryCallingCode,
} from "react-phone-number-input";

import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from "firebase/auth";

import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";

import { auth, db } from "../../firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";
import SEO from "../../components/SEO";
const EMAIL_API_URL =
  "https://email-api-vert-beta.vercel.app/api/send-registration-request";

const GALLERY_MAX = 2;

const coachMembershipPlans = [
{
  id: "standard",
  name: "Standard",
  price: "Free",
  description:
    "Public profile and 2 job applications per month.",
},
  {
    id: "premium",
    name: "Premium",
    price: "130€ / year",
    description:
      "Unlimited job applications, professional CV creation, video portfolio advice and negotiation guide.",
  },
  {
    id: "diamond",
    name: "Diamond",
    price: "220€ / year",
    description:
      "Full package with CV creation, video portfolio creation, negotiation guide and Instagram promotion.",
  },
];

const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const regions = [
  "Europe",
  "North America",
  "South America",
  "Asia",
  "Africa",
  "Australia & Oceania",
];

export default function CoachRegister() {
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

  const [profilePreview, setProfilePreview] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);

  const profilePreviewRef = useRef(null);
  const galleryItemsRef = useRef([]);

  const [form, setForm] = useState({
    fullName: "",
    age: "",
    nationality: "",
    residence: "",
    phone: "",
    email: "",
    password: "",
    about: "",
    certifications: "",
    playingVideo: "",
    coachingVideo: "",
    region: "",
    recommenderName: "",
    recommendationText: "",
    membershipPlan: "",
    profileImage: null,
    acceptedTerms: false,
  });

  useEffect(() => {
    return () => {
      if (profilePreviewRef.current) {
        URL.revokeObjectURL(profilePreviewRef.current);
      }

      galleryItemsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.preview);
      });
    };
  }, []);
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
  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function removeGalleryAt(id) {
    setGalleryItems((prev) => {
      const removed = prev.find((item) => item.id === id);
      const next = prev.filter((item) => item.id !== id);

      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }

      galleryItemsRef.current = next;
      return next;
    });
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

    if (!form.email || !form.password) {
      showAlert("Missing information", "Email and password are required.");
      return;
    }

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

    const selectedPlan = coachMembershipPlans.find(
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

      createdUser = userCredential.user;
      const uid = createdUser.uid;

      await setDoc(doc(db, "users", uid), {
        role: "coach",
        profileId: uid,
        email: form.email,
        approvalStatus: "pending",
        profileVisible: false,
        approvedAt: null,
        expiresAt: null,
        createdAt: serverTimestamp(),
      });

      const storage = getStorage();

      let profileImageUrl = "";

      if (form.profileImage) {
        const profileRef = ref(storage, `coachProfiles/${uid}/profile`);
        await uploadBytes(profileRef, form.profileImage);
        profileImageUrl = await getDownloadURL(profileRef);
      }

      const galleryUrls = [];

      for (let i = 0; i < galleryItems.length; i++) {
        const imgRef = ref(storage, `coachProfiles/${uid}/gallery_${i}`);
        await uploadBytes(imgRef, galleryItems[i].file);
        const url = await getDownloadURL(imgRef);
        galleryUrls.push(url);
      }

      await setDoc(doc(db, "coaches", uid), {
        fullName: form.fullName,
        age: form.age,
        nationality: form.nationality,
        residence: form.residence,
        phone: form.phone,
        email: form.email,
        about: form.about,
        certifications: form.certifications,
        playingVideo: form.playingVideo,
        coachingVideo: form.coachingVideo,
        region: form.region,
        recommenderName: form.recommenderName,
        recommendationText: form.recommendationText,

        membershipPlan: form.membershipPlan,
        membership: membershipData,
        membershipStatus: "pending",

        role: "coach",
        userId: uid,
        galleryImages: galleryUrls,
        profileImage: profileImageUrl,

        approvalStatus: "pending",
        profileVisible: false,
        approvedAt: null,
        expiresAt: null,
        createdAt: serverTimestamp(),
      });

      await sendAdminEmail({
        type: "coach",
        uid,
        email: form.email,
        fullName: form.fullName,
        age: form.age,
        phone: form.phone,
        nationality: form.nationality,
        residence: form.residence,
        region: form.region,
        certifications: form.certifications,

        membershipPlan: form.membershipPlan,
        membership: membershipData,
      });

      await signOut(auth);
      setSuccess(true);
    } catch (error) {
  if (createdUser?.uid) {
    try {
      await deleteDoc(doc(db, "users", createdUser.uid));
      await deleteDoc(doc(db, "coaches", createdUser.uid));
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
        title="Coach Registration Submitted"
        description="Your Tennis Coach Careers coach registration request has been submitted."
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
            Your coach profile is under review. We will contact you soon.
          </p>
        </div>
         </div>
    </>
  );
}

return (
  <>
    <SEO
      title="Create a Tennis Coach Profile"
      description="Create your professional tennis coach profile, showcase your coaching experience and connect with academies looking for tennis coaches worldwide."
      url="https://tennis-coach-careers.com/register/coach"
    />

    <div className="authPage">
      <div className="authCard">
        <img
          src="/images/logo.png"
          alt="Tennis Coach Careers"
          className="authLogo"
        />

        <h2 style={{ textAlign: "center", marginBottom: 4 }}>
          Create Coach Profile
        </h2>

        <p className="authSubtitle">
          Create your professional tennis coaching profile
        </p>

        <form onSubmit={handleSubmit}>
          <div className="formSection">
            <h3>Personal Information</h3>

            <input
              type="text"
              placeholder="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              placeholder="Age"
              name="age"
              value={form.age}
              onChange={handleChange}
              required
            />

            <div className="twoCols">
              <input
                list="countries"
                type="text"
                placeholder="Nationality"
                name="nationality"
                value={form.nationality}
                onChange={handleChange}
              />

              <input
                type="text"
                placeholder="Current Residence"
                name="residence"
                value={form.residence}
                onChange={handleChange}
              />
            </div>

            <datalist id="countries">
              {countries.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <div className="phoneInputWrap">
              <div className="phoneField">
                <span className="phonePrefix">{callingCode}</span>

                <PhoneInput
                  defaultCountry="RS"
                  country={country}
                  placeholder="Phone number"
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

            <input
              type="email"
              placeholder="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              placeholder="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <label className="fileLabel">
            Profile Photo
            {profilePreview && (
              <img src={profilePreview} className="coachAvatar" alt="Preview" />
            )}
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              if (profilePreview) {
                URL.revokeObjectURL(profilePreview);
              }

              const previewUrl = URL.createObjectURL(file);

              setForm((prev) => ({
                ...prev,
                profileImage: file,
              }));

              setProfilePreview(previewUrl);
              profilePreviewRef.current = previewUrl;

              e.target.value = "";
            }}
          />

          <div className="formSection">
            <h3>Profile Information</h3>

            <textarea
              rows={4}
              placeholder="Tell us about your coaching philosophy, experience and goals"
              name="about"
              value={form.about}
              onChange={handleChange}
            />

            <input
              type="text"
              placeholder="Certifications"
              name="certifications"
              value={form.certifications}
              onChange={handleChange}
            />

            <div className="twoCols">
              <input
                type="url"
                placeholder="Playing Video URL"
                name="playingVideo"
                value={form.playingVideo}
                onChange={handleChange}
              />

              <input
                type="url"
                placeholder="Coaching Video URL"
                name="coachingVideo"
                value={form.coachingVideo}
                onChange={handleChange}
              />
            </div>

            <div className="fileLabel">
              Gallery Images (max {GALLERY_MAX})

              <div className="galleryPreview">
                {galleryItems.map((item) => (
                  <div key={item.id} className="galleryItem">
                    <img
                      src={item.preview}
                      className="galleryThumb"
                      alt="Gallery preview"
                    />

                    <button
                      type="button"
                      className="removeGalleryBtn"
                      onClick={() => removeGalleryAt(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const incoming = Array.from(e.target.files);
                const remaining = GALLERY_MAX - galleryItems.length;

                if (remaining <= 0) return;

                const accepted = incoming.slice(0, remaining);

                const newItems = accepted.map((file) => ({
                  id: uuidv4(),
                  file,
                  preview: URL.createObjectURL(file),
                }));

                const next = [...galleryItems, ...newItems];

                setGalleryItems(next);
                galleryItemsRef.current = next;

                e.target.value = "";
              }}
            />
          </div>

          <div className="formSection">
            <h3>Region</h3>

            <input
              list="regions"
              type="text"
              placeholder="Choose region"
              name="region"
              value={form.region}
              onChange={handleChange}
            />

            <datalist id="regions">
              {regions.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          <div className="formSection">
            <h3>Letter of Recommendation</h3>

            <input
              type="text"
              placeholder="Recommender Name"
              name="recommenderName"
              value={form.recommenderName}
              onChange={handleChange}
            />

            <textarea
              rows={3}
              placeholder="Recommendation text"
              name="recommendationText"
              value={form.recommendationText}
              onChange={handleChange}
            />
          </div>

          <div className="formSection">
            <h3>Membership Plan</h3>

            <div className="membershipSelect">
              {coachMembershipPlans.map((plan) => (
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
            {loading ? "Sending request..." : "Create Profile"}
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