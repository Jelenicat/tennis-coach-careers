import { useEffect, useRef, useState } from "react";
import "./auth.css";
import Button from "../../components/ui/Button";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";


/* ================= DATA ================= */

const GALLERY_MAX = 2;


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
  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/login"); // ili "/" ili "/choose-role"
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdUid, setCreatedUid] = useState(null);

  const [profilePreview, setProfilePreview] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const profilePreviewRef = useRef(null);
  const galleryItemsRef = useRef([]);

  useEffect(() => {
    return () => {
      if (profilePreviewRef.current) {
        URL.revokeObjectURL(profilePreviewRef.current);
      }
      galleryItemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);
useEffect(() => {
  if (success && createdUid) {
    navigate("/coach-membership");
  }
}, [success, createdUid, navigate]);


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
});

  function removeGalleryAt(id) {
    setGalleryItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);

      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }

      galleryItemsRef.current = next;
      return next;
    });
  }

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

    let createdUser = null;

    try {
      // 1) Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
if (!form.email || !form.password) {
  alert("Email and password are required");
  return;
}

      createdUser = userCredential.user;
      const uid = createdUser.uid;
      // USERS COLLECTION (login & routing)
   await setDoc(doc(db, "users", uid), {
  role: "coach",
  profileId: uid,
  email: form.email,

  membershipPlan: "coach",
  membershipActive: false,
  membershipStartedAt: null,

  createdAt: serverTimestamp(),
});


      const storage = getStorage();

      // PROFILE IMAGE
      let profileImageUrl = "";

      if (form.profileImage) {
        const profileRef = ref(storage, `coachProfiles/${uid}/profile`);
        await uploadBytes(profileRef, form.profileImage);
        profileImageUrl = await getDownloadURL(profileRef);
      }

      // GALLERY IMAGES
      const galleryUrls = [];

      for (let i = 0; i < galleryItems.length; i++) {
        const imgRef = ref(storage, `coachProfiles/${uid}/gallery_${i}`);
        await uploadBytes(imgRef, galleryItems[i].file);
        const url = await getDownloadURL(imgRef);
        galleryUrls.push(url);
      }

      // Firestore - coach profile
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
        galleryImages: galleryUrls,
        profileImage: profileImageUrl,
       membershipPlan: "coach",
membershipActive: false,
membershipStartedAt: null,

        createdAt: serverTimestamp(),
        userId: uid,
      });

      setCreatedUid(uid);
      setSuccess(true);

      console.log("REGISTERED COACH:", uid);
    } catch (error) {
      if (createdUser?.uid) {
        try {
          await deleteDoc(doc(db, "users", createdUser.uid));
          await deleteUser(createdUser);
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
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

          {/* ================= PROFILE PHOTO ================= */}
          <label className="fileLabel">
            Profile Photo
            {profilePreview && (
              <img src={profilePreview} className="coachAvatar" />
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

              setForm((prev) => ({
                ...prev,
                profileImage: file,
              }));

              setProfilePreview(URL.createObjectURL(file));
              e.target.value = "";
            }}
          />

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

            {/* ================= GALLERY (FIXED) ================= */}
            <div className="fileLabel">
              Gallery Images (max {GALLERY_MAX})

              <div className="galleryPreview">
                {galleryItems.map((item) => (
                  <div key={item.id} className="galleryItem">
                    <img src={item.preview} className="galleryThumb" />
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

         {/* ================= MEMBERSHIP ================= */}
<div className="formSection">
  <h3>Membership Plan</h3>

  <div className="membershipSelect">
    <div className="membershipOption active">
      <strong>Coach Membership</strong>
      <span>€99 / year</span>
      <p>
        Apply for jobs, view salary ranges, get visibility to academies
      </p>
    </div>
  </div>

  <small style={{ opacity: 0.7 }}>
    Membership will be activated after payment
  </small>
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

     <Button
  className="primaryBtn full"
  type="submit"
  disabled={loading}
>
  {loading ? "Creating..." : "Create Profile"}
</Button>

        </form>

        <div className="authFooter">
          Already have an account? <b>Log in</b>
        </div>
      </div>
    </div>
  );

}
