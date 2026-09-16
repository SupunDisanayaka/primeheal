import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { adminToken, logout: adminLogout, currentAdminName } = useContext(AdminContext);
  const { doctorToken, logout: doctorLogout, currentDoctorName } = useContext(DoctorContext);
  const {
    receptionistToken,
    logoutReceptionist,
    currentReceptionistName,
    accountantToken,
    logoutAccountant,
    currentAccountantName
  } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (adminToken) adminLogout();
    if (doctorToken) doctorLogout();
    if (receptionistToken) logoutReceptionist();
    if (accountantToken) logoutAccountant();
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("doctorToken");
    sessionStorage.removeItem("currentDoctorId");
    sessionStorage.removeItem("receptionistToken");
    sessionStorage.removeItem("currentReceptionistId");
    sessionStorage.removeItem("currentReceptionistName");
    sessionStorage.removeItem("accountantToken");
    sessionStorage.removeItem("aToken");
    sessionStorage.removeItem("dToken");
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  // Helper to extract name directly from JWT payload as an extra fallback
  const parseNameFromToken = (token) => {
    if (!token) return "";
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return "";
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      return payload?.name || "";
    } catch (e) {
      return "";
    }
  };

  const getResolvedUserName = () => {
    if (adminToken) {
      return currentAdminName || parseNameFromToken(adminToken) || sessionStorage.getItem("currentAdminName") || "Administrator";
    }
    if (doctorToken) {
      return currentDoctorName || parseNameFromToken(doctorToken) || sessionStorage.getItem("currentDoctorName") || "Doctor";
    }
    if (receptionistToken) {
      return currentReceptionistName || parseNameFromToken(receptionistToken) || sessionStorage.getItem("currentReceptionistName") || "Receptionist";
    }
    if (accountantToken) {
      return currentAccountantName || parseNameFromToken(accountantToken) || sessionStorage.getItem("currentAccountantName") || "Accountant";
    }
    return "";
  };

  const activeUserName = getResolvedUserName();

  return (
    <div className="flex justify-between items-center px-4 sm:px-10 py-3.5 border-b border-zinc-100 bg-white/75 backdrop-blur-md sticky top-0 z-50 shadow-xs transition-all duration-300">
      <div className="flex items-center">
        {/* Typewriter Welcome Animation aligned to the left corner */}
        {(adminToken || doctorToken || receptionistToken || accountantToken) && (
          <div className="inline-flex items-center">
            <div className="typewriter-container">
              <span
                className="typewriter-text text-gray-800 text-[20px] font-medium"
                style={{ fontFamily: "'Google Sans', 'Product Sans', 'Plus Jakarta Sans', 'Open Sans', sans-serif" }}
              >
                Welcome,{" "}
                <span className="italic font-semibold">
                  {activeUserName}
                </span>
              </span>
            </div>
          </div>
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
