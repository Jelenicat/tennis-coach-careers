import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import ChooseRole from "../pages/ChooseRole/ChooseRole";
import CoachRegister from "../pages/Register/CoachRegister";
import AcademyRegister from "../pages/Register/AcademyRegister";
import AcademyDashboard from "../pages/Academy/AcademyDashboard";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/register/coach" element={<CoachRegister />} />
      <Route path="/register/academy" element={<AcademyRegister />} />
      
<Route
  path="/academy/dashboard"
  element={<AcademyDashboard />}
/>
    </Routes>
    
  );
}
