import { useEffect, useMemo, useState } from "react";
import "./AdminPanel.css";

import {
  collection,
  collectionGroup,
  getDocs,
  getDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { auth, db, storage } from "../../firebase";
import SEO from "../../components/SEO";
const ADMIN_EMAIL = "tenniscoachcareers@protonmail.com";
const COACH_MEMBERSHIP_PLANS = [
  { id: "standard", name: "Standard", price: "50€ / year" },
  { id: "premium", name: "Premium", price: "130€ / year" },
  { id: "diamond", name: "Diamond", price: "220€ / year" },
];
const ACADEMY_MEMBERSHIP_PLANS = [
  { id: "access", name: "Access", price: "Free" },
  { id: "member", name: "Member", price: "300€ / year" },
];
export default function AdminPanel() {
  const [coaches, setCoaches] = useState([]);
  const [academies, setAcademies] = useState([]);
  const [activeCoaches, setActiveCoaches] = useState([]);
  const [activeAcademies, setActiveAcademies] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [jobPostRequests, setJobPostRequests] = useState([]);
  const [publishedJobs, setPublishedJobs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeTab, setActiveTab] = useState("requests");
  const [requestFilter, setRequestFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [showBlogForm, setShowBlogForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedProfileType, setSelectedProfileType] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "",
    danger: false,
    onConfirm: null,
  });

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const [blogFile, setBlogFile] = useState(null);
  const [uploadingBlog, setUploadingBlog] = useState(false);

  const [blogForm, setBlogForm] = useState({
    title: "",
    excerpt: "",
    content: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(user?.email === ADMIN_EMAIL);
      setCheckingAdmin(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
      fetchActiveProfiles();
      fetchBlogPosts();
      fetchJobPostRequests();
      fetchPublishedJobs();
    }
  }, [isAdmin]);

  const pendingCount = coaches.length + academies.length;
  const activeProfilesCount = activeCoaches.length + activeAcademies.length;
  const jobPostRequestsCount = jobPostRequests.length;
  const publishedJobsCount = publishedJobs.length;

  const expiringSoonProfiles = useMemo(() => {
    return [
      ...activeCoaches.map((profile) => ({ ...profile, type: "coach" })),
      ...activeAcademies.map((profile) => ({ ...profile, type: "academy" })),
    ].filter((profile) => {
      const days = getDaysUntilExpiry(profile.expiresAt);
      return days !== null && days >= 0 && days <= 30;
    });
  }, [activeCoaches, activeAcademies]);

  const extensionRequests = useMemo(() => {
    return [
      ...activeCoaches.map((profile) => ({ ...profile, type: "coach" })),
      ...activeAcademies.map((profile) => ({ ...profile, type: "academy" })),
    ].filter((profile) => profile.extensionRequested === true);
  }, [activeCoaches, activeAcademies]);

  const upgradeRequests = useMemo(() => {
    return [
      ...activeCoaches.map((profile) => ({ ...profile, type: "coach" })),
      ...activeAcademies.map((profile) => ({ ...profile, type: "academy" })),
    ].filter((profile) => profile.upgradeRequested === true);
  }, [activeCoaches, activeAcademies]);

  const filteredActiveCoaches = useMemo(() => {
    if (profileFilter === "academies") return [];

    if (profileFilter === "expiring") {
      return activeCoaches.filter((coach) => {
        const days = getDaysUntilExpiry(coach.expiresAt);
        return days !== null && days >= 0 && days <= 30;
      });
    }

    if (profileFilter === "extensionRequests") {
      return activeCoaches.filter((coach) => coach.extensionRequested === true);
    }

    if (profileFilter === "upgradeRequests") {
      return activeCoaches.filter((coach) => coach.upgradeRequested === true);
    }

    return activeCoaches;
  }, [activeCoaches, profileFilter]);

  const filteredActiveAcademies = useMemo(() => {
    if (profileFilter === "coaches") return [];

    if (profileFilter === "extensionRequests") {
      return activeAcademies.filter(
        (academy) => academy.extensionRequested === true
      );
    }

    if (profileFilter === "upgradeRequests") {
      return activeAcademies.filter(
        (academy) => academy.upgradeRequested === true
      );
    }

    if (profileFilter === "expiring") {
      return activeAcademies.filter((academy) => {
        const days = getDaysUntilExpiry(academy.expiresAt);
        return days !== null && days >= 0 && days <= 30;
      });
    }

    return activeAcademies;
  }, [activeAcademies, profileFilter]);

  const searchedCoaches = useMemo(() => {
    return coaches.filter(matchesSearch);
  }, [coaches, searchTerm]);

  const searchedAcademies = useMemo(() => {
    return academies.filter(matchesSearch);
  }, [academies, searchTerm]);

  const searchedActiveCoaches = useMemo(() => {
    return filteredActiveCoaches.filter(matchesSearch);
  }, [filteredActiveCoaches, searchTerm]);

  const searchedActiveAcademies = useMemo(() => {
    return filteredActiveAcademies.filter(matchesSearch);
  }, [filteredActiveAcademies, searchTerm]);

  const searchedPublishedJobs = useMemo(() => {
    return publishedJobs.filter(matchesJobSearch);
  }, [publishedJobs, searchTerm]);

  function openProfileModal(type, profile) {
    setSelectedProfileType(type);
    setSelectedProfile(profile);
  }

  function closeProfileModal() {
    setSelectedProfile(null);
    setSelectedProfileType(null);
  }

  function openConfirm({
    title,
    message,
    confirmText,
    danger = false,
    onConfirm,
  }) {
    setConfirmModal({
      open: true,
      title,
      message,
      confirmText,
      danger,
      onConfirm,
    });
  }

  function closeConfirm() {
    setConfirmModal({
      open: false,
      title: "",
      message: "",
      confirmText: "",
      danger: false,
      onConfirm: null,
    });
  }

  function showToast(message, type = "success") {
    setToast({
      open: true,
      type,
      message,
    });

    window.setTimeout(() => {
      setToast((current) =>
        current.message === message ? { ...current, open: false } : current
      );
    }, 2800);
  }

  async function runConfirmAction() {
    if (!confirmModal.onConfirm) return;
    await confirmModal.onConfirm();
    closeConfirm();
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase().trim();
  }

  function matchesSearch(profile) {
    const term = normalizeText(searchTerm);
    if (!term) return true;

    const searchableText = [
      profile.fullName,
      profile.organisationName,
      profile.contactName,
      profile.email,
      profile.phone,
      profile.city,
      profile.region,
      profile.nationality,
      profile.residence,
      profile.address,
      profile.membershipPlan,
      profile.membership?.name,
      profile.membership?.id,
      profile.requestedExtensionPlan,
      profile.requestedExtensionMembership?.name,
      profile.requestedExtensionMembership?.id,
      profile.requestedUpgradeTo,
    ]
      .map(normalizeText)
      .join(" ");

    return searchableText.includes(term);
  }

  function matchesJobSearch(job) {
    const term = normalizeText(searchTerm);
    if (!term) return true;

    const searchableText = [
      job.title,
      job.academyName,
      job.academyEmail,
      job.country,
      job.city,
      job.address,
      job.status,
      job.description,
      job.benefits,
      job.date,
    ]
      .map(normalizeText)
      .join(" ");

    return searchableText.includes(term);
  }

  function getOneYearFromNow() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }

  function getDateObject(value) {
    if (!value) return null;
    return value.toDate ? value.toDate() : new Date(value);
  }

  function formatDate(timestamp) {
    const date = getDateObject(timestamp);
    if (!date || Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getJobTime(job) {
    const value = job.date || job.createdAt;

    if (!value) return 0;

    if (value?.toDate) {
      return value.toDate().getTime();
    }

    if (value?.seconds) {
      return value.seconds * 1000;
    }

    if (typeof value === "string") {
      const clean = value.trim().replace(/\.$/, "");

      const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

      if (isoMatch) {
        const year = Number(isoMatch[1]);
        const month = Number(isoMatch[2]);
        const day = Number(isoMatch[3]);

        return new Date(year, month - 1, day).getTime();
      }

      const dotMatch = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

      if (dotMatch) {
        const day = Number(dotMatch[1]);
        const month = Number(dotMatch[2]);
        const year = Number(dotMatch[3]);

        return new Date(year, month - 1, day).getTime();
      }

      const parsed = new Date(clean).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }

  function getDaysUntilExpiry(expiresAt) {
    const expiryDate = getDateObject(expiresAt);
    if (!expiryDate || Number.isNaN(expiryDate.getTime())) return null;

    return Math.ceil(
      (expiryDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  function getProfileStatus(expiresAt) {
    const diffDays = getDaysUntilExpiry(expiresAt);

    if (diffDays === null) return "No expiration date";
    if (diffDays < 0) return "Expired";
    if (diffDays <= 30) return `Expires soon (${diffDays} days left)`;

    return `Active (${diffDays} days left)`;
  }

  function getStatusClass(expiresAt) {
    const diffDays = getDaysUntilExpiry(expiresAt);

    if (diffDays === null) return "statusNeutral";
    if (diffDays < 0) return "statusExpired";
    if (diffDays <= 30) return "statusSoon";

    return "statusActive";
  }

  function getMembershipName(profile) {
    return (
      profile.membership?.name ||
      profile.membershipPlan ||
      profile.membership?.id ||
      "Not set"
    );
  }

  function getMembershipPlanId(profile) {
    return (
      profile.membershipPlan ||
      profile.membership?.id ||
      profile.membership?.name ||
      "unknown"
    );
  }
function getMembershipPlansByType(type) {
  return type === "coach" ? COACH_MEMBERSHIP_PLANS : ACADEMY_MEMBERSHIP_PLANS;
}

function getMembershipPlanById(type, planId) {
  return getMembershipPlansByType(type).find((plan) => plan.id === planId);
}
 function getRequestedUpgradeLabel(profile) {
  return (
    profile.requestedUpgradeMembership?.name ||
    profile.requestedUpgradeTo ||
    "Not set"
  );
}

  function getRequestedExtensionLabel(profile) {
    return (
      profile.requestedExtensionMembership?.name ||
      profile.requestedExtensionPlan ||
      "Requested"
    );
  }

  function getRequestedExtensionPlanId(profile) {
    return (
      profile.requestedExtensionMembership?.id ||
      profile.requestedExtensionPlan ||
      profile.membershipPlan ||
      profile.membership?.id ||
      "access"
    );
  }

  async function fetchRequests() {
    setLoading(true);

    try {
      const coachQuery = query(
        collection(db, "coaches"),
        where("approvalStatus", "==", "pending")
      );

      const academyQuery = query(
        collection(db, "academies"),
        where("approvalStatus", "==", "pending")
      );

      const [coachSnap, academySnap] = await Promise.all([
        getDocs(coachQuery),
        getDocs(academyQuery),
      ]);

      setCoaches(
        coachSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );

      setAcademies(
        academySnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    } catch (error) {
      console.error(error);
      showToast("Failed to load admin requests.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchActiveProfiles() {
    try {
      const coachQuery = query(
        collection(db, "coaches"),
        where("approvalStatus", "==", "approved")
      );

      const academyQuery = query(
        collection(db, "academies"),
        where("approvalStatus", "==", "approved")
      );

      const [coachSnap, academySnap] = await Promise.all([
        getDocs(coachQuery),
        getDocs(academyQuery),
      ]);

      setActiveCoaches(
        coachSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );

      setActiveAcademies(
        academySnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    } catch (error) {
      console.error(error);
      showToast("Failed to load active profiles.", "error");
    }
  }

  async function fetchBlogPosts() {
    setLoadingBlogs(true);

    try {
      const blogQuery = query(
        collection(db, "blogPosts"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(blogQuery);

      setBlogPosts(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    } catch (error) {
      console.error(error);
      showToast("Failed to load blog posts.", "error");
    } finally {
      setLoadingBlogs(false);
    }
  }

  async function fetchJobPostRequests() {
    try {
      const jobRequestsQuery = query(
        collection(db, "jobPostRequests"),
        where("status", "==", "pending")
      );

      const snap = await getDocs(jobRequestsQuery);

      setJobPostRequests(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    } catch (error) {
      console.error(error);
      showToast("Failed to load job post requests.", "error");
    }
  }

  async function fetchPublishedJobs() {
    try {
      const snap = await getDocs(collectionGroup(db, "jobs"));

      const jobsData = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        jobPath: docSnap.ref.path,
        ...docSnap.data(),
      }));

      jobsData.sort((a, b) => getJobTime(b) - getJobTime(a));

      setPublishedJobs(jobsData);
    } catch (error) {
      console.error(error);
      showToast("Failed to load published jobs.", "error");
    }
  }

  async function markJobAsFilled(job) {
    openConfirm({
      title: "Mark job as filled",
      message:
        "Mark this job as filled? It will stay visible on the public jobs page, but coaches will not be able to apply.",
      confirmText: "Mark as filled",
      danger: true,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, job.jobPath), {
            status: "filled",
            jobVisible: false,
            filledAt: serverTimestamp(),
          });

          await fetchPublishedJobs();

          showToast("Job marked as filled.");
        } catch (error) {
          console.error(error);
          showToast("Failed to mark job as filled.", "error");
        }
      },
    });
  }

  async function reactivateJob(job) {
    openConfirm({
      title: "Reactivate job",
      message: "Reactivate this job and show it again on the public jobs page?",
      confirmText: "Reactivate",
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, job.jobPath), {
            status: "active",
            jobVisible: true,
            filledAt: null,
            reactivatedAt: serverTimestamp(),
          });

          await fetchPublishedJobs();

          showToast("Job reactivated.");
        } catch (error) {
          console.error(error);
          showToast("Failed to reactivate job.", "error");
        }
      },
    });
  }

  async function approveJobPostRequest(request) {
  openConfirm({
    title: "Approve job post",
    message: "Approve and publish this job post?",
    confirmText: "Approve",
    onConfirm: async () => {
      try {
      const academySnap = await getDoc(doc(db, "academies", request.academyId));
const academyData = academySnap.exists() ? academySnap.data() : null;

        if (!academyData) {
          showToast("Academy profile could not be found.", "error");
          return;
        }

        const academyExpiresAt =
          academyData.expiresAt || request.academyExpiresAt || null;

        const expiryDate = academyExpiresAt?.toDate
          ? academyExpiresAt.toDate()
          : academyExpiresAt
          ? new Date(academyExpiresAt)
          : null;

        const academyIsExpired =
          !expiryDate || Number.isNaN(expiryDate.getTime())
            ? true
            : expiryDate <= new Date();

        if (
          academyData.approvalStatus !== "approved" ||
          academyData.profileVisible === false ||
          academyIsExpired
        ) {
          showToast(
            "This academy is not active. The job post cannot be published.",
            "error"
          );
          return;
        }

        await addDoc(collection(db, "academies", request.academyId, "jobs"), {
          title: request.title || "",
          minSalary: request.minSalary || "",
          maxSalary: request.maxSalary || "",
          benefits: request.benefits || "",
          description: request.description || "",
          date: request.date || "",
          country: request.country || "",
          city: request.city || "",
          address: request.address || "",
          status: "active",
          jobVisible: true,

          academyId: request.academyId,
          academyName:
            academyData.organisationName || request.academyName || "",
          academyEmail: academyData.email || request.academyEmail || "",

          academyMembershipPlan:
            academyData.membershipPlan || request.membershipPlan || "",
          academyMembership:
            academyData.membership || request.membership || null,
          academyExpiresAt,
          academyProfileVisible: academyData.profileVisible !== false,
          academyApprovalStatus: academyData.approvalStatus || "approved",

          createdAt: serverTimestamp(),
          approvedFromRequestId: request.id,
        });

        await updateDoc(doc(db, "jobPostRequests", request.id), {
          status: "approved",
          approvedAt: serverTimestamp(),
        });

        await fetchJobPostRequests();
        await fetchPublishedJobs();

        showToast("Job post approved and published.");
      } catch (error) {
        console.error(error);
        showToast("Failed to approve job post.", "error");
      }
    },
  });
}


  async function rejectJobPostRequest(requestId) {
    openConfirm({
      title: "Reject job post",
      message: "Reject this job post request?",
      confirmText: "Reject",
      danger: true,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "jobPostRequests", requestId), {
            status: "rejected",
            rejectedAt: serverTimestamp(),
          });

          await fetchJobPostRequests();

          showToast("Job post request rejected.");
        } catch (error) {
          console.error(error);
          showToast("Failed to reject job post request.", "error");
        }
      },
    });
  }

  async function approveProfile(type, profile) {
    try {
      const response = await fetch(
        `https://email-api-vert-beta.vercel.app/api/approve-user?uid=${profile.id}&type=${type}`
      );

      if (!response.ok) throw new Error("Approve failed");

      const collectionName = type === "coach" ? "coaches" : "academies";
    const fallbackMembership = type === "coach" ? "standard" : "access";

const selectedMembership =
  getMembershipPlanId(profile) === "unknown"
    ? fallbackMembership
    : getMembershipPlanId(profile);

const selectedPlan =
  getMembershipPlanById(type, selectedMembership) || {
    id: selectedMembership,
    name: selectedMembership,
    price: "",
  };

      await updateDoc(doc(db, collectionName, profile.id), {
  approvalStatus: "approved",
  profileVisible: true,
  approvedAt: serverTimestamp(),
  expiresAt: Timestamp.fromDate(getOneYearFromNow()),
  membershipPlan: selectedPlan.id,
  membership: {
    id: selectedPlan.id,
    name: selectedPlan.name,
    price: selectedPlan.price,
  },
});

      await fetchRequests();
      await fetchActiveProfiles();

      showToast("Profile approved.");
    } catch (error) {
      console.error(error);
      showToast("Failed to approve profile.", "error");
    }
  }

 async function extendProfile(type, profile) {
  const collectionName = type === "coach" ? "coaches" : "academies";

  const requestedPlanId = getRequestedExtensionPlanId(profile);
  const requestedPlanName = getRequestedExtensionLabel(profile);

const requestedPlan = getMembershipPlanById(type, requestedPlanId);

const requestedMembership =
  profile.requestedExtensionMembership || {
    id: requestedPlanId,
    name: requestedPlan?.name || requestedPlanName,
    price: requestedPlan?.price || "",
  };

  const currentPlanId = getMembershipPlanId(profile);
  const isSamePlan = currentPlanId === requestedPlanId;

  openConfirm({
   title: profile.extensionRequested
  ? "Approve extension request"
  : "Extend profile",
    message: isSamePlan
      ? `Extend this profile for another 1 year with ${requestedPlanName} membership?`
      : `Extend this profile for another 1 year. Current ${getMembershipName(
          profile
        )} membership stays active until expiry, then it will switch to ${requestedPlanName}.`,
    confirmText: "Extend",
    onConfirm: async () => {
      try {
        const oldExpiryDate =
          profile.expiresAt?.toDate && profile.expiresAt.toDate() > new Date()
            ? profile.expiresAt.toDate()
            : new Date();

        const newExpiryDate = new Date(oldExpiryDate);
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

        const updatePayload = {
          approvalStatus: "approved",
          profileVisible: true,
          expiresAt: Timestamp.fromDate(newExpiryDate),

          extensionRequested: false,
          requestedExtensionPlan: null,
          requestedExtensionMembership: null,
          extensionResolvedAt: serverTimestamp(),
        };

        if (isSamePlan) {
          updatePayload.previousMembershipPlan = currentPlanId;
          updatePayload.membershipPlan = requestedPlanId;
          updatePayload.membership = requestedMembership;

          updatePayload.nextMembershipPlan = null;
          updatePayload.nextMembership = null;
          updatePayload.nextMembershipStartsAt = null;
        } else {
          updatePayload.nextMembershipPlan = requestedPlanId;
          updatePayload.nextMembership = requestedMembership;
          updatePayload.nextMembershipStartsAt = Timestamp.fromDate(oldExpiryDate);
        }

        await updateDoc(doc(db, collectionName, profile.id), updatePayload);

        await fetchActiveProfiles();

        showToast(
          isSamePlan
            ? "Profile extended for 1 year."
            : "Profile extended. New membership will start after current one expires."
        );
      } catch (error) {
        console.error(error);
        showToast("Failed to extend profile.", "error");
      }
    },
  });
}
  async function upgradeProfileMembership(type, profile) {
    const fromPlan = getMembershipPlanId(profile);
    const toPlan = profile.requestedUpgradeTo;

if (!toPlan) {
  showToast("No upgrade plan selected.", "error");
  return;
}
const collectionName = type === "coach" ? "coaches" : "academies";

const fromPlanName = getMembershipName(profile);
const toPlanName = profile.requestedUpgradeMembership?.name || toPlan;

openConfirm({
  title: "Approve membership upgrade",
  message: `Upgrade this profile from ${fromPlanName} to ${toPlanName}?`,
      confirmText: "Upgrade",
      onConfirm: async () => {
        try {
await updateDoc(doc(db, collectionName, profile.id), {
  previousMembershipPlan: fromPlan,

  membershipPlan: toPlan,
membership: {
  id: toPlan,
  name: profile.requestedUpgradeMembership?.name || toPlanName,
  price:
    profile.requestedUpgradeMembership?.price ||
    getMembershipPlanById(type, toPlan)?.price ||
    "",
},
  nextMembershipPlan: null,
  nextMembership: null,
  nextMembershipStartsAt: null,

  upgradeRequested: false,
  requestedUpgradeTo: null,
  requestedUpgradeMembership: null,
  upgradeResolvedAt: serverTimestamp(),
});
          await fetchActiveProfiles();

          showToast("Membership upgraded.");
        } catch (error) {
          console.error(error);
          showToast("Failed to upgrade membership.", "error");
        }
      },
    });
  }
async function changeProfileMembership(type, profile, planId) {
  const selectedPlan = getMembershipPlanById(type, planId);

  if (!selectedPlan) {
    showToast("Invalid membership plan selected.", "error");
    return;
  }

  const collectionName = type === "coach" ? "coaches" : "academies";
  const currentPlan = getMembershipName(profile);

  openConfirm({
    title: "Change membership",
    message: `Change membership from ${currentPlan} to ${selectedPlan.name}?`,
    confirmText: "Change",
    onConfirm: async () => {
      try {
        await updateDoc(doc(db, collectionName, profile.id), {
          previousMembershipPlan: getMembershipPlanId(profile),

          membershipPlan: selectedPlan.id,
          membership: {
            id: selectedPlan.id,
            name: selectedPlan.name,
            price: selectedPlan.price,
          },

          // čistimo pending upgrade/extension da ne ostanu stari zahtevi
          upgradeRequested: false,
          requestedUpgradeTo: null,
          requestedUpgradeMembership: null,

          extensionRequested: false,
          requestedExtensionPlan: null,
          requestedExtensionMembership: null,

          // čistimo future membership da ne pregazi ručnu promenu kasnije
          nextMembershipPlan: null,
          nextMembership: null,
          nextMembershipStartsAt: null,

          membershipChangedManuallyAt: serverTimestamp(),
        });

        await fetchActiveProfiles();

        showToast(`Membership changed to ${selectedPlan.name}.`);
      } catch (error) {
        console.error(error);
        showToast("Failed to change membership.", "error");
      }
    },
  });
}
  async function toggleProfileVisibility(type, id, currentVisible) {
    try {
      const collectionName = type === "coach" ? "coaches" : "academies";

      await updateDoc(doc(db, collectionName, id), {
        profileVisible: !currentVisible,
      });

      await fetchActiveProfiles();

      showToast(currentVisible ? "Profile hidden." : "Profile is now visible.");
    } catch (error) {
      console.error(error);
      showToast("Failed to update profile visibility.", "error");
    }
  }

  async function rejectProfile(type, id) {
    openConfirm({
      title: "Reject profile",
      message: "Are you sure you want to reject this profile?",
      confirmText: "Reject",
      danger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(
            `https://email-api-vert-beta.vercel.app/api/reject-user?uid=${id}&type=${type}`
          );

          if (!response.ok) throw new Error("Reject failed");

          await fetchRequests();

          showToast("Profile rejected.");
        } catch (error) {
          console.error(error);
          showToast("Failed to reject profile.", "error");
        }
      },
    });
  }

  async function deleteProfile(type, id) {
    openConfirm({
      title: "Delete profile",
      message: "Are you sure you want to permanently delete this profile?",
      confirmText: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          const collectionName = type === "coach" ? "coaches" : "academies";

          await deleteDoc(doc(db, collectionName, id));

          await fetchRequests();
          await fetchActiveProfiles();

          showToast("Profile deleted.");
        } catch (error) {
          console.error(error);
          showToast("Failed to delete profile.", "error");
        }
      },
    });
  }

  async function deleteBlogPost(postId) {
    openConfirm({
      title: "Delete blog post",
      message: "Are you sure you want to delete this blog post?",
      confirmText: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "blogPosts", postId));
          setBlogPosts((prev) => prev.filter((post) => post.id !== postId));
          showToast("Blog post deleted.");
        } catch (error) {
          console.error(error);
          showToast("Failed to delete blog post.", "error");
        }
      },
    });
  }

  function handleBlogChange(e) {
    const { name, value } = e.target;

    setBlogForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleBlogFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      showToast("Please select an image or video.", "error");
      return;
    }

    setBlogFile(file);
  }

  async function uploadBlogMedia() {
    if (!blogFile) {
      return {
        mediaUrl: "",
        mediaType: "",
      };
    }

    const cleanName = blogFile.name.replace(/\s+/g, "-").toLowerCase();
    const filePath = `blog-media/${Date.now()}-${cleanName}`;
    const fileRef = ref(storage, filePath);

    await uploadBytes(fileRef, blogFile);

    const mediaUrl = await getDownloadURL(fileRef);
    const mediaType = blogFile.type.startsWith("video/") ? "video" : "image";

    return {
      mediaUrl,
      mediaType,
    };
  }

  async function createBlogPost(e) {
    e.preventDefault();

    if (!blogForm.title || !blogForm.content) {
      showToast("Title and content are required.", "error");
      return;
    }

    try {
      setUploadingBlog(true);

      const { mediaUrl, mediaType } = await uploadBlogMedia();

      await addDoc(collection(db, "blogPosts"), {
        title: blogForm.title,
        excerpt: blogForm.excerpt,
        content: blogForm.content,
        mediaUrl,
        mediaType,
        published: true,
        createdAt: serverTimestamp(),
      });

      setBlogForm({
        title: "",
        excerpt: "",
        content: "",
      });

      setBlogFile(null);
      setShowBlogForm(false);

      await fetchBlogPosts();

      showToast("Blog post created.");
    } catch (error) {
      console.error(error);
      showToast("Failed to create blog post.", "error");
    } finally {
      setUploadingBlog(false);
    }
  }

if (checkingAdmin) {
  return (
    <>
      <SEO
        title="Admin Panel"
        description="Private admin area."
        noindex
      />

      <main className="adminPage">
        <div className="adminShell">
          <div className="adminLoading">Checking admin access...</div>
        </div>
      </main>
    </>
  );
}

if (!isAdmin) {
  return (
    <>
      <SEO
        title="Admin Panel"
        description="Private admin area."
        noindex
      />

      <main className="adminPage">
        <div className="adminShell">
          <section className="adminSection">
            <h2>Access denied</h2>
            <p className="emptyText">
              You do not have permission to access this page.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
return (
  <>
    <SEO
      title="Admin Panel"
      description="Private admin area."
      noindex
    />

    <main className="adminPage">
      <div className="adminShell">
        <header className="adminHeader">
          <div>
            <h1>Admin Panel</h1>
            <p>Manage approvals, active profiles, expirations and blog posts.</p>
          </div>

          <div className="adminHeaderActions">
            <button
              className="refreshBtn"
              onClick={() => {
                fetchRequests();
                fetchActiveProfiles();
                fetchBlogPosts();
                fetchJobPostRequests();
                fetchPublishedJobs();
              }}
            >
              Refresh
            </button>

            <button
              className="refreshBtn"
              type="button"
              onClick={() => {
                setActiveTab("blog");
                setShowBlogForm((prev) => !prev);
              }}
            >
              {showBlogForm ? "Close blog form" : "Create blog post"}
            </button>
          </div>
        </header>

        <section className="adminStatsGrid">
          <button
            className={`adminStatCard ${
              activeTab === "requests" ? "activeStatCard" : ""
            }`}
            type="button"
            onClick={() => setActiveTab("requests")}
          >
            <span>Pending requests</span>
            <strong>{pendingCount}</strong>
          </button>

          <button
            className={`adminStatCard ${
              activeTab === "active" ? "activeStatCard" : ""
            }`}
            type="button"
            onClick={() => setActiveTab("active")}
          >
            <span>Active profiles</span>
            <strong>{activeProfilesCount}</strong>
          </button>

          <button
            className="adminStatCard warningStatCard"
            type="button"
            onClick={() => {
              setActiveTab("active");
              setProfileFilter("expiring");
            }}
          >
            <span>Expiring soon</span>
            <strong>{expiringSoonProfiles.length}</strong>
          </button>

          <button
            className="adminStatCard warningStatCard"
            type="button"
            onClick={() => {
              setActiveTab("active");
              setProfileFilter("extensionRequests");
            }}
          >
            <span>Extension requests</span>
            <strong>{extensionRequests.length}</strong>
          </button>

          <button
            className="adminStatCard warningStatCard"
            type="button"
            onClick={() => {
              setActiveTab("active");
              setProfileFilter("upgradeRequests");
            }}
          >
            <span>Upgrade requests</span>
            <strong>{upgradeRequests.length}</strong>
          </button>

          <button
            className={`adminStatCard ${
              activeTab === "jobRequests" ? "activeStatCard" : ""
            }`}
            type="button"
            onClick={() => setActiveTab("jobRequests")}
          >
            <span>Job requests</span>
            <strong>{jobPostRequestsCount}</strong>
          </button>

          <button
            className={`adminStatCard ${
              activeTab === "jobs" ? "activeStatCard" : ""
            }`}
            type="button"
            onClick={() => setActiveTab("jobs")}
          >
            <span>Published jobs</span>
            <strong>{publishedJobsCount}</strong>
          </button>

          <button
            className={`adminStatCard ${
              activeTab === "blog" ? "activeStatCard" : ""
            }`}
            type="button"
            onClick={() => setActiveTab("blog")}
          >
            <span>Blog posts</span>
            <strong>{blogPosts.length}</strong>
          </button>
        </section>

        <nav className="adminTabs">
          <button
            className={activeTab === "requests" ? "activeTab" : ""}
            type="button"
            onClick={() => setActiveTab("requests")}
          >
            Requests
          </button>

          <button
            className={activeTab === "active" ? "activeTab" : ""}
            type="button"
            onClick={() => setActiveTab("active")}
          >
            Active profiles
          </button>

          <button
            className={activeTab === "jobRequests" ? "activeTab" : ""}
            type="button"
            onClick={() => setActiveTab("jobRequests")}
          >
            Job requests
          </button>

          <button
            className={activeTab === "jobs" ? "activeTab" : ""}
            type="button"
            onClick={() => setActiveTab("jobs")}
          >
            Published jobs
          </button>

          <button
            className={activeTab === "blog" ? "activeTab" : ""}
            type="button"
            onClick={() => setActiveTab("blog")}
          >
            Blog
          </button>
        </nav>

        <div className="adminSearchWrap">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone, city, region, membership, job..."
          />

          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm("")}>
              Clear
            </button>
          )}
        </div>

        {activeTab === "requests" && (
          <>
            <div className="adminDividerTitle">
              Pending requests ({pendingCount})
            </div>

            <div className="adminFilters">
              <button
                className={requestFilter === "all" ? "activeFilter" : ""}
                type="button"
                onClick={() => setRequestFilter("all")}
              >
                All
              </button>

              <button
                className={requestFilter === "coaches" ? "activeFilter" : ""}
                type="button"
                onClick={() => setRequestFilter("coaches")}
              >
                Coaches
              </button>

              <button
                className={requestFilter === "academies" ? "activeFilter" : ""}
                type="button"
                onClick={() => setRequestFilter("academies")}
              >
                Academies
              </button>
            </div>

            {loading ? (
              <div className="adminLoading">Loading requests...</div>
            ) : (
              <>
                {(requestFilter === "all" || requestFilter === "coaches") && (
                  <section className="adminSection requestsSection">
                    <h2>Coach Requests ({searchedCoaches.length})</h2>

                    {searchedCoaches.length === 0 ? (
                      <p className="emptyText">No pending coach requests.</p>
                    ) : (
                      <div className="requestGrid">
                        {searchedCoaches.map((coach) => (
                          <div className="requestCard" key={coach.id}>
                            <div className="cardTopLine">
                              <span className="typeBadge coachBadge">
                                Coach
                              </span>
                              <span>{formatDate(coach.createdAt)}</span>
                            </div>

                            <h3>{coach.fullName || "Unnamed coach"}</h3>

                            <p>
                              <strong>Email:</strong> {coach.email || "-"}
                            </p>

                            <p>
                              <strong>Membership:</strong>{" "}
                              {getMembershipName(coach)}
                            </p>

                            <p>
                              <strong>Phone:</strong> {coach.phone || "-"}
                            </p>

                            <p>
                              <strong>Nationality:</strong>{" "}
                              {coach.nationality || "-"}
                            </p>

                            <p>
                              <strong>Region:</strong> {coach.region || "-"}
                            </p>

                            <div className="requestActions threeButtons">
                              <button
                                className="viewBtn"
                                type="button"
                                onClick={() => openProfileModal("coach", coach)}
                              >
                                View profile
                              </button>

                              <button
                                className="approveBtn"
                                onClick={() => approveProfile("coach", coach)}
                              >
                                Approve
                              </button>

                              <button
                                className="rejectBtn"
                                onClick={() => rejectProfile("coach", coach.id)}
                              >
                                Reject
                              </button>

                              <button
                                className="rejectBtn deleteProfileBtn"
                                onClick={() => deleteProfile("coach", coach.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {(requestFilter === "all" || requestFilter === "academies") && (
                  <section className="adminSection requestsSection">
                    <h2>Academy Requests ({searchedAcademies.length})</h2>

                    {searchedAcademies.length === 0 ? (
                      <p className="emptyText">No pending academy requests.</p>
                    ) : (
                      <div className="requestGrid">
                        {searchedAcademies.map((academy) => (
                          <div className="requestCard" key={academy.id}>
                            <div className="cardTopLine">
                              <span className="typeBadge academyBadge">
                                Academy
                              </span>
                              <span>{formatDate(academy.createdAt)}</span>
                            </div>

                            <h3>
                              {academy.organisationName || "Unnamed academy"}
                            </h3>

                            <p>
                              <strong>Contact:</strong>{" "}
                              {academy.contactName || "-"}
                            </p>

                            <p>
                              <strong>Email:</strong> {academy.email || "-"}
                            </p>

                            <p>
                              <strong>Membership:</strong>{" "}
                              {getMembershipName(academy)}
                            </p>

                            <p>
                              <strong>Phone:</strong> {academy.phone || "-"}
                            </p>

                            <p>
                              <strong>City:</strong> {academy.city || "-"}
                            </p>

                            <p>
                              <strong>Region:</strong> {academy.region || "-"}
                            </p>

                            <div className="requestActions threeButtons">
                              <button
                                className="viewBtn"
                                type="button"
                                onClick={() =>
                                  openProfileModal("academy", academy)
                                }
                              >
                                View profile
                              </button>

                              <button
                                className="approveBtn"
                                onClick={() =>
                                  approveProfile("academy", academy)
                                }
                              >
                                Approve
                              </button>

                              <button
                                className="rejectBtn"
                                onClick={() =>
                                  rejectProfile("academy", academy.id)
                                }
                              >
                                Reject
                              </button>

                              <button
                                className="rejectBtn deleteProfileBtn"
                                onClick={() =>
                                  deleteProfile("academy", academy.id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "active" && (
          <>
            <div className="adminDividerTitle">Active profiles</div>

            <div className="adminFilters">
              <button
                className={profileFilter === "all" ? "activeFilter" : ""}
                type="button"
                onClick={() => setProfileFilter("all")}
              >
                All
              </button>

              <button
                className={profileFilter === "coaches" ? "activeFilter" : ""}
                type="button"
                onClick={() => setProfileFilter("coaches")}
              >
                Coaches
              </button>

              <button
                className={profileFilter === "academies" ? "activeFilter" : ""}
                type="button"
                onClick={() => setProfileFilter("academies")}
              >
                Academies
              </button>

              <button
                className={profileFilter === "expiring" ? "activeFilter" : ""}
                type="button"
                onClick={() => setProfileFilter("expiring")}
              >
                Expiring soon
              </button>

              <button
                className={
                  profileFilter === "extensionRequests" ? "activeFilter" : ""
                }
                type="button"
                onClick={() => setProfileFilter("extensionRequests")}
              >
                Extension requests
              </button>

              <button
                className={
                  profileFilter === "upgradeRequests" ? "activeFilter" : ""
                }
                type="button"
                onClick={() => setProfileFilter("upgradeRequests")}
              >
                Upgrade requests
              </button>
            </div>

            {(profileFilter === "all" ||
              profileFilter === "coaches" ||
              profileFilter === "expiring" ||
              profileFilter === "extensionRequests" ||
              profileFilter === "upgradeRequests") && (
              <section className="adminSection profilesSection">
                <h2>Active Coach Profiles ({searchedActiveCoaches.length})</h2>

                {searchedActiveCoaches.length === 0 ? (
                  <p className="emptyText">No active coach profiles.</p>
                ) : (
                  <div className="requestGrid">
                    {searchedActiveCoaches.map((coach) => (
                      <div className="requestCard" key={coach.id}>
                        <div className="cardTopLine">
                          <span className="typeBadge coachBadge">Coach</span>
                          <span className={getStatusClass(coach.expiresAt)}>
                            {getProfileStatus(coach.expiresAt)}
                          </span>
                        </div>

                        <h3>{coach.fullName || "Unnamed coach"}</h3>

                        {coach.extensionRequested && (
                          <p className="extensionRequestText">
                            <strong>Extension request:</strong>{" "}
                            {getRequestedExtensionLabel(coach)}
                          </p>
                        )}

                        {coach.upgradeRequested && (
                          <p className="extensionRequestText">
                            <strong>Upgrade request:</strong>{" "}
                            {getMembershipName(coach)} →{" "}
                            {getRequestedUpgradeLabel(coach)}
                          </p>
                        )}

                        <p>
                          <strong>Email:</strong> {coach.email || "-"}
                        </p>

                        <p>
                          <strong>Membership:</strong>{" "}
                          {getMembershipName(coach)}
                        </p>
<div className="manualMembershipBox">
  <label>Change membership</label>

  <select
    value={getMembershipPlanId(coach)}
    onChange={(e) =>
      changeProfileMembership("coach", coach, e.target.value)
    }
  >
    {COACH_MEMBERSHIP_PLANS.map((plan) => (
      <option key={plan.id} value={plan.id}>
        {plan.name} - {plan.price}
      </option>
    ))}
  </select>
</div>
                        <p>
                          <strong>Visible:</strong>{" "}
                          {coach.profileVisible === false
                            ? "Hidden"
                            : "Visible"}
                        </p>

                        <p>
                          <strong>Approved:</strong>{" "}
                          {formatDate(coach.approvedAt)}
                        </p>

                        <p>
                          <strong>Expires:</strong>{" "}
                          {formatDate(coach.expiresAt)}
                        </p>

                        <div className="requestActions profileActions">
                          <button
                            className="viewBtn"
                            type="button"
                            onClick={() => openProfileModal("coach", coach)}
                          >
                            View profile
                          </button>

                          <button
                            className="hideBtn"
                            type="button"
                            onClick={() =>
                              toggleProfileVisibility(
                                "coach",
                                coach.id,
                                coach.profileVisible !== false
                              )
                            }
                          >
                            {coach.profileVisible === false
                              ? "Show profile"
                              : "Hide profile"}
                          </button>

                          <button
                            className="extendBtn"
                            onClick={() => extendProfile("coach", coach)}
                          >
                            Extend 1 year
                          </button>

                          {coach.upgradeRequested && (
                            <button
                              className="extendBtn"
                              onClick={() =>
                                upgradeProfileMembership("coach", coach)
                              }
                            >
                              Approve upgrade
                            </button>
                          )}

                          <button
                            className="rejectBtn deleteProfileBtn"
                            onClick={() => deleteProfile("coach", coach.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {(profileFilter === "all" ||
              profileFilter === "academies" ||
              profileFilter === "expiring" ||
              profileFilter === "extensionRequests" ||
              profileFilter === "upgradeRequests") && (
              <section className="adminSection profilesSection">
                <h2>
                  Active Academy Profiles ({searchedActiveAcademies.length})
                </h2>

                {searchedActiveAcademies.length === 0 ? (
                  <p className="emptyText">No active academy profiles.</p>
                ) : (
                  <div className="requestGrid">
                    {searchedActiveAcademies.map((academy) => (
                      <div className="requestCard" key={academy.id}>
                        <div className="cardTopLine">
                          <span className="typeBadge academyBadge">
                            Academy
                          </span>
                          <span className={getStatusClass(academy.expiresAt)}>
                            {getProfileStatus(academy.expiresAt)}
                          </span>
                        </div>

                        <h3>
                          {academy.organisationName || "Unnamed academy"}
                        </h3>

                        {academy.extensionRequested && (
                          <p className="extensionRequestText">
                            <strong>Extension request:</strong>{" "}
                            {getRequestedExtensionLabel(academy)}
                          </p>
                        )}

                        {academy.upgradeRequested && (
                          <p className="extensionRequestText">
                            <strong>Upgrade request:</strong>{" "}
                            {getMembershipName(academy)} →{" "}
                            {getRequestedUpgradeLabel(academy)}
                          </p>
                        )}

                        <p>
                          <strong>Email:</strong> {academy.email || "-"}
                        </p>

                        <p>
                          <strong>Membership:</strong>{" "}
                          {getMembershipName(academy)}
                        </p>
<div className="manualMembershipBox">
  <label>Change membership</label>

  <select
    value={getMembershipPlanId(academy)}
    onChange={(e) =>
      changeProfileMembership("academy", academy, e.target.value)
    }
  >
    {ACADEMY_MEMBERSHIP_PLANS.map((plan) => (
      <option key={plan.id} value={plan.id}>
        {plan.name} - {plan.price}
      </option>
    ))}
  </select>
</div>
                        {academy.previousMembershipPlan && (
                          <p>
                            <strong>Previous membership:</strong>{" "}
                            {academy.previousMembershipPlan}
                          </p>
                        )}

                        <p>
                          <strong>Visible:</strong>{" "}
                          {academy.profileVisible === false
                            ? "Hidden"
                            : "Visible"}
                        </p>

                        <p>
                          <strong>Approved:</strong>{" "}
                          {formatDate(academy.approvedAt)}
                        </p>

                        <p>
                          <strong>Expires:</strong>{" "}
                          {formatDate(academy.expiresAt)}
                        </p>

                        <div className="requestActions profileActions">
                          <button
                            className="viewBtn"
                            type="button"
                            onClick={() =>
                              openProfileModal("academy", academy)
                            }
                          >
                            View profile
                          </button>

                          <button
                            className="hideBtn"
                            type="button"
                            onClick={() =>
                              toggleProfileVisibility(
                                "academy",
                                academy.id,
                                academy.profileVisible !== false
                              )
                            }
                          >
                            {academy.profileVisible === false
                              ? "Show profile"
                              : "Hide profile"}
                          </button>

                          <button
                            className="extendBtn"
                            onClick={() => extendProfile("academy", academy)}
                          >
                            Extend 1 year
                          </button>

                          {academy.upgradeRequested && (
                            <button
                              className="extendBtn"
                              onClick={() =>
                                upgradeProfileMembership("academy", academy)
                              }
                            >
                              Approve upgrade
                            </button>
                          )}

                          <button
                            className="rejectBtn deleteProfileBtn"
                            onClick={() =>
                              deleteProfile("academy", academy.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {activeTab === "jobRequests" && (
          <>
            <div className="adminDividerTitle">
              Job post requests ({jobPostRequests.length})
            </div>

            <section className="adminSection requestsSection">
              <h2>Pending Job Post Requests</h2>

              {jobPostRequests.length === 0 ? (
                <p className="emptyText">No pending job post requests.</p>
              ) : (
                <div className="requestGrid">
                  {jobPostRequests.map((request) => (
                    <div className="requestCard" key={request.id}>
                      <div className="cardTopLine">
                        <span className="typeBadge academyBadge">
                          Job request
                        </span>
                        <span>{formatDate(request.createdAt)}</span>
                      </div>

                      <h3>{request.title || "Untitled job"}</h3>

                      <p>
                        <strong>Academy:</strong> {request.academyName || "-"}
                      </p>

                      <p>
                        <strong>Email:</strong> {request.academyEmail || "-"}
                      </p>

                      <p>
                        <strong>Membership:</strong>{" "}
                        {request.membership?.name ||
                          request.membershipPlan ||
                          "-"}
                      </p>

                      <p>
                        <strong>Location:</strong> {request.city || "-"},{" "}
                        {request.country || "-"}
                      </p>

                      <p>
                        <strong>Address:</strong> {request.address || "-"}
                      </p>

                      <p>
                        <strong>Salary:</strong>{" "}
                        {request.minSalary && request.maxSalary
                          ? `€${request.minSalary} – €${request.maxSalary}`
                          : "Negotiable"}
                      </p>

                      <p>
                        <strong>Benefits:</strong> {request.benefits || "-"}
                      </p>

                      <p>
                        <strong>Description:</strong>{" "}
                        {request.description || "-"}
                      </p>

                      <p>
                        <strong>Date:</strong> {request.date || "-"}
                      </p>

                      <div className="requestActions">
                        <button
                          className="approveBtn"
                          type="button"
                          onClick={() => approveJobPostRequest(request)}
                        >
                          Approve & publish
                        </button>

                        <button
                          className="rejectBtn"
                          type="button"
                          onClick={() => rejectJobPostRequest(request.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}


        {activeTab === "jobs" && (
          <>
            <div className="adminDividerTitle">
              Published jobs ({searchedPublishedJobs.length})
            </div>

            <section className="adminSection jobsSection">
              <h2>All Published Jobs</h2>

              {searchedPublishedJobs.length === 0 ? (
                <p className="emptyText">No published jobs found.</p>
              ) : (
                <div className="requestGrid">
                  {searchedPublishedJobs.map((job) => {
                    const isFilled =
                      job.status === "filled" || job.jobVisible === false;

                    return (
                      <div
                        className={`requestCard ${
                          isFilled ? "filledJobCard" : "activeJobCard"
                        }`}
                        key={job.jobPath}
                      >
                        <div className="cardTopLine">
                          <span
                            className={`typeBadge ${
                              isFilled ? "filledJobBadge" : "activeJobBadge"
                            }`}
                          >
                            {isFilled ? "Filled" : "Active job"}
                          </span>

                          <span>{formatDate(job.createdAt)}</span>
                        </div>

                        <h3>{job.title || "Untitled job"}</h3>

                        <p>
                          <strong>Academy:</strong> {job.academyName || "-"}
                        </p>

                        <p>
                          <strong>Email:</strong> {job.academyEmail || "-"}
                        </p>

                        <p>
                          <strong>Location:</strong> {job.city || "-"},{" "}
                          {job.country || "-"}
                        </p>

                        <p>
                          <strong>Address:</strong> {job.address || "-"}
                        </p>

                        <p>
                          <strong>Salary:</strong>{" "}
                          {job.minSalary && job.maxSalary
                            ? `€${job.minSalary} – €${job.maxSalary}`
                            : "Negotiable"}
                        </p>

                        <p className="jobStatusLine">
                          <span
                            className={`jobStatusDot ${
                              isFilled ? "filled" : "active"
                            }`}
                          />
                          <strong>Status:</strong>{" "}
                          {isFilled ? "Filled" : "Active"}
                        </p>

                        <p>
                          <strong>Date:</strong> {job.date || "-"}
                        </p>

                        <p>
                          <strong>Description:</strong> {job.description || "-"}
                        </p>

                        <p>
                          <strong>Benefits:</strong> {job.benefits || "-"}
                        </p>

                        <div className="requestActions">
                          {isFilled ? (
                            <button
                              className="approveBtn"
                              type="button"
                              onClick={() => reactivateJob(job)}
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              className="rejectBtn"
                              type="button"
                              onClick={() => markJobAsFilled(job)}
                            >
                              Mark as filled
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "blog" && (
          <>
            <div className="adminDividerTitle">Blog management</div>

            {showBlogForm && (
              <section className="adminSection blogSection">
                <h2>Create Blog Post</h2>

                <form className="blogForm" onSubmit={createBlogPost}>
                  <input
                    type="text"
                    name="title"
                    placeholder="Blog title"
                    value={blogForm.title}
                    onChange={handleBlogChange}
                  />

                  <input
                    type="text"
                    name="excerpt"
                    placeholder="Short excerpt"
                    value={blogForm.excerpt}
                    onChange={handleBlogChange}
                  />

                  <textarea
                    name="content"
                    placeholder="Blog content"
                    rows={8}
                    value={blogForm.content}
                    onChange={handleBlogChange}
                  />

                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleBlogFileChange}
                  />

                  {blogFile && (
                    <p className="emptyText">Selected file: {blogFile.name}</p>
                  )}

                  <button
                    className="publishBtn"
                    type="submit"
                    disabled={uploadingBlog}
                  >
                    {uploadingBlog ? "Publishing..." : "Publish Blog Post"}
                  </button>
                </form>
              </section>
            )}

            <section className="adminSection blogAdminSection">
              <h2>Blog Posts ({blogPosts.length})</h2>

              {loadingBlogs ? (
                <p className="emptyText">Loading blog posts...</p>
              ) : blogPosts.length === 0 ? (
                <p className="emptyText">No blog posts yet.</p>
              ) : (
                <div className="requestGrid">
                  {blogPosts.map((post) => (
                    <div className="requestCard" key={post.id}>
                      <div className="cardTopLine">
                        <span className="typeBadge blogBadge">Blog</span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>

                      {post.mediaType === "image" && post.mediaUrl && (
                        <img
                          src={post.mediaUrl}
                          alt={post.title}
                          style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 14,
                            marginBottom: 14,
                          }}
                        />
                      )}

                      {post.mediaType === "video" && post.mediaUrl && (
                        <video
                          src={post.mediaUrl}
                          controls
                          style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 14,
                            marginBottom: 14,
                          }}
                        />
                      )}

                      <h3>{post.title || "Untitled post"}</h3>
                      <p>{post.excerpt || "No excerpt."}</p>

                      <div className="requestActions">
                        <button
                          className="rejectBtn"
                          onClick={() => deleteBlogPost(post.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {toast.open && (
          <div
            className={`adminToast ${
              toast.type === "error" ? "errorToast" : ""
            }`}
          >
            <span>{toast.type === "error" ? "!" : "✓"}</span>
            <p>{toast.message}</p>
          </div>
        )}

        {confirmModal.open && (
          <div className="confirmModalOverlay" onClick={closeConfirm}>
            <div className="confirmModal" onClick={(e) => e.stopPropagation()}>
              <h2>{confirmModal.title}</h2>
              <p>{confirmModal.message}</p>

              <div className="confirmActions">
                <button className="cancelConfirmBtn" onClick={closeConfirm}>
                  Cancel
                </button>

                <button
                  className={
                    confirmModal.danger ? "dangerConfirmBtn" : "confirmBtn"
                  }
                  onClick={runConfirmAction}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedProfile && (
          <div className="profileModalOverlay" onClick={closeProfileModal}>
            <div className="profileModal" onClick={(e) => e.stopPropagation()}>
              <button className="modalCloseBtn" onClick={closeProfileModal}>
                ×
              </button>

              {selectedProfileType === "coach" ? (
                <>
                  <div className="profileModalHeader">
                    {selectedProfile.profileImage ? (
                      <img
                        src={selectedProfile.profileImage}
                        alt={selectedProfile.fullName}
                        className="modalProfileImage"
                      />
                    ) : (
                      <div className="modalProfilePlaceholder">
                        {selectedProfile.fullName?.charAt(0) || "C"}
                      </div>
                    )}

                    <div>
                      <h2>{selectedProfile.fullName || "Unnamed coach"}</h2>
                      <p>{selectedProfile.region || "No region selected"}</p>
                    </div>
                  </div>

                  <div className="profileModalGrid">
                    <p>
                      <strong>Email:</strong> {selectedProfile.email || "-"}
                    </p>

                    <p>
                      <strong>Phone:</strong> {selectedProfile.phone || "-"}
                    </p>

                    <p>
                      <strong>Age:</strong> {selectedProfile.age || "-"}
                    </p>

                    <p>
                      <strong>Nationality:</strong>{" "}
                      {selectedProfile.nationality || "-"}
                    </p>

                    <p>
                      <strong>Residence:</strong>{" "}
                      {selectedProfile.residence || "-"}
                    </p>

                    <p>
                      <strong>Region:</strong>{" "}
                      {selectedProfile.region || "-"}
                    </p>

                    <p>
                      <strong>Membership:</strong>{" "}
                      {getMembershipName(selectedProfile)}
                    </p>

                    <p>
                      <strong>Extension request:</strong>{" "}
                      {selectedProfile.extensionRequested
                        ? getRequestedExtensionLabel(selectedProfile)
                        : "No"}
                    </p>

                    <p>
                      <strong>Upgrade request:</strong>{" "}
                      {selectedProfile.upgradeRequested
                        ? `${getMembershipName(
                            selectedProfile
                          )} → ${getRequestedUpgradeLabel(selectedProfile)}`
                        : "No"}
                    </p>

                    <p>
                      <strong>Visible:</strong>{" "}
                      {selectedProfile.profileVisible === false
                        ? "Hidden"
                        : "Visible"}
                    </p>

                    <p>
                      <strong>Created:</strong>{" "}
                      {formatDate(selectedProfile.createdAt)}
                    </p>

                    <p>
                      <strong>Expires:</strong>{" "}
                      {formatDate(selectedProfile.expiresAt)}
                    </p>
                  </div>

                  <div className="profileModalBlock">
                    <h3>About</h3>
                    <p>{selectedProfile.about || "No about text."}</p>
                  </div>

                  <div className="profileModalBlock">
                    <h3>Certifications</h3>
                    <p>
                      {selectedProfile.certifications ||
                        "No certifications added."}
                    </p>
                  </div>

                  <div className="profileModalBlock">
                    <h3>Videos</h3>

                    {selectedProfile.playingVideo ? (
                      <a
                        href={selectedProfile.playingVideo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Playing video
                      </a>
                    ) : (
                      <p>No playing video.</p>
                    )}

                    {selectedProfile.coachingVideo ? (
                      <a
                        href={selectedProfile.coachingVideo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Coaching video
                      </a>
                    ) : (
                      <p>No coaching video.</p>
                    )}
                  </div>

                  <div className="profileModalBlock">
                    <h3>Recommendation</h3>
                    <p>
                      <strong>
                        {selectedProfile.recommenderName || "No recommender"}
                      </strong>
                    </p>
                    <p>
                      {selectedProfile.recommendationText ||
                        "No recommendation text."}
                    </p>
                  </div>

                  {selectedProfile.galleryImages?.length > 0 && (
                    <div className="profileModalBlock">
                      <h3>Gallery</h3>

                      <div className="modalGallery">
                        {selectedProfile.galleryImages.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Gallery ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="profileModalHeader">
                    <div className="modalProfilePlaceholder">
                      {selectedProfile.organisationName?.charAt(0) || "A"}
                    </div>

                    <div>
                      <h2>
                        {selectedProfile.organisationName || "Unnamed academy"}
                      </h2>
                      <p>
                        {selectedProfile.city || "No city"} •{" "}
                        {selectedProfile.region || "No region"}
                      </p>
                    </div>
                  </div>

                  <div className="profileModalGrid">
                    <p>
                      <strong>Contact:</strong>{" "}
                      {selectedProfile.contactName || "-"}
                    </p>

                    <p>
                      <strong>Email:</strong> {selectedProfile.email || "-"}
                    </p>

                    <p>
                      <strong>Phone:</strong> {selectedProfile.phone || "-"}
                    </p>

                    <p>
                      <strong>Organisation:</strong>{" "}
                      {selectedProfile.organisationName || "-"}
                    </p>

                    <p>
                      <strong>Address:</strong>{" "}
                      {selectedProfile.address || "-"}
                    </p>

                    <p>
                      <strong>City:</strong> {selectedProfile.city || "-"}
                    </p>

                    <p>
                      <strong>Region:</strong>{" "}
                      {selectedProfile.region || "-"}
                    </p>

                    <p>
                      <strong>Membership:</strong>{" "}
                      {getMembershipName(selectedProfile)}
                    </p>

                    {selectedProfile.previousMembershipPlan && (
                      <p>
                        <strong>Previous membership:</strong>{" "}
                        {selectedProfile.previousMembershipPlan}
                      </p>
                    )}

                    <p>
                      <strong>Extension request:</strong>{" "}
                      {selectedProfile.extensionRequested
                        ? getRequestedExtensionLabel(selectedProfile)
                        : "No"}
                    </p>

                    <p>
                      <strong>Upgrade request:</strong>{" "}
                      {selectedProfile.upgradeRequested
                        ? `${getMembershipName(
                            selectedProfile
                          )} → ${getRequestedUpgradeLabel(selectedProfile)}`
                        : "No"}
                    </p>

                    <p>
                      <strong>Visible:</strong>{" "}
                      {selectedProfile.profileVisible === false
                        ? "Hidden"
                        : "Visible"}
                    </p>

                    <p>
                      <strong>Created:</strong>{" "}
                      {formatDate(selectedProfile.createdAt)}
                    </p>

                    <p>
                      <strong>Expires:</strong>{" "}
                      {formatDate(selectedProfile.expiresAt)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  </>
);
}