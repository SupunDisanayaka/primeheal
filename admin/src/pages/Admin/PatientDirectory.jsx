import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllPatientsAPI,
  getPatientByIdAPI,
  updatePatientByStaffAPI,
  registerPatientIntakeAPI
} from '../../services/api';

const PatientDirectory = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states for Edit
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    emergencyContact: '',
    allergies: '',
    nic: '',
    country: 'Sri Lanka'
  });

  // Form states for Registration Intake
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    nic: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    emergencyContact: '',
    allergies: '',
    country: 'Sri Lanka'
  });

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchPatients = useCallback(async (pageNum = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const res = await getAllPatientsAPI({ page: pageNum, search: searchQuery, limit: 15 });
      if (res.success) {
        setPatients(res.patients || []);
        setTotalCount(res.total || 0);
        setPage(res.page || 1);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
      showToast('Failed to load patient records from database', 'error');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(1, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchPatients]);

  const handleOpenView = async (patientID) => {
    setModalLoading(true);
    setViewModalOpen(true);
    try {
      const res = await getPatientByIdAPI(patientID);
      if (res.success) {
        setSelectedPatient(res.patient);
      }
    } catch (err) {
      console.error('Failed to fetch patient details:', err);
      showToast('Failed to fetch patient profile details', 'error');
      setViewModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEdit = async (patientID) => {
    setModalLoading(true);
    setEditModalOpen(true);
    try {
      const res = await getPatientByIdAPI(patientID);
      if (res.success) {
        const p = res.patient;
        setSelectedPatient(p);
        setEditForm({
          name: p.name || '',
          phone: p.phone || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
          gender: p.gender || 'Male',
          address: p.address || '',
          emergencyContact: p.emergencyContact || '',
          allergies: p.allergies || '',
          nic: p.nic || '',
          country: p.country || 'Sri Lanka'
        });
      }
    } catch (err) {
      console.error('Failed to fetch patient for editing:', err);
      showToast('Failed to load patient data', 'error');
      setEditModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSaving(true);
    try {
      const res = await updatePatientByStaffAPI(selectedPatient.patientID, editForm);
      if (res.success) {
        showToast('Patient record updated successfully');
        setEditModalOpen(false);
        fetchPatients(page, search);
      }
    } catch (err) {
      console.error('Error updating patient:', err);
      showToast(err.response?.data?.message || 'Failed to update patient record', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await registerPatientIntakeAPI(regForm);
      if (res.success) {
        showToast(`Patient registered successfully with Code: ${res.patientCode}`);
        setRegisterModalOpen(false);
        setRegForm({
          name: '',
          email: '',
          phone: '',
          nic: '',
          dateOfBirth: '',
          gender: 'Male',
          address: '',
          emergencyContact: '',
          allergies: '',
          country: 'Sri Lanka'
        });
        fetchPatients(1, '');
      }
    } catch (err) {
      console.error('Error registering patient:', err);
      showToast(err.response?.data?.message || 'Failed to register patient', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl">
      {/* Toast Notification */}
      {message.text && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg font-medium text-sm transition-all duration-300 ${
            message.type === 'error' ? 'bg-rose-600 text-white' : 'bg-teal-600 text-white'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Management Directory</h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse, manage, and register clinical patient records across the hospital system.
          </p>
        </div>
        <button
          onClick={() => setRegisterModalOpen(true)}
          className="bg-primary hover:bg-[#008B8B] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Register New Patient
        </button>
      </div>

      {/* KPI Cards & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xl">
            {totalCount}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Total Patients</p>
            <p className="text-lg font-bold text-gray-900">Registered Roster</p>
          </div>
        </div>

        <div className="sm:col-span-2 bg-white p-4 rounded-2xl border border-zinc-100 shadow-xs flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by patient name, email, phone number, NIC, or PT code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm text-gray-700 bg-transparent focus:outline-none placeholder-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-medium">
            Loading patient directory from database...
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">
            No patients found matching your search. Click "Register New Patient" to enroll one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-zinc-100">
              <thead className="bg-slate-50/60 text-xs text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Patient Code</th>
                  <th className="px-6 py-4">Patient Name & Contact</th>
                  <th className="px-6 py-4">NIC / Gender</th>
                  <th className="px-6 py-4">Appointments</th>
                  <th className="px-6 py-4">Last Visit</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {patients.map((p) => (
                  <tr key={p.patientID} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-teal-700">
                      {p.patientCode || `PT-${String(p.patientID).padStart(5, '0')}`}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.email} • {p.phone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800 font-medium">{p.nic || 'N/A'}</p>
                      <p className="text-xs text-gray-400 capitalize">{p.gender || 'Not specified'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
                        {p.totalAppointments || 0} visits
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {p.lastAppointmentDate
                        ? new Date(p.lastAppointmentDate).toLocaleDateString()
                        : 'No appointments'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenView(p.patientID)}
                          className="px-3 py-1.5 text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                        >
                          View Records
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p.patientID)}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit Data
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100 flex items-center justify-between text-xs text-gray-500">
            <span>Page {page} of {totalPages} ({totalCount} total patients)</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchPatients(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchPatients(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW PATIENT PROFILE MODAL */}
      {viewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedPatient?.name || 'Patient Profile'}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  ID: {selectedPatient?.patientCode} • NIC: {selectedPatient?.nic || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalLoading ? (
              <div className="py-12 text-center text-gray-500">Loading full records...</div>
            ) : selectedPatient && (
              <div className="mt-6 flex flex-col gap-6">
                {/* Demographics Card */}
                <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium block">Phone</span>
                    <span className="text-gray-800 font-semibold">{selectedPatient.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Email</span>
                    <span className="text-gray-800 font-semibold">{selectedPatient.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Gender</span>
                    <span className="text-gray-800 font-semibold capitalize">{selectedPatient.gender || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Date of Birth</span>
                    <span className="text-gray-800 font-semibold">
                      {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Emergency Contact</span>
                    <span className="text-gray-800 font-semibold">{selectedPatient.emergencyContact || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Allergies</span>
                    <span className="text-rose-600 font-semibold">{selectedPatient.allergies || 'None reported'}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-gray-400 font-medium block">Residential Address</span>
                    <span className="text-gray-800 font-semibold">{selectedPatient.address || 'N/A'}</span>
                  </div>
                </div>

                {/* Appointment History */}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-3">Appointment History ({selectedPatient.appointments?.length || 0})</h4>
                  {selectedPatient.appointments?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No appointments recorded yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedPatient.appointments?.map((apt) => (
                        <div key={apt.appointmentID} className="p-3 bg-white border border-zinc-100 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">{apt.doctorName} ({apt.specialization})</p>
                            <p className="text-gray-400">{new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}</p>
                            {apt.doctorNotes && <p className="text-teal-600 mt-1 italic font-medium">Notes: {apt.doctorNotes}</p>}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                            apt.status === 'Completed' || apt.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoices */}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-3">Billing & Invoices ({selectedPatient.invoices?.length || 0})</h4>
                  {selectedPatient.invoices?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No invoices issued for this patient.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedPatient.invoices?.map((inv) => (
                        <div key={inv.invoiceID} className="p-3 bg-white border border-zinc-100 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-mono font-bold text-gray-800">{inv.invoiceNumber}</p>
                            <p className="text-gray-400">Date: {new Date(inv.issueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-teal-700">LKR {Number(inv.totalAmount).toFixed(2)}</p>
                            <span className="text-[10px] uppercase font-bold text-emerald-600">{inv.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT PATIENT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <h3 className="text-xl font-bold text-gray-900">Edit Patient Records</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">National ID (NIC)</label>
                  <input
                    type="text"
                    value={editForm.nic}
                    onChange={(e) => setEditForm({ ...editForm, nic: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Emergency Contact Phone</label>
                <input
                  type="text"
                  value={editForm.emergencyContact}
                  onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Known Allergies / Medical Flags</label>
                <input
                  type="text"
                  value={editForm.allergies}
                  placeholder="e.g. Penicillin, Aspirin, Pollen"
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Residential Address</label>
                <textarea
                  rows="2"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary hover:bg-[#008B8B] text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER NEW PATIENT MODAL */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Direct Patient Intake Registration</h3>
                <p className="text-xs text-gray-400 mt-0.5">Register a patient without needing an immediate appointment booking.</p>
              </div>
              <button onClick={() => setRegisterModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Full Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Fernando"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="patient@email.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="0771234567"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">National ID (NIC)</label>
                  <input
                    type="text"
                    placeholder="199512345678 or 951234567V"
                    value={regForm.nic}
                    onChange={(e) => setRegForm({ ...regForm, nic: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Gender</label>
                  <select
                    value={regForm.gender}
                    onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={regForm.dateOfBirth}
                    onChange={(e) => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="0719999999"
                    value={regForm.emergencyContact}
                    onChange={(e) => setRegForm({ ...regForm, emergencyContact: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Medical Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Latex, None"
                  value={regForm.allergies}
                  onChange={(e) => setRegForm({ ...regForm, allergies: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Residential Address</label>
                <textarea
                  rows="2"
                  placeholder="No, Street, City"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary hover:bg-[#008B8B] text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDirectory;
