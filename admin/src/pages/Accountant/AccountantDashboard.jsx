import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { collectCounterPaymentAPI, issueRefundAPI, getFinancialSummaryAPI } from "../../services/api";

const AccountantDashboard = () => {
  const { appointments, setAppointments, doctors, currencySymbol, fetchAllAppointments } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All', 'Paid', 'Unpaid', 'Cancelled'
  const [financialData, setFinancialData] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const loadFinancialSummary = async () => {
    try {
      const data = await getFinancialSummaryAPI();
      if (data.success) {
        setFinancialData(data);
      }
    } catch (err) {
      console.error("Error loading financial summary:", err);
    }
  };

  useEffect(() => {
    loadFinancialSummary();
  }, []);

  const handleMarkPaid = async (aptId) => {
    try {
      setLoadingAction(true);
      const targetApt = appointments.find((a) => a._id === aptId || a.appointmentId === aptId);
      const res = await collectCounterPaymentAPI({
        appointmentId: aptId,
        paymentMethod: "Cash",
        amount: targetApt ? (targetApt.amount || targetApt.fees) : undefined
      });
      if (res.success) {
        alert(res.message || "Payment collected successfully.");
        if (fetchAllAppointments) fetchAllAppointments();
        loadFinancialSummary();
      } else {
        alert(res.message || "Collection failed.");
      }
    } catch (err) {
      console.error("Mark paid error:", err);
      setAppointments((prev) =>
        prev.map((apt) => (apt._id === aptId || apt.appointmentId === aptId ? { ...apt, status: "Completed" } : apt))
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRefund = async (aptId) => {
    if (!window.confirm("Refund this transaction? This will mark the appointment as Cancelled.")) return;
    try {
      setLoadingAction(true);
      const res = await issueRefundAPI({ appointmentId: aptId });
      if (res.success) {
        alert(res.message || "Refund issued successfully.");
        if (fetchAllAppointments) fetchAllAppointments();
        loadFinancialSummary();
      } else {
        alert(res.message || "Refund failed.");
      }
    } catch (err) {
      console.error("Refund error:", err);
      setAppointments((prev) =>
        prev.map((apt) => (apt._id === aptId || apt.appointmentId === aptId ? { ...apt, status: "Cancelled" } : apt))
      );
    } finally {
      setLoadingAction(false);
    }
  };

  // Metrics Calculations
  const completedApts = appointments.filter((a) => a.status === "Completed" || a.status === "Paid");
  const unpaidApts = appointments.filter((a) => a.status === "Pending" || a.status === "Checked In");

  const totalRevenue = financialData ? financialData.totalRevenue : completedApts.reduce((sum, item) => sum + (Number(item.amount || item.fees || 0)), 0);
  const pendingRevenue = financialData ? financialData.pendingRevenue : unpaidApts.reduce((sum, item) => sum + (Number(item.amount || item.fees || 0)), 0);
  const totalInvoices = financialData ? financialData.totalInvoices : appointments.length;
  const unpaidCount = financialData ? financialData.unpaidCount : unpaidApts.length;

  // Breakdown of earnings per doctor
  const doctorRevenueBreakdown = (financialData && financialData.doctorRevenueBreakdown)
    ? financialData.doctorRevenueBreakdown
    : doctors.map((doc) => {
        const docApts = appointments.filter((a) => (a.docId === doc._id || a.doctorID === doc.doctorID) && (a.status === "Completed" || a.status === "Paid"));
        const earned = docApts.reduce((sum, a) => sum + Number(a.amount || a.fees || 0), 0);
        return {
          name: doc.name,
          earned,
          count: docApts.length
        };
      });

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    const doc = doctors.find((d) => d._id === apt.docId || d.doctorID === apt.doctorID) || {};

    const patientNameStr = apt.patientName || "";
    const patientPhoneStr = apt.patientPhone || "";
    const matchesSearch =
      patientNameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientPhoneStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.name && doc.name.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === "Paid") {
      matchesStatus = apt.status === "Completed" || apt.status === "Paid";
    } else if (statusFilter === "Unpaid") {
      matchesStatus = apt.status === "Pending" || apt.status === "Checked In";
    } else if (statusFilter === "Cancelled") {
      matchesStatus = apt.status === "Cancelled";
    }

    return matchesSearch && matchesStatus;
  });


  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Accountant Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time financial summaries, patient invoicing, and ledger logs.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {currencySymbol}{totalRevenue}
            </p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Revenue</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
          <div className="p-3 bg-indigo-50 text-primary rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoices Generated</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {currencySymbol}{pendingRevenue}
            </p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Outstanding Balance</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{unpaidCount}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unpaid Invoices</p>
          </div>
        </div>
      </div>

      {/* Main Ledger grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Invoice table: left 2 columns */}
        <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-2xl shadow-xs">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-5 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Billing Log & Transactions</h3>
            </div>

            {/* Filter controls */}
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-zinc-200 outline-none rounded-lg px-3 py-1.5 text-xs w-full sm:w-40 focus:border-primary"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-zinc-200 outline-none rounded-lg px-2 py-1.5 text-xs text-gray-600 bg-white cursor-pointer focus:border-primary"
              >
                <option value="All">All Invoices</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">
                      No matching invoices found.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-gray-900">{apt.patientName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{apt.patientPhone}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <p>{apt.slotDate}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {currencySymbol}{apt.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            apt.status === "Completed"
                              ? "bg-emerald-50 text-emerald-600"
                              : apt.status === "Cancelled"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {apt.status === "Completed" ? "Paid" : apt.status === "Cancelled" ? "Cancelled" : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        {apt.status !== "Completed" && apt.status !== "Cancelled" ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleMarkPaid(apt._id)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => handleRefund(apt._id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                              title="Cancel Invoice"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Clear</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor Share breakdown: right column */}
        <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs p-6 flex flex-col gap-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Doctor Performance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Summary of billing collected per consultant.</p>
          </div>

          <div className="flex flex-col gap-4">
            {doctorRevenueBreakdown.map((item, index) => {
              // Calculate percent of total revenue
              const pct = totalRevenue > 0 ? (item.earned / totalRevenue) * 100 : 0;
              return (
                <div key={index} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-800 font-bold">{item.name}</span>
                    <span className="text-gray-900 font-extrabold">{currencySymbol}{item.earned}</span>
                  </div>
                  {/* Custom css progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(5, pct)}%` }}
                      className="h-full bg-primary rounded-full transition-all duration-500"
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold uppercase">
                    <span>{item.count} appointments</span>
                    <span>{pct.toFixed(0)}% share</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccountantDashboard;
