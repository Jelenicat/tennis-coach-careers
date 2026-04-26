import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import ChooseRole from "../pages/ChooseRole/ChooseRole";
import CoachRegister from "../pages/Register/CoachRegister";
import AcademyRegister from "../pages/Register/AcademyRegister";
import AcademyDashboard from "../pages/Academy/AcademyDashboard";
import Login from "../pages/Login/Login";
import CoachProfile from "../pages/CoachProfile/CoachProfile";
import Splash from "../pages/Splash/Splash";
import Jobs from "../pages/Jobs/Jobs";
import CoachList from "../pages/Coach/CoachList";
import CoachMembership from "../pages/Membership/CoachMembership";

import TermsOfUse from "../pages/Legal/TermsOfUse";
import PrivacyPolicy from "../pages/Legal/PrivacyPolicy";
import CookiePolicy from "../pages/Legal/CookiePolicy";
import Contact from "../pages/Legal/Contact";
import AdminPanel from "../pages/Admin/AdminPanel";
import BlogPost from "../pages/BlogPost/BlogPost";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/home" element={<Home />} />

      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/register/coach" element={<CoachRegister />} />
      <Route path="/register/academy" element={<AcademyRegister />} />

      <Route path="/academy/:id" element={<AcademyDashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/coaches" element={<CoachList />} />

      <Route path="/coach-membership" element={<CoachMembership />} />
      <Route path="/coach/:id" element={<CoachProfile />} />

      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/blog/:id" element={<BlogPost />} />
    </Routes>
  );
}