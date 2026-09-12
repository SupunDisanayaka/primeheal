import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { toggleDoctorAvailability, updateDoctorProfile } from "../../services/api";
import { assets } from "../../assets/assets";

const DoctorsList = () => {
  const { doctors, setDoctors, fetchDoctors, backendUrl } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    fees: "",
    speciality: "",
    degree: "",
    experience: "",
    about: ""
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchDoctors();
      } catch (err) {
        console.error("Error loading doctors in DoctorsList:", err);
        setError("Failed to load doctor records from server.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchDoctors]);

  const toggleAvailability = async (docId) => {
    try {
      const res = await toggleDoctorAvailability(docId);
      if (res.success) {
        setDoctors((prev) =>
          prev.map((doc) => (doc._id === docId ? { ...doc, available: !doc.available } : doc))
        );
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
      alert("Failed to toggle availability");
    }
  };

  const handleOpenEdit = (doc) => {
    setSelectedDoc(doc);
    setEditForm({
      name: doc.name || "",
      email: doc.email || "",
      fees: doc.fees || "",
      speciality: doc.speciality || "",
      degree: doc.degree || "",
      experience: doc.experience || "5 Years",
      about: doc.about || ""
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setSaving(true);
    try {
      const res = await updateDoctorProfile(selectedDoc._id, editForm);
      if (res.success) {
        alert("Doctor profile updated successfully.");
        setEditModalOpen(false);
        fetchDoctors();
      }
    } catch (err) {
      console.error("Failed to update doctor:", err);
      alert(err.response?.data?.message || "Failed to update doctor details");
    } finally {
      setSaving(false);
    }
  };

  const getDocImage = (item) => {
    if (item.image && typeof item.image === 'string') {
      return item.image.startsWith('http') ? item.image : `${backendUrl}${item.image}`;
    }
    const numericId = parseInt(String(item._id || item.userID || '1').replace(/\D/g, ''), 10) || 1;
    const docKey = `doc${((numericId - 1) % 15) + 1}`;
    return assets[docKey] || assets.doc1;
  };

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">All Doctors</h2>
        <button
          onClick={() => fetchDoctors()}
          className="text-xs font-semibold text-[#00B4B4] hover:text-[#008B8B] bg-teal-50 hover:bg-teal-100/60 px-3.5 py-1.5 rounded-lg border border-teal-100 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Roster
        </button>
      </div>

      {loading && doctors.length === 0 ? (
        <div className="bg-white p-12 border border-zinc-100 rounded-2xl text-center text-gray-500 font-medium shadow-xs animate-pulse">
          Loading doctors roster from database...
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 border border-red-100 rounded-2xl text-center text-red-600 font-medium text-sm">
          {error}
          <div className="mt-3">
            <button
              onClick={() => fetchDoctors()}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white p-8 border border-zinc-100 rounded-2xl text-center text-gray-500 font-medium shadow-xs">
          No doctors registered. Click "Add Doctor" to add one!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {doctors.map((item) => (
            <div
              key={item._id || item.doctorID}
              className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:translate-y-[-4px] transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                {/* Doctor Photo */}
                <div className="relative overflow-hidden aspect-square bg-gradient-to-b from-teal-50 to-[#E0F2F1]/50 flex items-center justify-center">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={getDocImage(item)}
                    alt={item.name}
                  />
                </div>

                {/* Doctor Details */}
                <div className="p-5 flex flex-col gap-1.5">
                  <p className="text-lg font-bold text-gray-900 leading-tight truncate">
                    {item.name}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {item.degree} • {item.speciality}
                  </p>
                  <p className="text-xs font-bold text-teal-600">
                    Fee: Rs. {Number(item.fees || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="px-5 pb-5 pt-3 border-t border-zinc-100 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={() => toggleAvailability(item._id)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span
                    className={`text-[11px] font-bold transition-colors ${
                      item.available ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    {item.available ? "Active" : "Off"}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenEdit(item)}
                  className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Edit Info
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT DOCTOR MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <h3 className="text-xl font-bold text-gray-900">Edit Doctor Information</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Doctor Name *</label>
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
                  <label className="font-semibold text-gray-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Consultation Fee (Rs.) *</label>
                  <input
                    type="number"
                    required
                    value={editForm.fees}
                    onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={editForm.speciality}
                    onChange={(e) => setEditForm({ ...editForm, speciality: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Qualifications / Degree *</label>
                  <input
                    type="text"
                    required
                    value={editForm.degree}
                    onChange={(e) => setEditForm({ ...editForm, degree: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Experience</label>
                <input
                  type="text"
                  value={editForm.experience}
                  placeholder="e.g. 8 Years"
                  onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Doctor Bio / About</label>
                <textarea
                  rows="3"
                  value={editForm.about}
                  onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
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
                  {saving ? "Saving..." : "Update Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
