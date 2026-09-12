import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminContext } from "./context/AdminContext";
import { DoctorContext } from "./context/DoctorContext";
import { AppContext } from "./context/AppContext";

// Shared Elements
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";

// Admin Panel Pages
import AdminDashboard from "./pages/Admin/Dashboard";
import AllAppointments from "./pages/Admin/AllAppointments";
import AddDoctor from "./pages/Admin/AddDoctor";
import DoctorsList from "./pages/Admin/DoctorsList";
import Receptionist from "./pages/Admin/Receptionist";
import Accountant from "./pages/Admin/Accountant";
import PatientDirectory from "./pages/Admin/PatientDirectory";
import AdminComplaints from "./pages/Admin/AdminComplaints";
import AdminReports from "./pages/Admin/AdminReports";

// Doctor Panel Pages
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import DoctorAppointments from "./pages/Doctor/DoctorAppointments";
import DoctorProfile from "./pages/Doctor/DoctorProfile";
import DoctorSchedule from "./pages/Doctor/DoctorSchedule";

// Role Dashboard Pages
import ReceptionistDashboard from "./pages/Receptionist/ReceptionistDashboard";
import AccountantDashboard from "./pages/Accountant/AccountantDashboard";

import AdminFeedbackModeration from "./pages/admin/AdminFeedbackModeration";

const App = () => {
  const { adminToken } = useContext(AdminContext);
  const { doctorToken } = useContext(DoctorContext);
  const { receptionistToken, accountantToken } = useContext(AppContext);

  // Auth Guard: If no user is signed in, force rendering the Login panel
  if (!adminToken && !doctorToken && !receptionistToken && !accountantToken) {
    return <Login />;
  }

  return (
    <div className="bg-slate-50 h-screen text-slate-800 flex font-sans overflow-hidden">
      {/* Persistent Side Menu on the left, spanning top to bottom */}
      <Sidebar />

      {/* Content wrapper on the right */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />

        {/* Action Page Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 flex justify-center items-start h-full">
          <Routes>
            {/* Admin Dedicated Routes */}
            {adminToken && (
              <>
                <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/all-appointments" element={<AllAppointments />} />
                <Route path="/add-doctor" element={<AddDoctor />} />
                <Route path="/doctors-list" element={<DoctorsList />} />
                <Route path="/feedback-moderation" element={<AdminFeedbackModeration />} />
                <Route path="/receptionist" element={<Receptionist />} />
                <Route path="/accountant" element={<Accountant />} />
                <Route path="/patients" element={<PatientDirectory />} />
                <Route path="/complaints" element={<AdminComplaints />} />
                <Route path="/reports" element={<AdminReports />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
              </>
            )}


            {/* Doctor Dedicated Routes */}
            {doctorToken && (
              <>
                <Route path="/" element={<Navigate to="/doctor-dashboard" replace />} />
                <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                <Route path="/doctor-appointments" element={<DoctorAppointments />} />
                <Route path="/doctor-schedule" element={<DoctorSchedule />} />
                <Route path="/doctor-profile" element={<DoctorProfile />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/doctor-dashboard" replace />} />
              </>
            )}

            {/* Receptionist Dedicated Routes */}
            {receptionistToken && (
              <>
                <Route path="/" element={<Navigate to="/receptionist-dashboard" replace />} />
                <Route path="/receptionist-dashboard" element={<ReceptionistDashboard />} />
                <Route path="/patients" element={<PatientDirectory />} />
                <Route path="/reports" element={<AdminReports />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/receptionist-dashboard" replace />} />
              </>
            )}

            {/* Accountant Dedicated Routes */}
            {accountantToken && (
              <>
                <Route path="/" element={<Navigate to="/accountant-dashboard" replace />} />
                <Route path="/accountant-dashboard" element={<AccountantDashboard />} />
                <Route path="/reports" element={<AdminReports />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/accountant-dashboard" replace />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;