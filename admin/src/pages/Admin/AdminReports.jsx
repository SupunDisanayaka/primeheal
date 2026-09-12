import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import {
  getAppointmentReportAPI,
  getFinancialReportAPI,
  getAuditLogsAPI
} from "../../services/api";

const AdminReports = () => {
  const { doctors, currencySymbol } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("appointments"); // 'appointments' | 'financial' | 'audit'

  // Appointment Report State
  const [apptFilters, setApptFilters] = useState({
    startDate: "",
    endDate: "",
    doctorId: "all",
    status: "all"
  });
  const [apptData, setApptData] = useState({ summary: {}, appointments: [] });
  const [loadingAppt, setLoadingAppt] = useState(false);

  // Financial Report State
  const [finFilters, setFinFilters] = useState({
    startDate: "",
    endDate: ""
  });
  const [finData, setFinData] = useState({ summary: {}, paymentMethods: [], doctorRevenue: [] });
  const [loadingFin, setLoadingFin] = useState(false);

  // Audit Logs State
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Load Appointments Report
  const loadAppointmentReports = async () => {
    try {
      setLoadingAppt(true);
      const res = await getAppointmentReportAPI(apptFilters);
      if (res.success) {
        setApptData({
          summary: res.summary || {},
          appointments: res.appointments || []
        });
      }
    } catch (err) {
      console.error("Error loading appointment report:", err);
    } finally {
      setLoadingAppt(false);
    }
  };

  // Load Financial Report
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

  // Load Audit Logs
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

  useEffect(() => {
    if (activeTab === "appointments") loadAppointmentReports();
    else if (activeTab === "financial") loadFinancialReports();
    else if (activeTab === "audit") loadAuditLogs();
  }, [activeTab]);

  // CSV Export for Appointments Report
  const exportAppointmentsCSV = () => {
    if (apptData.appointments.length === 0) {
      alert("No appointment data available to export.");
      return;
    }
    const headers = ["AppointmentID", "PatientName", "PatientEmail", "PatientPhone", "DoctorName", "Specialization", "Date", "Time", "Status", "PaymentStatus", "TotalFee"];
    const rows = apptData.appointments.map(a => [
      a.appointmentID,
      `"${(a.patientName || '').replace(/"/g, '""')}"`,
      `"${(a.patientEmail || '').replace(/"/g, '""')}"`,
      `"${(a.patientPhone || '').replace(/"/g, '""')}"`,
      `"${(a.doctorName || '').replace(/"/g, '""')}"`,
      `"${(a.specialization || '').replace(/"/g, '""')}"`,
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

  // CSV Export for Financial Report
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

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hospital Analytics, Reports & Audit</h2>
          <p className="text-sm text-gray-500 mt-1">
            Clinical appointment reporting, financial ledgers, and user security audit trails.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === "appointments" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Appointment Reports
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === "financial" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Financial Reports
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === "audit" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Security Audit Trail
          </button>
        </div>
      </div>

      {/* ================= TAB 1: APPOINTMENTS REPORT ================= */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs flex flex-wrap gap-4 items-end">
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
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Doctor Consultant</label>
              <select
                value={apptFilters.doctorId}
                onChange={(e) => setApptFilters({ ...apptFilters, doctorId: e.target.value })}
                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-primary bg-white"
              >
                <option value="all">All Doctors</option>
                {doctors.map((d) => (
                  <option key={d._id || d.doctorID} value={d.doctorID || d._id}>
                    {d.name} ({d.speciality || d.specialization})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Visit Status</label>
              <select
                value={apptFilters.status}
                onChange={(e) => setApptFilters({ ...apptFilters, status: e.target.value })}
                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-primary bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending / Checked In</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={loadAppointmentReports}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-xs hover:opacity-90 transition-all"
              >
                Filter Report
              </button>
              <button
                onClick={exportAppointmentsCSV}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-gray-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-gray-800 text-xs font-bold rounded-lg transition-all"
                title="Print Report"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs">
              <p className="text-2xl font-bold text-gray-900">{apptData.summary?.totalCount || 0}</p>
              <p className="text-xs font-semibold text-gray-400 uppercase mt-1">Total Appointments</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs">
              <p className="text-2xl font-bold text-emerald-600">{apptData.summary?.completedCount || 0}</p>
              <p className="text-xs font-semibold text-gray-400 uppercase mt-1">Completed Visits</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs">
              <p className="text-2xl font-bold text-amber-600">{apptData.summary?.pendingCount || 0}</p>
              <p className="text-xs font-semibold text-gray-400 uppercase mt-1">Pending / Checked In</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs">
              <p className="text-2xl font-bold text-primary">
                {currencySymbol}{Number(apptData.summary?.totalCharges || 0).toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-gray-400 uppercase mt-1">Fee Volume</p>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs overflow-hidden">
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
                  ) : apptData.appointments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-400">No appointments found matching selected filters.</td>
                    </tr>
                  ) : (
                    apptData.appointments.map((a) => (
                      <tr key={a.appointmentID} className="hover:bg-slate-50/40">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-bold text-gray-900">{a.patientName}</p>
                          <p className="text-xs text-gray-400">{a.patientPhone || a.patientEmail}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">{a.doctorName}</p>
                          <p className="text-xs text-gray-400">{a.specialization}</p>
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
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              a.status === "Completed"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : a.status === "Cancelled"
                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                : "bg-amber-50 text-amber-600 border border-amber-100"
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
          {/* Financial Filter Bar */}
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
                Refresh Financials
              </button>
              <button
                onClick={exportFinancialCSV}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-gray-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Doctor Earnings CSV
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {currencySymbol}{Number(finData.summary?.totalCollected || 0).toFixed(2)}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Realized Revenue</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {currencySymbol}{Number(finData.summary?.pendingReceivables || 0).toFixed(2)}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Outstanding Receivables</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {currencySymbol}{Number(finData.summary?.cancelledVolume || 0).toFixed(2)}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Cancelled / Uncollected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Earnings Breakdown Table */}
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Doctor Performance & Revenue Generation</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Consultant Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Specialization</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Visits Handled</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Revenue Realized</th>
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
        </div>
      )}

      {/* ================= TAB 3: SECURITY & AUDIT TRAIL ================= */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {/* Audit Controls */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">User Activity & Security Audit Logs</h3>
              <p className="text-xs text-gray-400">Total recorded audit events: {totalLogs}</p>
            </div>

            <div className="flex gap-3">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-primary bg-white cursor-pointer"
              >
                <option value="all">All Audit Actions</option>
                <option value="login">Logins</option>
                <option value="register">Registrations</option>
                <option value="appointment">Appointments</option>
                <option value="payment">Payments</option>
                <option value="update">Updates</option>
              </select>

              <button
                onClick={loadAuditLogs}
                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-xs hover:opacity-90"
              >
                Refresh Logs
              </button>
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Actor</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Action Performed</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Client Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-400">Loading audit trail...</td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-400">No audit activity matching filter.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.logID} className="hover:bg-slate-50/40 text-xs">
                        <td className="px-6 py-3.5 whitespace-nowrap text-gray-500 font-mono">
                          {log.createdAt ? String(log.createdAt).replace("T", " ").substring(0, 19) : "N/A"}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <p className="font-bold text-gray-900">{log.actorName || "System / Guest"}</p>
                          <p className="text-[10px] text-gray-400">{log.actorEmail || ""}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap font-mono text-gray-600">
                          {log.ipAddress || "localhost"}
                        </td>
                        <td className="px-6 py-3.5 max-w-xs truncate text-gray-400" title={log.userAgent}>
                          {log.userAgent || "Browser Client"}
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
    </div>
  );
};

export default AdminReports;
