import React, { useState, useEffect } from "react";
import { getAllComplaintsAdminAPI, updateComplaintStatusAPI } from "../../services/api";

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Edit / Resolution Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    status: "open",
    assignedToAdminID: "",
    resolution: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await getAllComplaintsAdminAPI({
        status: statusFilter,
        type: typeFilter
      });
      if (res.success) {
        setComplaints(res.complaints || []);
        setAdmins(res.admins || []);
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, typeFilter]);

  const openResolutionModal = (complaint) => {
    setSelectedComplaint(complaint);
    setFormState({
      status: complaint.status || "open",
      assignedToAdminID: complaint.assignedToAdminID || "",
      resolution: complaint.resolution || ""
    });
    setModalOpen(true);
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setSubmitting(true);
      const res = await updateComplaintStatusAPI(selectedComplaint.complaintID, {
        status: formState.status,
        assignedToAdminID: formState.assignedToAdminID ? Number(formState.assignedToAdminID) : null,
        resolution: formState.resolution
      });

      if (res.success) {
        alert("Complaint updated successfully!");
        setModalOpen(false);
        fetchComplaints();
      } else {
        alert(res.message || "Failed to update complaint");
      }
    } catch (err) {
      console.error("Update complaint error:", err);
      alert(err.response?.data?.message || "Error updating complaint");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter by search
  const filteredComplaints = complaints.filter((c) => {
    const pName = c.patientName || "";
    const pEmail = c.patientEmail || "";
    const pPhone = c.patientPhone || "";
    const desc = c.description || "";
    const query = searchTerm.toLowerCase();
    return (
      pName.toLowerCase().includes(query) ||
      pEmail.toLowerCase().includes(query) ||
      pPhone.toLowerCase().includes(query) ||
      desc.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Resolved</span>;
      case "in-progress":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-100">In Progress</span>;
      case "closed":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-100">Open</span>;
    }
  };

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hospital Grievance & Complaint Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor incoming patient service concerns, assign hospital staff, and document official resolution actions.
          </p>
        </div>

        <div className="flex gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
            Open: {complaints.filter((c) => c.status === "open").length}
          </span>
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            Investigating: {complaints.filter((c) => c.status === "in-progress").length}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
            Resolved: {complaints.filter((c) => c.status === "resolved").length}
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs overflow-hidden">
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 border-b border-zinc-100 bg-slate-50/30">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search patient, email, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-zinc-200 outline-none rounded-xl px-3.5 py-2 text-xs focus:border-primary bg-white"
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-zinc-200 outline-none rounded-xl px-3 py-2 text-xs text-gray-700 bg-white cursor-pointer focus:border-primary"
            >
              <option value="all">All Categories</option>
              <option value="service">Care & Service</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="staff">Staff Conduct</option>
              <option value="other">Other</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-zinc-200 outline-none rounded-xl px-3 py-2 text-xs text-gray-700 bg-white cursor-pointer focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Info</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type & Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Staff</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-400">
                    Loading complaints register...
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-400">
                    No complaints match your filters.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr key={c.complaintID} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-gray-900">{c.patientName}</p>
                      <p className="text-xs text-gray-400">{c.patientEmail}</p>
                      <p className="text-xs text-gray-400">{c.patientPhone}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-zinc-100 text-gray-700">
                        {c.complaintType}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {c.createdAt ? String(c.createdAt).substring(0, 10) : "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                      {c.resolution && (
                        <p className="text-[11px] text-emerald-700 mt-1 line-clamp-1 italic font-medium">
                          Resolution: {c.resolution}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                      {c.assignedStaffName ? (
                        <span className="font-semibold text-gray-900 bg-indigo-50 text-primary px-2.5 py-1 rounded-lg">
                          {c.assignedStaffName}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <button
                        onClick={() => openResolutionModal(c)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-colors"
                      >
                        Manage & Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESOLUTION & ASSIGNMENT MODAL */}
      {modalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-zinc-100 animate-in fade-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-zinc-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">Manage Complaint #{selectedComplaint.complaintID}</h3>
                <p className="text-xs text-gray-500">Assign staff, advance status, and document resolution findings.</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateComplaint} className="p-6 space-y-4">
              {/* Patient and Complaint Overview */}
              <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100 text-xs space-y-1.5">
                <p className="text-gray-600">
                  <span className="font-bold text-gray-900">Complainant:</span> {selectedComplaint.patientName} ({selectedComplaint.patientEmail})
                </p>
                <p className="text-gray-600">
                  <span className="font-bold text-gray-900">Category:</span> <span className="uppercase font-semibold">{selectedComplaint.complaintType}</span>
                </p>
                <p className="text-gray-800 pt-1 font-medium bg-white p-2.5 rounded-lg border border-zinc-200/60">
                  "{selectedComplaint.description}"
                </p>
              </div>

              {/* Assign Staff Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Assign Staff / Administrator to Investigate
                </label>
                <select
                  value={formState.assignedToAdminID}
                  onChange={(e) => setFormState({ ...formState, assignedToAdminID: e.target.value })}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">-- Unassigned --</option>
                  {admins.map((adm) => (
                    <option key={adm.adminID} value={adm.adminID}>
                      {adm.name} ({adm.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Update Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Investigation & Tracking Status
                </label>
                <select
                  value={formState.status}
                  onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-primary"
                >
                  <option value="open">Open (Awaiting Initial Review)</option>
                  <option value="in-progress">In Progress (Active Investigation)</option>
                  <option value="resolved">Resolved (Action Taken)</option>
                  <option value="closed">Closed (Archived)</option>
                </select>
              </div>

              {/* Resolution Details & Action Taken */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Resolution Details & Action Taken
                </label>
                <textarea
                  rows={4}
                  placeholder="Document the corrective actions, communications with patient, or staff follow-up..."
                  value={formState.resolution}
                  onChange={(e) => setFormState({ ...formState, resolution: e.target.value })}
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:opacity-90 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Resolution Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
