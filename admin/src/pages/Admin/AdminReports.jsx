import React, { useState, useEffect, useContext, useMemo } from "react";
import { AppContext } from "../../context/AppContext";
import {
  getAppointmentReportAPI,
  getFinancialReportAPI,
  getAuditLogsAPI,
  getAllPatientsAPI,
  getReceptionistsAPI,
  getAccountantsAPI,
  getDoctors
} from "../../services/api";

const AdminReports = () => {
  const { doctors, currencySymbol } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("appointments"); // 'appointments' | 'financial' | 'audit' | 'users'

  // ============================
  // Appointment Report State
  // ============================
  const [apptFilters, setApptFilters] = useState({
    startDate: "",
    endDate: "",
    doctorId: "all",
    speciality: "all",
    status: "all"
  });
  const [apptData, setApptData] = useState({ summary: {}, appointments: [] });
  const [loadingAppt, setLoadingAppt] = useState(false);
  const [apptRowsPerPage, setApptRowsPerPage] = useState(10);
  const [apptCurrentPage, setApptCurrentPage] = useState(1);

  const uniqueSpecialities = useMemo(() => {
    const specs = new Set();
    doctors.forEach(d => {
      if (d.speciality) specs.add(d.speciality);
      if (d.specialization) specs.add(d.specialization);
    });
    return Array.from(specs).sort();
  }, [doctors]);

  const loadAppointmentReports = async (overrideFilters = null) => {
    try {
      setLoadingAppt(true);
      
      // Defensively check if overrideFilters is a React synthetic event (has nativeEvent or preventDefault)
      let filtersToUse = overrideFilters;
      if (!filtersToUse || typeof filtersToUse.preventDefault === 'function' || filtersToUse.nativeEvent) {
        filtersToUse = apptFilters;
      }
      
      const res = await getAppointmentReportAPI(filtersToUse);
      if (res.success) {
        setApptData({
          summary: res.summary || {},
          appointments: res.appointments || []
        });
        setApptCurrentPage(1); // Reset to first page when filtering
      }
    } catch (err) {
      console.error("Error loading appointment report:", err);
    } finally {
      setLoadingAppt(false);
    }
  };

  const setDatePreset = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'today') {
      // already today
    } else if (preset === 'week') {
      const first = today.getDate() - today.getDay();
      start = new Date(today.setDate(first));
      end = new Date(start);
      end.setDate(end.getDate() + 6);
    } else if (preset === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (preset === 'year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    const newFilters = { ...apptFilters, startDate: startStr, endDate: endStr };
    setApptFilters(newFilters);
    loadAppointmentReports(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = { startDate: "", endDate: "", doctorId: "all", speciality: "all", status: "all" };
    setApptFilters(emptyFilters);
    loadAppointmentReports(emptyFilters);
  };

  // Pagination Logic for Appointments
  const filteredAppointments = useMemo(() => {
    let result = [...apptData.appointments];
    if (apptFilters.speciality && apptFilters.speciality !== "all") {
      result = result.filter(a => a.specialization === apptFilters.speciality || a.speciality === apptFilters.speciality);
    }
    return result;
  }, [apptData.appointments, apptFilters.speciality]);

  const totalApptPages = Math.ceil(filteredAppointments.length / apptRowsPerPage) || 1;
  const paginatedAppointments = filteredAppointments.slice(
    (apptCurrentPage - 1) * apptRowsPerPage,
    apptCurrentPage * apptRowsPerPage
  );

  // ============================
  // Financial Report State
  // ============================
  const [finFilters, setFinFilters] = useState({
    startDate: "",
    endDate: ""
  });
  const [finData, setFinData] = useState({ summary: {}, paymentMethods: [], doctorRevenue: [] });
  const [loadingFin, setLoadingFin] = useState(false);

  const loadFinancialReports = async () => {
    try {
      setLoadingFin(true);
      const res = await getFinancialReportAPI(finFilters);
      if (res.success) {
        setFinData({
          summary: res.summary || {},
          paymentMethods: res.paymentMethods || [],
          doctorRevenue: res.doctorRevenue || []
        });
      }
    } catch (err) {
      console.error("Error loading financial report:", err);
    } finally {
      setLoadingFin(false);
    }
  };

  // ============================
  // Audit Logs State
  // ============================
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const res = await getAuditLogsAPI({ action: auditActionFilter, limit: 150 });
      if (res.success) {
        setAuditLogs(res.logs || []);
        setTotalLogs(res.total || 0);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // ============================
  // System Users List State
  // ============================
  const [systemUsers, setSystemUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const filteredSystemUsers = useMemo(() => {
    if (userRoleFilter === "all") return systemUsers;
    return systemUsers.filter(u => u.role.toLowerCase() === userRoleFilter.toLowerCase());
  }, [systemUsers, userRoleFilter]);

  const loadSystemUsers = async () => {
    setLoadingUsers(true);
    try {
      // We will pretend there's an endpoint or just fetch them parallelly
      const [docRes, patRes, recRes, accRes] = await Promise.all([
        getDoctors(),
        getAllPatientsAPI({ limit: 1000 }),
        getReceptionistsAPI(),
        getAccountantsAPI()
      ]);

      const usersList = [];

      // Add Admin manually since there is no admin listing API in this scope
      usersList.push({
        id: "admin-1",
        name: "PrimeHeal Admin",
        email: "admin@primeheal.com",
        phone: "N/A",
        role: "Admin",
        joinedDate: "System Default"
      });

      if (docRes.success && docRes.doctors) {
        docRes.doctors.forEach(d => {
          usersList.push({
            id: d._id,
            name: d.name,
            email: d.email,
            phone: d.phone || "N/A",
            role: "Doctor",
            joinedDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "N/A"
          });
        });
      }

      if (patRes.success && patRes.patients) {
        patRes.patients.forEach(p => {
          usersList.push({
            id: p._id,
            name: p.name,
            email: p.email,
            phone: p.phone || "N/A",
            role: "Patient",
            joinedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "N/A"
          });
        });
      }

      if (recRes.success && recRes.receptionists) {
        recRes.receptionists.forEach(r => {
          usersList.push({
            id: r._id,
            name: r.name,
            email: r.email,
            phone: r.phone || "N/A",
            role: "Receptionist",
            joinedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "N/A"
          });
        });
      }

      if (accRes.success && accRes.accountants) {
        accRes.accountants.forEach(a => {
          usersList.push({
            id: a._id,
            name: a.name,
            email: a.email,
            phone: a.phone || "N/A",
            role: "Accountant",
            joinedDate: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "N/A"
          });
        });
      }

      setSystemUsers(usersList);
    } catch (err) {
      console.error("Error loading system users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "appointments") loadAppointmentReports();
    else if (activeTab === "financial") loadFinancialReports();
    else if (activeTab === "audit") loadAuditLogs();
    else if (activeTab === "users") loadSystemUsers();
  }, [activeTab]);

  // ============================
  // Exports
  // ============================
  const exportAppointmentsCSV = () => {
    if (filteredAppointments.length === 0) {
      alert("No appointment data available to export.");
      return;
    }
    const headers = ["AppointmentID", "PatientName", "PatientEmail", "PatientPhone", "DoctorName", "Specialization", "Date", "Time", "Status", "PaymentStatus", "TotalFee"];
    const rows = filteredAppointments.map(a => [
      a.appointmentID,
      `"${(a.patientName || '').replace(/"/g, '""')}"`,
      `"${(a.patientEmail || '').replace(/"/g, '""')}"`,
      `"${(a.patientPhone || '').replace(/"/g, '""')}"`,
      `"${(a.doctorName || '').replace(/"/g, '""')}"`,
      `"${(a.specialization || a.speciality || '').replace(/"/g, '""')}"`,
      a.appointmentDate,
      a.appointmentTime,
      a.status,
      a.paymentStatus,
      a.totalCharge
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `primeheal_appointment_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFinancialCSV = () => {
    if (finData.doctorRevenue.length === 0) {
      alert("No financial data available to export.");
      return;
    }
    const headers = ["DoctorName", "Specialization", "TotalAppointments", "RevenueGenerated"];
    const rows = finData.doctorRevenue.map(d => [
      `"${(d.doctorName || '').replace(/"/g, '""')}"`,
      `"${(d.specialization || '').replace(/"/g, '""')}"`,
      d.totalAppointments,
      d.revenueGenerated
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `primeheal_financial_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSystemUsersCSV = () => {
    if (filteredSystemUsers.length === 0) {
      alert("No users data available to export.");
      return;
    }
    const headers = ["Name", "Email", "Phone", "Role", "JoinedDate"];
    const rows = filteredSystemUsers.map(u => [
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.phone || '').replace(/"/g, '""')}"`,
      u.role,
      u.joinedDate
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `primeheal_system_users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="m-5 sm:m-8 w-full max-w-[100%] flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hospital Analytics & Reports</h2>
          <p className="text-sm text-gray-500 mt-1">
            Clinical reporting, users, financials, and security audits.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-semibold overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "users" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            System Users
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "appointments" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "financial" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Financials
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === "audit" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* ================= TAB 0: SYSTEM USERS REPORT ================= */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">System Users Directory</h3>
              <p className="text-xs text-gray-500 mt-0.5">List of all active system users by role.</p>
            </div>
            <div className="flex gap-3 items-center">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none bg-white"
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Doctor">Doctor</option>
                <option value="Patient">Patient</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Accountant">Accountant</option>
              </select>
              <button
                onClick={exportSystemUsersCSV}
                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-xs hover:opacity-90 transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export List
              </button>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Contact Info</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-400">Loading system users...</td>
                    </tr>
                  ) : filteredSystemUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-400">No users found.</td>
                    </tr>
                  ) : (
                    filteredSystemUsers.map((u, i) => (
                      <tr key={u.id + i} className="hover:bg-slate-50/40">
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900 text-sm">
                          {u.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                            u.role === 'Admin' ? 'bg-red-50 text-red-600 border-red-100' :
                            u.role === 'Doctor' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            u.role === 'Patient' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <p>{u.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{u.phone}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.joinedDate}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 1: APPOINTMENTS REPORT ================= */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs flex flex-col gap-4">
            
            {/* Quick Presets */}
            <div className="flex gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase self-center mr-2">Presets:</span>
              <button onClick={() => setDatePreset('today')} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs rounded-md font-semibold transition-colors">Daily</button>
              <button onClick={() => setDatePreset('week')} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs rounded-md font-semibold transition-colors">Weekly</button>
              <button onClick={() => setDatePreset('month')} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs rounded-md font-semibold transition-colors">Monthly</button>
              <button onClick={() => setDatePreset('year')} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs rounded-md font-semibold transition-colors">Yearly</button>
              <button onClick={handleClearFilters} className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider select-none bg-rose-600 hover:bg-rose-700 text-white transition-colors uppercase ml-auto">Clear Filters</button>
            </div>

            {/* Filter Form */}
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">From Date</label>
                <input
                  type="date"
                  value={apptFilters.startDate}
                  onChange={(e) => setApptFilters({ ...apptFilters, startDate: e.target.value })}
                  className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">To Date</label>
                <input
                  type="date"
                  value={apptFilters.endDate}
                  onChange={(e) => setApptFilters({ ...apptFilters, endDate: e.target.value })}
                  className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Doctor</label>
                <select
                  value={apptFilters.doctorId}
                  onChange={(e) => setApptFilters({ ...apptFilters, doctorId: e.target.value })}
                  className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-primary bg-white"
                >
                  <option value="all">All Doctors</option>
                  {doctors.map((d) => (
                    <option key={d._id || d.doctorID} value={d.doctorID || d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Speciality</label>
                <select
                  value={apptFilters.speciality}
                  onChange={(e) => setApptFilters({ ...apptFilters, speciality: e.target.value })}
                  className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-primary bg-white max-w-[150px]"
                >
                  <option value="all">All Specialities</option>
                  {uniqueSpecialities.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Status</label>
                <select
                  value={apptFilters.status}
                  onChange={(e) => setApptFilters({ ...apptFilters, status: e.target.value })}
                  className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-primary bg-white"
                >
                  <option value="all">All</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={(e) => { e.preventDefault(); loadAppointmentReports(apptFilters); }}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold tracking-wider select-none bg-emerald-600 hover:bg-emerald-700 text-white transition-colors uppercase shadow-sm"
                >
                  Filter
                </button>
                <button
                  onClick={exportAppointmentsCSV}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold tracking-wider select-none bg-[#187595] hover:bg-[#135c75] text-white transition-colors uppercase gap-1.5 shadow-sm"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs overflow-hidden">
            {/* Pagination Controls Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold">Rows per page:</span>
                <select 
                  value={apptRowsPerPage} 
                  onChange={(e) => { setApptRowsPerPage(Number(e.target.value)); setApptCurrentPage(1); }}
                  className="text-xs border border-zinc-200 rounded px-2 py-1 bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 font-semibold">
                  Page {apptCurrentPage} of {totalApptPages}
                </span>
                <div className="flex gap-1">
                  <button 
                    disabled={apptCurrentPage === 1}
                    onClick={() => setApptCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1 rounded hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button 
                    disabled={apptCurrentPage === totalApptPages}
                    onClick={() => setApptCurrentPage(prev => Math.min(totalApptPages, prev + 1))}
                    className="p-1 rounded hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Charge</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {loadingAppt ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-400">Loading appointment report...</td>
                    </tr>
                  ) : paginatedAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-400">No appointments found.</td>
                    </tr>
                  ) : (
                    paginatedAppointments.map((a) => (
                      <tr key={a.appointmentID} className="hover:bg-slate-50/40">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-bold text-gray-900">{a.patientName}</p>
                          <p className="text-xs text-gray-400">{a.patientPhone || a.patientEmail}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">{a.doctorName}</p>
                          <p className="text-xs text-gray-400">{a.specialization || a.speciality}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                          <p className="font-semibold">{a.appointmentDate}</p>
                          <p className="text-gray-400">{a.appointmentTime}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {currencySymbol}{Number(a.totalCharge || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider select-none text-white uppercase min-w-[90px] ${
                              a.status === "Completed"
                                ? "bg-emerald-600"
                                : a.status === "Cancelled"
                                ? "bg-rose-600"
                                : "bg-amber-500"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: FINANCIAL REPORT ================= */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">From Date</label>
              <input
                type="date"
                value={finFilters.startDate}
                onChange={(e) => setFinFilters({ ...finFilters, startDate: e.target.value })}
                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">To Date</label>
              <input
                type="date"
                value={finFilters.endDate}
                onChange={(e) => setFinFilters({ ...finFilters, endDate: e.target.value })}
                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={loadFinancialReports}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-xs hover:opacity-90 transition-all"
              >
                Refresh
              </button>
              <button
                onClick={exportFinancialCSV}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold tracking-wider select-none bg-[#187595] hover:bg-[#135c75] text-white transition-colors uppercase gap-1.5 shadow-sm"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
              <p className="text-2xl font-bold text-gray-900">
                {currencySymbol}{Number(finData.summary?.totalCollected || 0).toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-gray-400 uppercase">Realized Revenue</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
              <p className="text-2xl font-bold text-gray-900">
                {currencySymbol}{Number(finData.summary?.pendingReceivables || 0).toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-gray-400 uppercase">Outstanding</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
              <p className="text-2xl font-bold text-gray-900">
                {currencySymbol}{Number(finData.summary?.cancelledVolume || 0).toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-gray-400 uppercase">Cancelled</p>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Doctor Performance</h3>
            <table className="min-w-full divide-y divide-zinc-100">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Consultant Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Specialization</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Visits Handled</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white text-sm">
                {finData.doctorRevenue.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40">
                    <td className="px-6 py-4 font-bold text-gray-900">{doc.doctorName}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.specialization}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{doc.totalAppointments}</td>
                    <td className="px-6 py-4 text-right font-extrabold text-primary">
                      {currencySymbol}{Number(doc.revenueGenerated || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: AUDIT TRAIL ================= */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">Audit Logs</h3>
              <p className="text-xs text-gray-400">Total events: {totalLogs}</p>
            </div>
            <div className="flex gap-3">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none bg-white"
              >
                <option value="all">All Actions</option>
                <option value="login">Logins</option>
                <option value="appointment">Appointments</option>
              </select>
              <button
                onClick={loadAuditLogs}
                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-100">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {auditLogs.map((log) => (
                  <tr key={log.logID} className="hover:bg-slate-50/40 text-xs">
                    <td className="px-6 py-3 text-gray-500 font-mono">{String(log.createdAt).substring(0, 19)}</td>
                    <td className="px-6 py-3 font-bold text-gray-900">{log.actorName}</td>
                    <td className="px-6 py-3"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{log.action}</span></td>
                    <td className="px-6 py-3 font-mono text-gray-600">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
