import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import { AppContext } from "../context/AppContext";

const Sidebar = () => {
  const { adminToken } = useContext(AdminContext);
  const { doctorToken, currentDoctorId } = useContext(DoctorContext);
  const { 
    receptionistToken, 
    accountantToken, 
    appointments = [], 
    doctors = [], 
    receptionists = [], 
    accountants = [] 
  } = useContext(AppContext);
  const navigate = useNavigate();

  // Helper to format numbers with leading zero (e.g. 05)
  const formatBadge = (num) => String(num).padStart(2, "0");

  const activeStyleClass =
    "sidebar-link-active flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer bg-white text-[#187595] font-bold transition-all rounded-r-full mr-4 shadow-sm relative z-10 animate-fade-in";
  const inactiveStyleClass =
    "sidebar-link flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer text-white/95 hover:bg-white/10 hover:text-white transition-all rounded-r-full mr-4 relative z-10";

  return (
    <div className="h-full relative bg-gradient-to-b from-[#187595] via-[#43adb3] to-[#86d093] flex flex-col select-none border-r border-teal-600/10 text-white overflow-hidden w-[75px] md:w-auto shrink-0 transition-all duration-300">
      {/* Brand Logo at Sidebar Top - Fixed */}
      <div className="px-3 md:px-9 py-6 border-b border-white/10 shrink-0">
        <img
          onClick={() => navigate("/")}
          className="w-36 sm:w-44 cursor-pointer hover:opacity-90 transition-opacity"
          src={assets.admin_logo}
          alt="Prime Heal Logo"
        />
      </div>

      {/* Scrollable Side Menu Links */}
      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6 scrollbar-none z-10">
        {/* Admin Panel Side Menu */}
        {adminToken && (
          <ul className="flex flex-col gap-1.5 text-[15px]">
            <NavLink
              to="/admin-dashboard"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.home_icon} alt="Dashboard Icon" />
              <span className="hidden md:inline">Dashboard</span>
            </NavLink>

            <NavLink
              to="/all-appointments"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.appointment_icon} alt="Appointments Icon" />
              <span className="hidden md:inline">Appointments</span>
              {appointments.length > 0 && (
                <span className="hidden md:inline-block ml-auto bg-[#f2994a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs min-w-[22px] text-center">
                  {formatBadge(appointments.length)}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/add-doctor"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.add_icon} alt="Add Doctor Icon" />
              <span className="hidden md:inline">Add Doctor</span>
            </NavLink>

            <NavLink
              to="/doctors-list"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.people_icon} alt="Doctors List Icon" />
              <span className="hidden md:inline">Doctors List</span>
              {doctors.length > 0 && (
                <span className="hidden md:inline-block ml-auto bg-[#f2994a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs min-w-[22px] text-center">
                  {formatBadge(doctors.length)}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/receptionist"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.people_icon} alt="Receptionists Icon" />
              <span className="hidden md:inline">Receptionists</span>
              {receptionists.length > 0 && (
                <span className="hidden md:inline-block ml-auto bg-[#f2994a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs min-w-[22px] text-center">
                  {formatBadge(receptionists.length)}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/accountant"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.people_icon} alt="Accountants Icon" />
              <span className="hidden md:inline">Accountants</span>
              {accountants.length > 0 && (
                <span className="hidden md:inline-block ml-auto bg-[#f2994a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs min-w-[22px] text-center">
                  {formatBadge(accountants.length)}
                </span>
              )}
            </NavLink>
          </ul>
        )}

        {/* Doctor Panel Side Menu */}
        {doctorToken && (
          <ul className="flex flex-col gap-1.5 text-[15px]">
            <NavLink
              to="/doctor-dashboard"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.home_icon} alt="Dashboard Icon" />
              <span className="hidden md:inline">Dashboard</span>
            </NavLink>

            <NavLink
              to="/doctor-appointments"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.appointment_icon} alt="Appointments Icon" />
              <span className="hidden md:inline">Appointments</span>
              {appointments.filter(a => a.docId === currentDoctorId).length > 0 && (
                <span className="hidden md:inline-block ml-auto bg-[#f2994a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs min-w-[22px] text-center">
                  {formatBadge(appointments.filter(a => a.docId === currentDoctorId).length)}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/doctor-schedule"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.list_icon} alt="Schedule Icon" />
              <span className="hidden md:inline">My Schedule</span>
            </NavLink>

            <NavLink
              to="/doctor-profile"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.people_icon} alt="Profile Icon" />
              <span className="hidden md:inline">Profile</span>
            </NavLink>
          </ul>
        )}

        {/* Receptionist Panel Side Menu */}
        {receptionistToken && (
          <ul className="flex flex-col gap-1.5 text-[15px]">
            <NavLink
              to="/receptionist-dashboard"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.home_icon} alt="Dashboard Icon" />
              <span className="hidden md:inline">Dashboard</span>
            </NavLink>
          </ul>
        )}

        {/* Accountant Panel Side Menu */}
        {accountantToken && (
          <ul className="flex flex-col gap-1.5 text-[15px]">
            <NavLink
              to="/accountant-dashboard"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.home_icon} alt="Dashboard Icon" />
              <span className="hidden md:inline">Dashboard</span>
            </NavLink>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
