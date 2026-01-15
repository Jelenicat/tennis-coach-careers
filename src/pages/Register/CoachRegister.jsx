import { useState } from "react";
import "./auth.css";
import Button from "../../components/ui/Button";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


/* ================= DATA ================= */


const countries = [
  "Serbia",
  "Croatia",
  "Bosnia and Herzegovina",
  "Montenegro",
  "Slovenia",
  "North Macedonia",
  "Italy",
  "Spain",
  "France",
  "Germany",
  "Austria",
  "Switzerland",
  "United Kingdom",
  "Ireland",
  "Netherlands",
  "Belgium",
  "Portugal",
  "Greece",
  "Turkey",
  "United States",
  "Canada",
  "Mexico",
  "Brazil",
  "Argentina",
  "Chile",
  "Australia",
  "New Zealand",
  "Japan",
  "China",
  "South Korea",
  "India",
  "South Africa",
  "Egypt",
  "Morocco",
];

const regions = [
  "Europe",
  "North America",
  "South America",
  "Asia",
  "Africa",
  "Australia & Oceania",
];

const phoneCodes = [
  { code: "+381", label: "🇷🇸 Serbia" },
  { code: "+385", label: "🇭🇷 Croatia" },
  { code: "+387", label: "🇧🇦 Bosnia and Herzegovina" },
  { code: "+382", label: "🇲🇪 Montenegro" },
  { code: "+386", label: "🇸🇮 Slovenia" },
  { code: "+39", label: "🇮🇹 Italy" },
  { code: "+34", label: "🇪🇸 Spain" },
  { code: "+33", label: "🇫🇷 France" },
  { code: "+49", label: "🇩🇪 Germany" },
  { code: "+44", label: "🇬🇧 United Kingdom" },
  { code: "+1", label: "🇺🇸 USA / 🇨🇦 Canada" },
  { code: "+61", label: "🇦🇺 Australia" },
  { code: "+81", label: "🇯🇵 Japan" },
  { code: "+86", label: "🇨🇳 China" },
  { code: "+91", label: "🇮🇳 India" },
];

/* ================= COMPONENT ================= */

export default function CoachRegister() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdUid, setCreatedUid] = useState(null);

  const [profilePreview, setProfilePreview] = useState(null);
  const [galleryPreview, setGalleryPreview] = useState([]);

  const [form, setForm] = useState({
    fullName: "",
    age: "",
    nationality: "",
    residence: "",
    phoneCode: "+381",
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
    profileImage: null,
    galleryImages: [],
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

 async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  try {
    // 1️⃣ Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      form.email,
      form.password
    );

    const uid = userCredential.user.uid;
    // 🔹 USERS COLLECTION (za login & routing)
await setDoc(doc(db, "users", uid), {
  role: "coach",
  profileId: uid,
  email: form.email,
  createdAt: new Date(),
});

const storage = getStorage();

// 🔹 PROFILE IMAGE
let profileImageUrl = "";

if (form.profileImage) {
  const profileRef = ref(storage, `coachProfiles/${uid}/profile`);
  await uploadBytes(profileRef, form.profileImage);
  profileImageUrl = await getDownloadURL(profileRef);
}

// 🔹 GALLERY IMAGES
const galleryUrls = [];

for (let i = 0; i < form.galleryImages.length; i++) {
  const imgRef = ref(storage, `coachProfiles/${uid}/gallery_${i}`);
  await uploadBytes(imgRef, form.galleryImages[i]);
  const url = await getDownloadURL(imgRef);
  galleryUrls.push(url);
}

    // 2️⃣ Firestore – coach profile
    await setDoc(doc(db, "coaches", uid), {
      fullName: form.fullName,
      age: form.age,
      nationality: form.nationality,
      residence: form.residence,
      phone: `${form.phoneCode}${form.phone}`,
      email: form.email,
      about: form.about,
      certifications: form.certifications,
      playingVideo: form.playingVideo,
      coachingVideo: form.coachingVideo,
      region: form.region,
      recommenderName: form.recommenderName,
      recommendationText: form.recommendationText,
      role: "coach",
        galleryImages: galleryUrls,   // ✅
  profileImage: profileImageUrl,// ✅
      createdAt: new Date(),
    });

 setCreatedUid(uid);
setSuccess(true);


    console.log("REGISTERED COACH:", uid);
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

        <h2 style={{ textAlign: "center", marginBottom: 4 }}>
          Create Coach Profile
        </h2>

        <p className="authSubtitle">
          Create your professional tennis coaching profile
        </p>

        <form onSubmit={handleSubmit}>
          {/* ================= PERSONAL INFO ================= */}
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

            <div className="twoCols">
              <select
                name="phoneCode"
                value={form.phoneCode}
                onChange={handleChange}
              >
                {phoneCodes.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label} ({p.code})
                  </option>
                ))}
              </select>

              <input
                type="tel"
                placeholder="Phone number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
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
    <img src={profilePreview} className="coachAvatar" />
  )}

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0];
      if (!file) return;

      setForm((prev) => ({ ...prev, profileImage: file }));
      setProfilePreview(URL.createObjectURL(file));
    }}
  />
</label>


          {/* ================= PROFILE INFO ================= */}
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
   <label className="fileLabel">
  Gallery Images (max 2)

  <div className="galleryPreview">
    {galleryPreview.map((src, i) => (
      <img key={i} src={src} className="galleryThumb" />
    ))}
  </div>

  <input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => {
      const files = Array.from(e.target.files).slice(0, 2);

      setForm((prev) => ({ ...prev, galleryImages: files }));
      setGalleryPreview(files.map((f) => URL.createObjectURL(f)));
    }}
  />
</label>



          </div>

          {/* ================= REGION ================= */}
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

          {/* ================= RECOMMENDATION ================= */}
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

         <Button className="primaryBtn full" type="submit" disabled={loading}>
  {loading ? "Creating..." : "Create Profile"}
</Button>

        </form>
{success && (
  <div className="successOverlay">
    <div className="successModal">
      <div className="successIcon">🎾</div>
      <h3>Profile created!</h3>
      <p>Your coach profile has been successfully created.</p>

     <Button
  className="primaryBtn full"
  onClick={() => navigate(`/coach/${createdUid}`)}
>
  View My Profile
</Button>

    </div>
  </div>
)}

        <div className="authFooter">
          Already have an account? <b>Log in</b>
        </div>
      </div>
    </div>
  );
}
