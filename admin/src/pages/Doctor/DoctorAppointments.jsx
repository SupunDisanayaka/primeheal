import React, { useContext, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { updateDoctorNotesAPI } from "../../services/api";

const DoctorAppointments = () => {
  const { currentDoctorId } = useContext(DoctorContext);
  const { appointments, setAppointments, syncAppointmentStatus, currencySymbol } = useContext(AppContext);

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [activeApt, setActiveApt] = useState(null);
  const [currentNotes, setCurrentNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Filter appointments specifically assigned to this logged-in doctor
  const docApts = appointments.filter((apt) => String(apt.docId) === String(currentDoctorId));

  const handleStatusChange = async (aptId, newStatus) => {
    try {
      await syncAppointmentStatus(aptId, newStatus);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || error.message || "Failed to update status");
    }
  };

  const handleOpenNotes = (apt) => {
    setActiveApt(apt);
    setCurrentNotes(apt.doctorNotes || "");
    setNotesModalOpen(true);
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!activeApt) return;
    setSavingNotes(true);
    try {
      const res = await updateDoctorNotesAPI(activeApt._id || activeApt.appointmentId, currentNotes);
      if (res.success) {
        alert("Consultation notes saved successfully.");
        setAppointments((prev) =>
          prev.map((a) =>
            (a._id === activeApt._id || a.appointmentId === activeApt.appointmentId)
              ? { ...a, doctorNotes: currentNotes }
              : a
          )
        );
        setNotesModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save clinical notes:", err);
      alert(err.response?.data?.message || "Failed to save clinical notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // Helper to compute patient age based on DOB
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Appointments</h2>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs overflow-hidden">
        {docApts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-medium">
            You do not have any patient appointments booked currently.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                 <table className="min-w-full divide-y divide-zinc-100">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Information</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {docApts.map((apt, index) => (
                      <tr key={apt._id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-semibold">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {apt.patientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <p>{apt.patientPhone}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{apt.patientEmail}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {calculateAge(apt.patientDob)} Years
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                          {apt.slotDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {apt.slotTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold select-none ${
                              apt.status === "Completed"
                                ? "bg-emerald-50 text-emerald-600"
                                : apt.status === "Cancelled"
                                ? "bg-rose-50 text-rose-600"
                                : apt.status === "Checked In" || apt.status === "Confirmed"
                                ? "bg-teal-50 text-teal-600"
                                : apt.status === "Paid"
                                ? "bg-indigo-50 text-indigo-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenNotes(apt)}
                              className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                            >
                              {apt.doctorNotes ? 'View Notes' : '+ Add Notes'}
                            </button>

                            {apt.status === "Completed" || apt.status === "Cancelled" ? (
                              <span className="text-xs text-gray-400 font-semibold select-none">No Action</span>
                            ) : apt.status === "Pending" ? (
                              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 text-center font-semibold select-none">Awaiting Payment</span>
                            ) : (
                              <select
                                value={apt.status === "Completed" ? "Completed" : apt.status}
                                onChange={(e) => handleStatusChange(apt._id, e.target.value)}
                                className={`border outline-none rounded-lg px-2 py-1 text-xs font-bold bg-white cursor-pointer transition-all ${
                                  apt.status === "Completed"
                                    ? "border-emerald-200 text-emerald-600 focus:border-emerald-400"
                                    : "border-indigo-200 text-indigo-600 focus:border-indigo-400"
                                }`}
                              >
                                <option value={apt.status} disabled className="font-semibold">{apt.status}</option>
                                <option value="Completed" className="text-emerald-600 font-semibold">Completed</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CLINICAL CONSULTATION NOTES MODAL */}
      {notesModalOpen && activeApt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-100 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Consultation Clinical Notes</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Patient: {activeApt.patientName} • {activeApt.slotDate} at {activeApt.slotTime}
                </p>
              </div>
              <button onClick={() => setNotesModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">✕</button>
            </div>

            {/* Patient Clinical Flags */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-zinc-100 mb-4 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400 font-medium block">Allergies:</span>
                <span className="font-bold text-rose-600">{activeApt.patientAllergies || 'None reported'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Gender / Age:</span>
                <span className="font-bold text-gray-800">{activeApt.patientGender || 'N/A'} • {calculateAge(activeApt.patientDob)} yrs</span>
              </div>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Doctor's Clinical Notes, Diagnosis & Prescriptions:
                </label>
                <textarea
                  rows="5"
                  required
                  placeholder="Record diagnosis, observations, prescribed medications, dosages, and follow-up plan..."
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  className="w-full p-3 border border-zinc-200 rounded-xl text-sm focus:outline-primary bg-white leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setNotesModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNotes}
                  className="px-5 py-2 bg-primary hover:bg-[#008B8B] text-white rounded-xl font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {savingNotes ? 'Saving Notes...' : 'Save Consultation Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
