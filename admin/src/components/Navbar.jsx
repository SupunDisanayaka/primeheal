import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { adminToken, logout: adminLogout } = useContext(AdminContext);
  const { doctorToken, logout: doctorLogout } = useContext(DoctorContext);
  const {
    receptionistToken,
    logoutReceptionist,
    currentReceptionistName,
    accountantToken,
    logoutAccountant
  } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (adminToken) adminLogout();
    if (doctorToken) doctorLogout();
    if (receptionistToken) logoutReceptionist();
    if (accountantToken) logoutAccountant();
    localStorage.removeItem("adminToken");
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("currentDoctorId");
    localStorage.removeItem("receptionistToken");
    localStorage.removeItem("currentReceptionistId");
    localStorage.removeItem("currentReceptionistName");
    localStorage.removeItem("accountantToken");
    localStorage.removeItem("aToken");
    localStorage.removeItem("dToken");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex justify-between items-center px-4 sm:px-10 py-3.5 border-b border-zinc-100 bg-white/75 backdrop-blur-md sticky top-0 z-50 shadow-xs transition-all duration-300">
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        {/* Role Badge */}
        <span className="border px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-50/30 text-[#187595] border-teal-100 shadow-2xs select-none">
          {adminToken
            ? "Admin Panel"
            : doctorToken
            ? "Doctor Portal"
            : receptionistToken
            ? "Receptionist Portal"
            : accountantToken
            ? "Accountant Portal"
            : ""}
        </span>

        {/* User Name side the Receptionist Portal label */}
        {receptionistToken && currentReceptionistName && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-700 bg-slate-100/90 border border-slate-200/80 rounded-full shadow-2xs transition-all animate-in fade-in duration-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-gray-800 font-semibold">{currentReceptionistName}</span>
          </span>
        )}
      </div>

      {/* Logout Action */}
      <button
        onClick={handleLogout}
        className="bg-[#187595] hover:bg-[#135c75] text-white px-5 sm:px-8 py-2 rounded-full text-sm font-medium transition-all duration-300 transform active:scale-95 shadow-sm"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;
