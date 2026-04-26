import "./CoachProfile.css";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

export default function CoachProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [coach, setCoach] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);

  const [newProfileImage, setNewProfileImage] = useState(null);
  const [newGalleryImages, setNewGalleryImages] = useState([]);
  const [authUser, setAuthUser] = useState(undefined);
  const [deletedGalleryImages, setDeletedGalleryImages] = useState([]);

  const GALLERY_MAX = 2;

  const isOwner = authUser?.uid === id && authUser?.role === "coach";

  useEffect(() => {
    if (!showLogoutModal) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowLogoutModal(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showLogoutModal]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        navigate("/login", { replace: true });
        return;
      }

      const role = snap.data().role;

      if (role !== "academy" && role !== "coach") {
        navigate("/login", { replace: true });
        return;
      }

      setAuthUser({ ...user, role });
      setCheckingAuth(false);
    });

    return () => unsub();
  }, [auth, navigate]);

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

  useEffect(() => {
    if (!isOwner && editMode) setEditMode(false);
  }, [isOwner, editMode]);

  async function handleLogout() {
    await signOut(auth);
    navigate("/", { replace: true });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function formatProfileDate(value) {
    if (!value) return "Not set";

    const date = value?.toDate
      ? value.toDate()
      : value?.seconds
      ? new Date(value.seconds * 1000)
      : new Date(value);

    if (Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function isProfileActive(value) {
    if (!value) return false;

    const date = value?.toDate
      ? value.toDate()
      : value?.seconds
      ? new Date(value.seconds * 1000)
      : new Date(value);

    if (Number.isNaN(date.getTime())) return false;

    return date > new Date();
  }

  async function requestExtension() {
    try {
      await updateDoc(doc(db, "coaches", id), {
        extensionRequested: true,
        extensionRequestedAt: serverTimestamp(),
      });

      setCoach((prev) => ({
        ...prev,
        extensionRequested: true,
      }));

      setFormData((prev) => ({
        ...prev,
        extensionRequested: true,
      }));

      alert("Extension request sent.");
    } catch (err) {
      console.error(err);
      alert("Failed to send extension request.");
    }
  }

  async function handleSave() {
    const storage = getStorage();
    let updatedData = { ...formData };

    if (formData.profileImage === "" && coach.profileImage) {
      const oldRef = ref(storage, `coachProfiles/${id}/profile`);
      await deleteObject(oldRef);
      updatedData.profileImage = "";
    }

    if (newProfileImage) {
      const imgRef = ref(storage, `coachProfiles/${id}/profile`);
      await uploadBytes(imgRef, newProfileImage);
      const url = await getDownloadURL(imgRef);
      updatedData.profileImage = url;
    }

    if (newGalleryImages.length > 0) {
      const existingGallery = formData.galleryImages || [];
      const uploadedNewImages = [];

      for (let i = 0; i < newGalleryImages.length; i++) {
        const img = newGalleryImages[i];
        const imgRef = ref(storage, `coachProfiles/${id}/gallery_${Date.now()}_${i}`);

        await uploadBytes(imgRef, img);
        const url = await getDownloadURL(imgRef);
        uploadedNewImages.push(url);
      }

      updatedData.galleryImages = [...existingGallery, ...uploadedNewImages];
    }

    await updateDoc(doc(db, "coaches", id), updatedData);

    if (deletedGalleryImages.length > 0) {
      try {
        await Promise.all(
          deletedGalleryImages.map((imgUrl) => deleteObject(ref(storage, imgUrl)))
        );
      } catch (deleteError) {
        console.error("Gallery cleanup error:", deleteError);
      }
    }

    setCoach(updatedData);
    setFormData(updatedData);
    setEditMode(false);
    setNewProfileImage(null);
    setNewGalleryImages([]);
    setDeletedGalleryImages([]);
  }

  function handleCancel() {
    setFormData(coach);
    setNewProfileImage(null);
    setNewGalleryImages([]);
    setDeletedGalleryImages([]);
    setEditMode(false);
  }

  function removeGalleryImage(imgUrl) {
    const updatedImages = (formData.galleryImages || []).filter(
      (img) => img !== imgUrl
    );

    setFormData((prev) => ({
      ...prev,
      galleryImages: updatedImages,
    }));

    setDeletedGalleryImages((prev) => [...prev, imgUrl]);
  }

  function removeNewGalleryImage(index) {
    setNewGalleryImages((prev) => prev.filter((_, i) => i !== index));
  }

  function getYoutubeThumbnail(url) {
    if (!url) return null;

    const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/);

    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  }

  const existingCount = formData?.galleryImages?.length || 0;
  const newCount = newGalleryImages.length;
  const remainingSlots = GALLERY_MAX - existingCount - newCount;

  if (checkingAuth) {
    return (
      <div className="loader">
        <p>Checking access...</p>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="loader">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div
      className="coachProfilePage"
      style={{ backgroundImage: "url(/images/tennis-bg.webp)" }}
    >
      <div className="coachHero">
        <div className="coachHeroContent">
          <div className="coachInfoRow">
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

            <div className="coachInfo">
              {editMode ? (
                <>
                  <input
                    className="inputHero"
                    name="fullName"
                    value={formData.fullName || ""}
                    onChange={handleChange}
                  />

                  <div className="heroRow">
                    <input
                      className="inputHero small"
                      name="nationality"
                      value={formData.nationality || ""}
                      onChange={handleChange}
                      placeholder="Nationality"
                    />
                    <input
                      className="inputHero small"
                      name="residence"
                      value={formData.residence || ""}
                      onChange={handleChange}
                      placeholder="Residence"
                    />
                    <input
                      className="inputHero small"
                      name="age"
                      value={formData.age || ""}
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
                    {coach.nationality} - {coach.residence} - {coach.age} years
                  </p>

                  <p className="regionLine">
                    <strong>Region:</strong> {coach.region || "-"}
                  </p>
                </>
              )}

              {isOwner && !editMode && (
                <div className="heroActions">
                  <button className="primaryBtn" onClick={() => navigate("/jobs")}>
                    View Available Jobs
                  </button>

                  <button
                    className="secondaryBtn editBtn"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </button>

                  <button
                    className="logoutBtn"
                    onClick={() => setShowLogoutModal(true)}
                  >
                    Log out
                  </button>
                </div>
              )}

              {isOwner && editMode && (
                <div className="editActions">
                  <button className="primaryBtn" onClick={handleSave}>
                    Save
                  </button>
                  <button className="secondaryBtn" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="coachContent">
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
                        x
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
                      x
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
                  onChange={(e) => {
                    setNewGalleryImages((prev) => {
                      const incoming = Array.from(e.target.files);
                      const allowed = incoming.slice(0, remainingSlots);
                      return [...prev, ...allowed];
                    });
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          <div className="card membershipCard">
            <h3>Profile validity</h3>

            <p>
              <strong>Valid until:</strong> {formatProfileDate(coach.expiresAt)}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {isProfileActive(coach.expiresAt) ? "Active" : "Expired"}
            </p>

            {isOwner && (
              <button
                className="primaryBtn"
                onClick={requestExtension}
                disabled={coach.extensionRequested}
              >
                {coach.extensionRequested
                  ? "Extension requested"
                  : "Request extension"}
              </button>
            )}
          </div>
        </div>

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
                  .map((c, i) => <li key={i}>{c.trim()}</li>)}
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

      {showLogoutModal && (
        <div className="modalOverlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logoutModal" onClick={(e) => e.stopPropagation()}>
            <h3>Sign out?</h3>
            <p>You will be signed out of your account.</p>

            <div className="logoutActions">
              <button
                className="secondaryBtn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>

              <button className="dangerBtn" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}