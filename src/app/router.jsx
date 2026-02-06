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
      {/* ✅ MEMBERSHIP */}
      <Route path="/coach-membership" element={<CoachMembership />} />

      {/* ✅ COACH PROFILE */}
      <Route path="/coach/:id" element={<CoachProfile />} />
    </Routes>

    
  );
}
