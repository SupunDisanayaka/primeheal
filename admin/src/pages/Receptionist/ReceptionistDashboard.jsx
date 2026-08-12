import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { checkInPatientAPI, createWalkInAppointmentAPI, getReceptionistStatsAPI, updateAdminAppointmentStatus } from "../../services/api";

const ReceptionistDashboard = () => {
  const { appointments, setAppointments, doctors, currencySymbol, fetchAllAppointments } = useContext(AppContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [stats, setStats] = useState({ totalApts: 0, pendingApts: 0, checkedInApts: 0, availableDocs: 0 });

  // Form State for Booking
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [patientDob, setPatientDob] = useState("");
  const [selectedDocId, setSelectedDocId] = useState(doctors[0]?._id || doctors[0]?.id || "");
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");

  const loadStats = async () => {
    try {
      const data = await getReceptionistStatsAPI();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Stats load error:", e);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleCheckIn = async (aptId) => {
    try {
      setLoadingAction(true);
      const res = await checkInPatientAPI(aptId);
      if (res.success) {
        alert(res.message || "Patient checked in successfully.");
        if (fetchAllAppointments) fetchAllAppointments();
        loadStats();
      } else {
        alert(res.message || "Check in failed.");
      }
    } catch (err) {
      console.error("Check-in error:", err);
      // Fallback local update
      setAppointments((prev) =>
        prev.map((apt) => (apt._id === aptId || apt.appointmentId === aptId ? { ...apt, status: "Checked In" } : apt))
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancel = async (aptId) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      setLoadingAction(true);
      const res = await updateAdminAppointmentStatus(aptId, "Cancelled");
      if (res.success) {
        alert("Appointment cancelled successfully.");
        if (fetchAllAppointments) fetchAllAppointments();
        loadStats();
      }
    } catch (err) {
      console.error("Cancel error:", err);
      setAppointments((prev) =>
        prev.map((apt) => (apt._id === aptId || apt.appointmentId === aptId ? { ...apt, status: "Cancelled" } : apt))
      );
    } finally {
      setLoadingAction(false);
    }
  };


  const handleComplete = (aptId) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt._id === aptId || apt.appointmentId === aptId ? { ...apt, status: "Completed" } : apt))
    );
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    const docToUse = selectedDocId || doctors[0]?._id || doctors[0]?.id;
    if (!patientName || !docToUse || !slotDate || !slotTime) {
      alert("Please fill all required fields.");
      return;
    }

    const doc = doctors.find((d) => String(d._id || d.id) === String(docToUse));

    try {
      setLoadingAction(true);
      const payload = {
        patientName,
        patientEmail,
        patientPhone,
        patientGender,
        patientDob,
        docId: docToUse,
        slotDate,
        slotTime,
        amount: doc ? (doc.fees || doc.consultationFee) : 2500
      };
      const res = await createWalkInAppointmentAPI(payload);
      if (res.success) {
        alert(res.message || "Walk-in appointment created successfully!");
        if (fetchAllAppointments) fetchAllAppointments();
        loadStats();
        setShowAddModal(false);

        // Reset Form
        setPatientName("");
        setPatientEmail("");
        setPatientPhone("");
        setPatientGender("Male");
        setPatientDob("");
        setSlotDate("");
        setSlotTime("");
      } else {
        alert(res.message || "Failed to create walk-in appointment.");
      }
    } catch (err) {
      console.error("Book walk-in error:", err);
      alert(err.response?.data?.message || "Error creating walk-in appointment");
    } finally {
      setLoadingAction(false);
    }
  };

  // Metrics
  const totalApts = stats.totalApts || appointments.length;
  const pendingApts = stats.pendingApts || appointments.filter((a) => a.status === "Pending").length;
  const checkedInApts = stats.checkedInApts || appointments.filter((a) => a.status === "Checked In").length;
  const availableDocs = stats.availableDocs || doctors.filter((d) => d.available || d.isAvailable).length;


  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Receptionist Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time patient check-ins and appointment scheduling.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-[#4f5fef] text-white py-2.5 px-6 rounded-xl font-semibold shadow-md transition-all flex items-center gap-2"
        >
          <img className="w-4 h-4 invert" src={assets.add_icon} alt="Add" />
          Book Appointment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
          <div className="p-3 bg-indigo-50 text-primary rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalApts}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Appointments</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingApts}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Check-in</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{checkedInApts}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Patients Checked In</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{availableDocs}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Doctors</p>
          </div>
        </div>
      </div>

      {/* Appointment Control Panel */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-zinc-100">
          <img className="w-5 h-5" src={assets.list_icon} alt="List" />
          <h3 className="text-lg font-bold text-gray-900">Today's Appointment Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Doctor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Reception Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {appointments.map((apt) => {
                const doc = doctors.find((d) => d._id === apt.docId) || {};
                return (
                  <tr key={apt._id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">{apt.patientName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{apt.patientPhone}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img className="w-8 h-8 rounded-full object-cover bg-slate-100" src={doc.image} alt={doc.name} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{doc.speciality}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-800">{apt.slotDate}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{apt.slotTime}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          apt.status === "Completed"
                            ? "bg-emerald-50 text-emerald-600"
                            : apt.status === "Cancelled"
                            ? "bg-rose-50 text-rose-600"
                            : apt.status === "Checked In"
                            ? "bg-teal-50 text-teal-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {apt.status === "Pending" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleCheckIn(apt._id)}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            Check In
                          </button>
                          <button
                            onClick={() => handleCancel(apt._id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors"
                            title="Cancel Appointment"
                          >
                            <img className="w-4 h-4" src={assets.cancel_icon} alt="Cancel" />
                          </button>
                        </div>
                      ) : apt.status === "Checked In" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleComplete(apt._id)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleCancel(apt._id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors"
                            title="Cancel Appointment"
                          >
                            <img className="w-4 h-4" src={assets.cancel_icon} alt="Cancel" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-zinc-100 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Schedule Patient Appointment</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Patient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vincent Smith"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="border border-zinc-200 focus:border-primary outline-none rounded-xl p-3 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    placeholder="vincent@gmail.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="border border-zinc-200 focus:border-primary outline-none rounded-xl p-3 text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="border border-zinc-200 focus:border-primary outline-none rounded-xl p-3 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="border border-zinc-200 focus:border-primary outline-none rounded-xl p-3 text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">DOB</label>
                  <input
                    type="date"
                    value={patientDob}
                    onChange={(e) => setPatientDob(e.target.value)}
                    className="border border-zinc-200 focus:border-primary outline-none rounded-xl p-3 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Assign Doctor</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="border border-zinc-200 focus:border-primary outline-none rounded-xl p-3 text-sm"
                  required
                >
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} ({doc.speciality})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 25, July, 2024"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="border border-zinc-200 focus:border-primary outline-none rounded-xl p-3 text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:30 PM"
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="border border-zinc-200 focus:border-primary outline-none rounded-xl p-3 text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-primary hover:bg-[#4f5fef] text-white py-3.5 rounded-xl font-bold mt-4 shadow-md transition-all"
              >
                Schedule Appointment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
