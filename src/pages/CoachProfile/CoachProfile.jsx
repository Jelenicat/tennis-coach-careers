import "./CoachProfile.css";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import {useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function CoachProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [coach, setCoach] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
const [newProfileImage, setNewProfileImage] = useState(null);
const [newGalleryImages, setNewGalleryImages] = useState([]);
const [authUser, setAuthUser] = useState(undefined);
const [userRole, setUserRole] = useState(null);

useEffect(() => {
  const auth = getAuth();
  const unsub = onAuthStateChanged(auth, (u) => {
    setAuthUser(u ?? null);
  });
  return () => unsub();
}, []);






// ✅ samo vlasnik profila vidi dugmad
const isOwner =
  userRole === "coach" &&
  authUser &&
  authUser.uid === id;



  useEffect(() => {
    async function fetchCoach() {
      const snap = await getDoc(doc(db, "coaches", id));
      if (snap.exists()) {
        setCoach(snap.data());
        setFormData(snap.data());
      }
    }
    fetchCoach();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

 async function handleSave() {
  const storage = getStorage();
  let updatedData = { ...formData };

  // 🟡 Ako briše sliku
  if (formData.profileImage === "" && coach.profileImage) {
    const oldRef = ref(storage, `coachProfiles/${id}/profile`);

    await deleteObject(oldRef);
    updatedData.profileImage = "";
  }

  // 🟢 Ako uploaduje novu sliku
  if (newProfileImage) {
    const imgRef = ref(storage, `coachProfiles/${id}/profile`);
    await uploadBytes(imgRef, newProfileImage);
    const url = await getDownloadURL(imgRef);
    updatedData.profileImage = url;
  }
// 🟢 Upload novih gallery slika
if (newGalleryImages.length > 0) {
  // 🟢 EXISTING gallery images (after deletions)
const existingGallery = formData.galleryImages || [];

// 🟢 NEW images upload
const uploadedNewImages = [];

for (let i = 0; i < newGalleryImages.length; i++) {
  const img = newGalleryImages[i];
  const imgRef = ref(
    storage,
    `coachProfiles/${id}/gallery_${Date.now()}_${i}`
  );

  await uploadBytes(imgRef, img);
  const url = await getDownloadURL(imgRef);
  uploadedNewImages.push(url);
}

// 🟢 FINAL gallery = old + new
updatedData.galleryImages = [
  ...existingGallery,
  ...uploadedNewImages,
];

}

  await updateDoc(doc(db, "coaches", id), updatedData);
  setCoach(updatedData);
  setFormData(updatedData);
  setEditMode(false);
  setNewProfileImage(null);
  setNewGalleryImages([]);

}


function handleCancel() {
  setFormData(coach);
  setNewProfileImage(null);
  setNewGalleryImages([]);
  setEditMode(false);
}



async function removeGalleryImage(imgUrl) {
  const storage = getStorage();

  // obriši iz storage-a
  const imgRef = ref(storage, imgUrl);
  await deleteObject(imgRef);

  // ukloni iz state-a
 const updatedImages = (formData.galleryImages || []).filter(
  (img) => img !== imgUrl
);


  setFormData((prev) => ({
    ...prev,
    galleryImages: updatedImages,
  }));
}

  function getYoutubeThumbnail(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/);
    return match
      ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
      : null;
  }
function removeNewGalleryImage(index) {
  setNewGalleryImages(prev =>
    prev.filter((_, i) => i !== index)
  );
}
const existingCount = formData?.galleryImages?.length || 0;
const remainingSlots = 3 - existingCount;
useEffect(() => {
  if (!isOwner && editMode) setEditMode(false);
}, [isOwner, editMode]);
useEffect(() => {
  if (!authUser) return;

  async function fetchUserRole() {
    const snap = await getDoc(doc(db, "users", authUser.uid));
    if (snap.exists()) {
      setUserRole(snap.data().role); // "coach" | "academy"
    }
  }

  fetchUserRole();
}, [authUser]);
// ⏳ čekamo auth + role
if (authUser === undefined || userRole === null) return null;

// ❌ nije ulogovan
if (authUser === null) {
  navigate("/login", { replace: true });
  return null;
}

if (!coach) return null;
  return (
    <div
      className="coachProfilePage"
      style={{ backgroundImage: "url(/images/tennis-bg.webp)" }}
    >
      {/* ================= HERO ================= */}
      <div className="coachHero">
        <div className="coachHeroContent">
          <div className="coachInfoRow">
            {/* PROFILE IMAGE */}

<div className="coachAvatarWrap">
  <img
    src={
      newProfileImage
        ? URL.createObjectURL(newProfileImage)
        : coach.profileImage || "/images/avatar-placeholder.png"
    }
    alt={coach.fullName}
    className="coachAvatar"
  />

  {editMode && (
    <div className="avatarActions">
      <label className="uploadBtn">
        Change photo
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => setNewProfileImage(e.target.files[0])}
        />
      </label>

      {formData.profileImage && (
        <button
          className="removeBtn"
          onClick={() =>
            setFormData((prev) => ({ ...prev, profileImage: "" }))
          }
        >
          Remove
        </button>
      )}
    </div>
  )}
</div>


            {/* INFO */}
            <div className="coachInfo">
              {editMode ? (
                <>
  <input
    className="inputHero"
    name="fullName"
    value={formData.fullName}
    onChange={handleChange}
  />

  <div className="heroRow">
    <input
      className="inputHero small"
      name="nationality"
      value={formData.nationality}
      onChange={handleChange}
      placeholder="Nationality"
    />
    <input
      className="inputHero small"
      name="residence"
      value={formData.residence}
      onChange={handleChange}
      placeholder="Residence"
    />
    <input
      className="inputHero small"
      name="age"
      value={formData.age}
      onChange={handleChange}
      placeholder="Age"
    />
  </div>

  <input
    className="inputHero small"
    name="region"
    value={formData.region || ""}
    onChange={handleChange}
    placeholder="Region"
  />
</>

              ) : (
                <>
                  <h1>{coach.fullName}</h1>

<p>
  {coach.nationality} • {coach.residence} • {coach.age} years
</p>

<p className="regionLine">
  <strong>Region:</strong> {coach.region || "—"}
</p>

                </>
              )}

              {/* PRIMARY CTA */}
         {!editMode && isOwner && (
  <button className="primaryBtn" onClick={() => navigate("/jobs")}>
    View Available Jobs
  </button>
)}


              {/* EDIT CONTROLS */}
         {isOwner && (
  !editMode ? (
    <button
      className="secondaryBtn editBtn"
      onClick={() => setEditMode(true)}
    >
      Edit Profile
    </button>
  ) : (
    <div className="editActions">
      <button className="primaryBtn" onClick={handleSave}>
        Save
      </button>
      <button className="secondaryBtn" onClick={handleCancel}>
        Cancel
      </button>
    </div>
  )
)}

            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="coachContent">
        {/* LEFT COLUMN */}
        <div className="leftColumn">
          <div className="card">
            <h3>Profile Information</h3>
            {editMode ? (
              <textarea
                className="textarea"
                name="about"
                value={formData.about || ""}
                onChange={handleChange}
              />
            ) : (
              <p className="muted">{coach.about}</p>
            )}
          </div>

          {/* EXPERIENCE = GALLERY IMAGES */}
          <div className="card">
            <h3>Coaching Experience</h3>
        <div className="experienceGrid">
  {(editMode ? formData.galleryImages : coach.galleryImages)?.map(
    (img, i) => (
      <div
        key={i}
        className="experienceItem"
        style={{ backgroundImage: `url(${img})` }}
      >
        {editMode && (
          <button
            className="removeExperienceBtn"
            onClick={() => removeGalleryImage(img)}
          >
            ✕
          </button>
        )}
      </div>
    )
  )}
{editMode &&
  newGalleryImages.map((img, i) => (
    <div
      key={`new-${i}`}
      className="experienceItem"
      style={{ backgroundImage: `url(${URL.createObjectURL(img)})` }}
    >
      <button
        className="removeExperienceBtn"
        onClick={() => removeNewGalleryImage(i)}
      >
        ✕
      </button>
    </div>
  ))}


</div>

{editMode && remainingSlots > 0 && (

  <label className="uploadExperienceBtn">
    Add experience photos
    <input
      type="file"
      accept="image/*"
      multiple
      hidden
    onChange={(e) =>
  setNewGalleryImages(prev => {
    const incoming = Array.from(e.target.files);
    const combined = [...prev, ...incoming];

    return combined.slice(0, remainingSlots);
  })
}

    />
  </label>
)}


          </div>

          <div className="card membershipCard">
            <h3>Membership</h3>
            <p>Pro Membership</p>
            <button>Extend Membership</button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="rightColumn">
          <div className="card">
            <h4>Certifications</h4>
            {editMode ? (
              <textarea
                className="textarea"
                name="certifications"
                value={formData.certifications || ""}
                onChange={handleChange}
                placeholder="Comma separated"
              />
            ) : (
              <ul>
                {coach.certifications
                  ?.split(",")
                  .map((c, i) => (
                    <li key={i}>{c.trim()}</li>
                  ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h4>Video Links</h4>
            {editMode ? (
              <>
                <input
                  className="input"
                  name="playingVideo"
                  value={formData.playingVideo || ""}
                  onChange={handleChange}
                  placeholder="Playing video URL"
                />
                <input
                  className="input"
                  name="coachingVideo"
                  value={formData.coachingVideo || ""}
                  onChange={handleChange}
                  placeholder="Coaching video URL"
                />
              </>
            ) : (
              <div className="videoGrid">
                {coach.playingVideo && (
                  <a
                    href={coach.playingVideo}
                    target="_blank"
                    rel="noreferrer"
                    className="videoItem videoThumb"
                    style={{
                      backgroundImage: `url(${getYoutubeThumbnail(
                        coach.playingVideo
                      )})`,
                    }}
                  />
                )}

                {coach.coachingVideo && (
                  <a
                    href={coach.coachingVideo}
                    target="_blank"
                    rel="noreferrer"
                    className="videoItem videoThumb"
                    style={{
                      backgroundImage: `url(${getYoutubeThumbnail(
                        coach.coachingVideo
                      )})`,
                    }}
                  />
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h4>Recommendation</h4>
            {editMode ? (
              <>
                <input
                  className="input"
                  name="recommenderName"
                  value={formData.recommenderName || ""}
                  onChange={handleChange}
                  placeholder="Recommender name"
                />
                <textarea
                  className="textarea"
                  name="recommendationText"
                  value={formData.recommendationText || ""}
                  onChange={handleChange}
                  placeholder="Recommendation text"
                />
              </>
            ) : (
              <p className="muted">
                <strong>{coach.recommenderName}</strong>
                <br />
                {coach.recommendationText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
