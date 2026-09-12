import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import {
  collectCounterPaymentAPI,
  issueRefundAPI,
  getFinancialSummaryAPI,
  getAllInvoicesAPI,
  recreateInvoiceAPI
} from "../../services/api";

const AccountantDashboard = () => {
  const { appointments, setAppointments, doctors, currencySymbol, fetchAllAppointments } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("ledger"); // 'ledger' | 'invoices'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All', 'Paid', 'Unpaid', 'Cancelled'
  const [financialData, setFinancialData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Recreate Modal state
  const [recreateModalOpen, setRecreateModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [recreateForm, setRecreateForm] = useState({
    subtotal: "",
    tax: "0",
    discount: "0",
    dueDate: ""
  });
  const [savingRecreate, setSavingRecreate] = useState(false);

  // Invoice Print Preview modal
  const [previewInvoice, setPreviewInvoice] = useState(null);

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

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const res = await getAllInvoicesAPI();
      if (res.success) {
        setInvoices(res.invoices || []);
      }
    } catch (err) {
      console.error("Error loading invoices:", err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    loadFinancialSummary();
    loadInvoices();
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
        alert(res.message || "Payment collected and invoice logged successfully.");
        if (fetchAllAppointments) fetchAllAppointments();
        loadFinancialSummary();
        loadInvoices();
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
        loadInvoices();
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

  const openRecreateModal = (apt) => {
    setSelectedApt(apt);
    const amount = Number(apt.amount || apt.fees || apt.fee || apt.totalAmount || 0);
    setRecreateForm({
      subtotal: amount.toString(),
      tax: "0",
      discount: "0",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    });
    setRecreateModalOpen(true);
  };

  const handleRecreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApt) return;
    const aptId = selectedApt._id || selectedApt.appointmentId || selectedApt.appointmentID;
    try {
      setSavingRecreate(true);
      const res = await recreateInvoiceAPI({
        appointmentId: aptId,
        subtotal: parseFloat(recreateForm.subtotal) || 0,
        tax: parseFloat(recreateForm.tax) || 0,
        discount: parseFloat(recreateForm.discount) || 0,
        dueDate: recreateForm.dueDate
      });
      if (res.success) {
        alert(res.message || "Invoice recreated successfully!");
        setRecreateModalOpen(false);
        loadInvoices();
        loadFinancialSummary();
      } else {
        alert(res.message || "Could not recreate invoice.");
      }
    } catch (err) {
      console.error("Recreate invoice error:", err);
      alert(err.response?.data?.message || "Failed to recreate invoice.");
    } finally {
      setSavingRecreate(false);
    }
  };

  // Metrics Calculations
  const completedApts = appointments.filter((a) => a.status === "Completed" || a.status === "Paid");
  const unpaidApts = appointments.filter((a) => a.status === "Pending" || a.status === "Checked In");

  const totalRevenue = financialData ? financialData.totalRevenue : completedApts.reduce((sum, item) => sum + (Number(item.amount || item.fees || 0)), 0);
  const pendingRevenue = financialData ? financialData.pendingRevenue : unpaidApts.reduce((sum, item) => sum + (Number(item.amount || item.fees || 0)), 0);
  const totalInvoices = financialData ? financialData.totalInvoices : (invoices.length > 0 ? invoices.length : appointments.length);
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

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const pName = inv.patientName || "";
    const pCode = inv.patientCode || "";
    const invNum = inv.invoiceNumber || "";
    const matches =
      pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invNum.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "Paid") matchesStatus = inv.status === "paid";
    else if (statusFilter === "Unpaid") matchesStatus = inv.status === "issued" || inv.status === "pending";
    else if (statusFilter === "Cancelled") matchesStatus = inv.status === "cancelled";

    return matches && matchesStatus;
  });

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accountant & Billing Central</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time revenue monitoring, counter payment collections, and invoice regeneration.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "ledger" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Billing Log & Counter Cashier
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "invoices" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Invoice Registry & Recreation
          </button>
        </div>
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
              {currencySymbol}{Number(totalRevenue).toFixed(2)}
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoices Logged</p>
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
              {currencySymbol}{Number(pendingRevenue).toFixed(2)}
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unpaid Appointments</p>
          </div>
        </div>
      </div>

      {/* Main Ledger & Invoices grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 columns: Tab Content */}
        <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-2xl shadow-xs">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-5 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === "ledger" ? "Counter Cashier & Appointment Billing" : "Formal Invoices & Recreation"}
              </h3>
            </div>

            {/* Filter controls */}
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder={activeTab === "ledger" ? "Search patient/doctor..." : "Search patient/invoice#..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-zinc-200 outline-none rounded-lg px-3 py-1.5 text-xs w-full sm:w-44 focus:border-primary"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-zinc-200 outline-none rounded-lg px-2 py-1.5 text-xs text-gray-600 bg-white cursor-pointer focus:border-primary"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid / Issued</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {activeTab === "ledger" ? (
            /* TAB 1: Billing Log & Cashier */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Cashier Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">
                        No matching appointments found.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => {
                      const aptId = apt._id || apt.appointmentId || apt.appointmentID;
                      const isPaid = apt.status === "Completed" || apt.status === "Paid";
                      const isCancelled = apt.status === "Cancelled";

                      return (
                        <tr key={aptId} className="hover:bg-slate-50/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-gray-900">{apt.patientName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{apt.patientPhone || apt.patientEmail || "Walk-in"}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <p className="font-medium text-gray-800">{apt.slotDate || apt.appointmentDate}</p>
                            <p className="text-xs text-gray-400">{apt.slotTime || apt.appointmentTime}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {currencySymbol}{Number(apt.amount || apt.fees || apt.fee || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : isCancelled
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : "bg-amber-50 text-amber-600 border border-amber-100"
                              }`}
                            >
                              {isPaid ? "Paid" : isCancelled ? "Cancelled" : "Unpaid"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex items-center justify-center gap-2">
                              {!isPaid && !isCancelled && (
                                <button
                                  disabled={loadingAction}
                                  onClick={() => handleMarkPaid(aptId)}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                                >
                                  Collect Cash
                                </button>
                              )}
                              <button
                                onClick={() => openRecreateModal(apt)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-primary rounded-lg text-xs font-semibold transition-colors"
                                title="Recreate or adjust invoice details"
                              >
                                Recreate Invoice
                              </button>
                              {isPaid && (
                                <button
                                  disabled={loadingAction}
                                  onClick={() => handleRefund(aptId)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                  title="Issue Refund & Cancel"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* TAB 2: Formal Invoice Registry */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue / Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {loadingInvoices ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">
                        Loading invoice ledger...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">
                        No formal invoices registered yet.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.invoiceID} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-gray-900 bg-zinc-100 px-2 py-1 rounded">
                            {inv.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">{inv.patientName}</p>
                          <p className="text-xs text-gray-400">{inv.patientCode || inv.patientEmail}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                          <p className="font-medium text-gray-800">Issued: {inv.issueDate ? String(inv.issueDate).substring(0, 10) : 'N/A'}</p>
                          <p className="text-gray-400">Due: {inv.dueDate ? String(inv.dueDate).substring(0, 10) : 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {currencySymbol}{Number(inv.totalAmount).toFixed(2)}
                          {Number(inv.discount) > 0 && (
                            <span className="block text-[10px] text-emerald-600 font-normal">Discount: -{currencySymbol}{Number(inv.discount).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              inv.status === "paid"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : inv.status === "cancelled"
                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                : "bg-amber-50 text-amber-600 border border-amber-100"
                            }`}
                          >
                            {inv.status ? inv.status.toUpperCase() : "ISSUED"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewInvoice(inv)}
                              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View / Print
                            </button>
                            <button
                              onClick={() => openRecreateModal({ ...inv, appointmentId: inv.appointmentID })}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-primary rounded-lg text-xs font-semibold transition-colors"
                            >
                              Recreate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Doctor Share breakdown: right column */}
        <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs p-6 flex flex-col gap-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Doctor Performance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Summary of billing collected per consultant.</p>
          </div>

          <div className="flex flex-col gap-4">
            {doctorRevenueBreakdown.map((item, index) => {
              const pct = totalRevenue > 0 ? (item.earned / totalRevenue) * 100 : 0;
              return (
                <div key={index} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-800 font-bold">{item.name}</span>
                    <span className="text-gray-900 font-extrabold">{currencySymbol}{Number(item.earned).toFixed(2)}</span>
                  </div>
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

      {/* RECREATE INVOICE MODAL */}
      {recreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-100 animate-in fade-in zoom-in-95">
            <div className="bg-slate-50 px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recreate Invoice</h3>
                <p className="text-xs text-gray-500">Regenerate invoice with adjusted totals without starting over.</p>
              </div>
              <button
                onClick={() => setRecreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRecreateSubmit} className="p-6 space-y-4">
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs">
                <p className="font-semibold text-primary">Appointment Reference:</p>
                <p className="text-gray-700 mt-0.5">
                  Patient: <span className="font-medium">{selectedApt?.patientName || "N/A"}</span>
                </p>
                <p className="text-gray-700">
                  Doctor: <span className="font-medium">{selectedApt?.docName || selectedApt?.doctorName || "Consultant"}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subtotal ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={recreateForm.subtotal}
                  onChange={(e) => setRecreateForm({ ...recreateForm, subtotal: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tax ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={recreateForm.tax}
                    onChange={(e) => setRecreateForm({ ...recreateForm, tax: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Discount ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={recreateForm.discount}
                    onChange={(e) => setRecreateForm({ ...recreateForm, discount: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={recreateForm.dueDate}
                  onChange={(e) => setRecreateForm({ ...recreateForm, dueDate: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-zinc-100 flex justify-between items-center text-sm font-bold text-gray-900">
                <span>Calculated Total:</span>
                <span className="text-primary text-base">
                  {currencySymbol}
                  {Math.max(
                    0,
                    (parseFloat(recreateForm.subtotal) || 0) +
                    (parseFloat(recreateForm.tax) || 0) -
                    (parseFloat(recreateForm.discount) || 0)
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRecreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRecreate}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:opacity-90 rounded-lg shadow-sm"
                >
                  {savingRecreate ? "Recreating..." : "Confirm & Issue New Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE PREVIEW MODAL */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-zinc-100 p-8 animate-in fade-in">
            {/* Action Bar */}
            <div className="flex justify-between items-center pb-6 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-primary tracking-tight">PRIMEHEAL</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">Official Receipt</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print / Download PDF
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Printable Body */}
            <div className="py-6 space-y-6 text-sm text-gray-700">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">Billed To:</h4>
                  <p className="font-semibold text-gray-800">{previewInvoice.patientName}</p>
                  <p className="text-xs text-gray-500">Patient Code: {previewInvoice.patientCode || "N/A"}</p>
                  <p className="text-xs text-gray-500">{previewInvoice.patientEmail || ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-gray-900">INVOICE: #{previewInvoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">Issue Date: {previewInvoice.issueDate ? String(previewInvoice.issueDate).substring(0, 10) : 'N/A'}</p>
                  <p className="text-xs text-gray-500">Due Date: {previewInvoice.dueDate ? String(previewInvoice.dueDate).substring(0, 10) : 'N/A'}</p>
                  <p className="text-xs font-bold text-primary uppercase mt-1">Status: {previewInvoice.status}</p>
                </div>
              </div>

              <table className="w-full text-left border border-zinc-200 rounded-lg overflow-hidden">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-gray-600 uppercase">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-sm">
                  <tr>
                    <td className="p-3">
                      <p className="font-semibold text-gray-800">Medical Consultation Service</p>
                      <p className="text-xs text-gray-500">Attending Consultant: Dr. {previewInvoice.doctorName || 'Hospital Specialist'}</p>
                    </td>
                    <td className="p-3 text-right font-medium text-gray-800">
                      {currencySymbol}{Number(previewInvoice.subtotal).toFixed(2)}
                    </td>
                  </tr>
                  {Number(previewInvoice.tax) > 0 && (
                    <tr>
                      <td className="p-3 text-xs text-gray-600">Hospital Administrative & Service Tax</td>
                      <td className="p-3 text-right text-xs text-gray-600">
                        +{currencySymbol}{Number(previewInvoice.tax).toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {Number(previewInvoice.discount) > 0 && (
                    <tr>
                      <td className="p-3 text-xs text-emerald-600">Special Concession / Health Discount</td>
                      <td className="p-3 text-right text-xs text-emerald-600">
                        -{currencySymbol}{Number(previewInvoice.discount).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-right">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal:</span>
                    <span>{currencySymbol}{Number(previewInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-zinc-200">
                    <span>Total Amount:</span>
                    <span className="text-primary">{currencySymbol}{Number(previewInvoice.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 text-[11px] text-gray-400 text-center">
                PrimeHeal Healthcare System • Thank you for choosing our clinical services.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
