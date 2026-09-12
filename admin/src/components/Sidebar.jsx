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
              to="/feedback-moderation"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <svg className="w-5 h-5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="hidden md:inline">Feedback Moderation</span>
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

            <NavLink
              to="/patients"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.patients_icon} alt="Patients Icon" />
              <span className="hidden md:inline">Patients</span>
            </NavLink>

            <NavLink
              to="/complaints"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <svg className="w-5 h-5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="hidden md:inline">Complaints</span>
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <svg className="w-5 h-5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden md:inline">Reports & Analytics</span>
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
              <img className="w-5 h-5 object-contain" src={assets.appointments_icon} alt="Appointments Icon" />
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

            <NavLink
              to="/patients"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <img className="w-5 h-5 object-contain" src={assets.patients_icon} alt="Patients Icon" />
              <span className="hidden md:inline">Patients</span>
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <svg className="w-5 h-5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden md:inline">Reports</span>
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

            <NavLink
              to="/reports"
              className={({ isActive }) =>
                isActive ? activeStyleClass : inactiveStyleClass
              }
            >
              <svg className="w-5 h-5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden md:inline">Reports</span>
            </NavLink>
          </ul>
        )}
      </div>

      {/* Network Nodes Watermark at the bottom - Fixed background */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none z-0 select-none hidden md:block">
        <svg className="w-full h-auto text-white opacity-[0.08]" viewBox="0 0 200 200" fill="currentColor">
          {/* Main big node at the bottom left */}
          <circle cx="50" cy="180" r="30" stroke="currentColor" strokeWidth="6" fill="none" />
          {/* Connector lines branching out */}
          <line x1="50" y1="150" x2="50" y2="80" stroke="currentColor" strokeWidth="4" />
          <line x1="71" y1="159" x2="140" y2="90" stroke="currentColor" strokeWidth="4" />
          <line x1="80" y1="180" x2="170" y2="180" stroke="currentColor" strokeWidth="4" />
          {/* Branch nodes */}
          <circle cx="50" cy="70" r="14" stroke="currentColor" strokeWidth="4" fill="none" />
          <circle cx="150" cy="80" r="18" stroke="currentColor" strokeWidth="4" fill="none" />
          <circle cx="180" cy="180" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          {/* Secondary smaller branches */}
          <line x1="150" y1="62" x2="150" y2="30" stroke="currentColor" strokeWidth="3" />
          <circle cx="150" cy="22" r="8" stroke="currentColor" strokeWidth="3" fill="none" />
        </svg>
      </div>
    </div>
  );
};

export default Sidebar;
