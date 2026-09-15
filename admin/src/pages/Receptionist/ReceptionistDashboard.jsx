import React, { useContext, useState, useEffect, useMemo } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import {
  checkInPatientAPI,
  createWalkInAppointmentAPI,
  getReceptionistStatsAPI,
  updateAdminAppointmentStatus,
  getDoctorSlotsAPI,
  collectCounterPaymentAPI,
  rescheduleAppointment,
  downloadVisitPassAPI
} from "../../services/api";

const CLINIC_DEFAULT_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM"
];

const ReceptionistDashboard = () => {
  const {
    appointments,
    setAppointments,
    doctors,
    currencySymbol,
    fetchAllAppointments,
    currentReceptionistName
  } = useContext(AppContext);

  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [stats, setStats] = useState({ totalApts: 0, pendingApts: 0, checkedInApts: 0, availableDocs: 0 });

  // Get current date in YYYY-MM-DD
  const getTodayISO = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Convert YYYY-MM-DD to DD/MM/YYYY
  const formatToDMY = (dateStr) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split("-");
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  };

  // Form State for Booking
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [patientDob, setPatientDob] = useState("");
  const [patientNic, setPatientNic] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [slotDate, setSlotDate] = useState(getTodayISO());
  const [slotTime, setSlotTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState(CLINIC_DEFAULT_SLOTS);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // 03. Boolean logic for Cash vs Card
  // isCard === false -> Cash, isCard === true -> Card
  const [isCard, setIsCard] = useState(false);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentApt, setPaymentApt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // Reschedule Modal States
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState("");
  const [newRescheduleTime, setNewRescheduleTime] = useState("");
  const [availableRescheduleSlots, setAvailableRescheduleSlots] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Sync initial doctor selection
  useEffect(() => {
    if (!selectedDocId && doctors.length > 0) {
      setSelectedDocId(doctors[0]._id || doctors[0].id);
    }
  }, [doctors, selectedDocId]);

  // Load stats and refresh appointments on mount
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
    if (fetchAllAppointments) {
      fetchAllAppointments();
    }
  }, []);

  // Fetch dynamic doctor slots when doctor or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      const docToUse = selectedDocId || (doctors[0]?._id || doctors[0]?.id);
      if (!docToUse || !slotDate) {
        setAvailableSlots(CLINIC_DEFAULT_SLOTS);
        return;
      }
      try {
        setLoadingSlots(true);
        const res = await getDoctorSlotsAPI(docToUse, slotDate);
        if (res.success && Array.isArray(res.slotsByDate) && res.slotsByDate.length > 0) {
          const matchingDay = res.slotsByDate.find((d) => d.date === slotDate) || res.slotsByDate[0];
          if (matchingDay && Array.isArray(matchingDay.slots) && matchingDay.slots.length > 0) {
            const timeList = matchingDay.slots.map((s) => s.time);
            setAvailableSlots(timeList.length > 0 ? timeList : CLINIC_DEFAULT_SLOTS);
            if (!slotTime || !timeList.includes(slotTime)) {
              setSlotTime(timeList[0] || CLINIC_DEFAULT_SLOTS[0]);
            }
            return;
          }
        }
        setAvailableSlots(CLINIC_DEFAULT_SLOTS);
        if (!slotTime) setSlotTime(CLINIC_DEFAULT_SLOTS[0]);
      } catch (err) {
        setAvailableSlots(CLINIC_DEFAULT_SLOTS);
        if (!slotTime) setSlotTime(CLINIC_DEFAULT_SLOTS[0]);
      } finally {
        setLoadingSlots(false);
      }
    };

    if (showAddModal) {
      fetchSlots();
    }
  }, [selectedDocId, slotDate, showAddModal, doctors]);

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
      setAppointments((prev) =>
        prev.map((apt) => (apt._id === aptId || apt.appointmentId === aptId ? { ...apt, status: "Checked In" } : apt))
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePrintVisitPass = async (apt, doctorDisplayName, formattedDateDisplay) => {
    try {
      setLoadingAction(true);
      const appointmentId = apt._id || apt.appointmentId || apt.appointmentID;
      
      const blob = await downloadVisitPassAPI(appointmentId);
      
      // Create object URL for the blob
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      
      // Create hidden link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `VisitPass_${apt.patientName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Visit Pass downloaded successfully");
    } catch (error) {
      console.error("Error downloading visit pass:", error);
      toast.error(error.response?.data?.message || "Failed to generate Visit Pass");
    } finally {
      setLoadingAction(false);
    }
  };

  const openPaymentModal = (apt) => {
    setPaymentApt(apt);
    setPaymentMethod("Cash");
    setShowPaymentModal(true);
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!paymentApt) return;
    try {
      setLoadingAction(true);
      const res = await collectCounterPaymentAPI({
        appointmentId: paymentApt._id || paymentApt.appointmentId,
        paymentMethod: paymentMethod,
        amount: paymentApt.amount
      });
      if (res.success) {
        alert(res.message || "Payment collected successfully.");
        if (fetchAllAppointments) fetchAllAppointments();
        loadStats();
        setShowPaymentModal(false);
      } else {
        alert(res.message || "Failed to collect payment.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert(err.response?.data?.message || "Error processing payment.");
    } finally {
      setLoadingAction(false);
    }
  };

  const openRescheduleModal = (apt) => {
    setRescheduleApt(apt);
    setNewRescheduleDate(getTodayISO());
    setNewRescheduleTime("");
    setRescheduleModalOpen(true);
    fetchRescheduleSlots(apt.docId || apt.doctorId || apt.doctorUserId, getTodayISO());
  };

  const fetchRescheduleSlots = async (docId, date) => {
    if (!docId || !date) {
      setAvailableRescheduleSlots([]);
      return;
    }
    try {
      setRescheduleLoading(true);
      const res = await getDoctorSlotsAPI(docId, date);
      if (res.success && res.slotsByDate) {
        const matchingDay = res.slotsByDate.find(d => d.date === date) || res.slotsByDate[0];
        if (matchingDay && matchingDay.slots) {
          setAvailableRescheduleSlots(matchingDay.slots.map(s => s.time));
        } else {
          setAvailableRescheduleSlots([]);
        }
      }
    } catch (e) {
      setAvailableRescheduleSlots([]);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleApt || !newRescheduleDate || !newRescheduleTime) return;
    try {
      setLoadingAction(true);
      const aptId = rescheduleApt._id || rescheduleApt.appointmentId;
      const res = await rescheduleAppointment(aptId, newRescheduleDate, newRescheduleTime);
      if (res.success) {
        alert("Appointment rescheduled successfully!");
        setRescheduleModalOpen(false);
        if (fetchAllAppointments) fetchAllAppointments();
        loadStats();
      }
    } catch (err) {
      console.error("Reschedule error:", err);
      alert(err.response?.data?.message || "Failed to reschedule appointment.");
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

  const handleComplete = async (aptId) => {
    if (!window.confirm("Mark this appointment as complete?")) return;
    try {
      setLoadingAction(true);
      const res = await updateAdminAppointmentStatus(aptId, "Completed");
      if (res.success) {
        alert(res.message || "Appointment marked as complete.");
        if (fetchAllAppointments) fetchAllAppointments();
        loadStats();
      } else {
        alert(res.message || "Failed to mark as complete.");
      }
    } catch (err) {
      console.error("Complete error:", err);
      alert(err.response?.data?.message || "Error marking appointment as complete.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOpenModal = () => {
    setSlotDate(getTodayISO());
    setSlotTime(CLINIC_DEFAULT_SLOTS[0]);
    setIsCard(false);
    setShowAddModal(true);
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    const docToUse = selectedDocId || (doctors[0]?._id || doctors[0]?.id);
    if (!patientName || !docToUse || !slotDate || !slotTime) {
      alert("Please fill all required fields: Patient Name, Doctor, Date, and Time Slot.");
      return;
    }

    const doc = doctors.find((d) => String(d._id || d.id) === String(docToUse));
    const feeAmount = doc ? (doc.fees || doc.consultationFee || 2500) : 2500;

    try {
      setLoadingAction(true);
      // Boolean logic: isCard is boolean; paymentMethod is 'Card' or 'Cash'
      const payload = {
        patientName,
        patientEmail,
        patientPhone,
        patientGender,
        patientDob,
        patientNic,
        docId: docToUse,
        slotDate, // YYYY-MM-DD format from dropdown calendar
        slotTime, // from dropdown time slots list
        isCard: isCard,
        isCash: !isCard,
        paymentMethod: isCard ? "Card" : "Cash",
        amount: feeAmount
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
        setPatientNic("");
        setSlotDate(getTodayISO());
        setSlotTime(CLINIC_DEFAULT_SLOTS[0]);
        setIsCard(false);
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

  // Selected doctor object for modal pricing info
  const currentSelectedDoc = useMemo(() => {
    const docId = selectedDocId || (doctors[0]?._id || doctors[0]?.id);
    return doctors.find((d) => String(d._id || d.id) === String(docId)) || doctors[0];
  }, [doctors, selectedDocId]);

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
          onClick={handleOpenModal}
          className="bg-[#187595] hover:bg-[#135c75] text-white py-2.5 px-6 rounded-xl font-semibold shadow-md transition-all duration-200 transform active:scale-98 flex items-center gap-2"
        >
          <img className="w-4 h-4 invert" src={assets.add_icon} alt="Add" />
          Book Appointment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
          <div className="p-3 bg-indigo-50 text-[#187595] rounded-xl">
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
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <img className="w-5 h-5" src={assets.list_icon} alt="List" />
            <h3 className="text-lg font-bold text-gray-900">Today's Appointment Log</h3>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
            {appointments.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Doctor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment & Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Reception Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">
                    No appointments scheduled yet today.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const doc =
                    doctors.find(
                      (d) =>
                        String(d._id || d.id) ===
                        String(apt.docId || apt.doctorId || apt.doctorUserId || apt.doctorTableId)
                    ) || {};

                  const doctorDisplayName = doc.name || apt.doctorName || "Doctor";
                  const doctorSpeciality = doc.speciality || "General Practitioner";
                  const doctorInitials = (doctorDisplayName.replace(/^Dr\.?\s*/i, "") || "DR").substring(0, 2).toUpperCase();

                  const formattedDateDisplay = apt.slotDate
                    ? formatToDMY(apt.slotDate)
                    : "Scheduled";

                  return (
                    <tr key={apt._id || apt.appointmentId} className="hover:bg-slate-50/40 transition-colors">
                      {/* Patient Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-gray-900">{apt.patientName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{apt.patientPhone || apt.patientEmail || "Walk-in"}</p>
                      </td>

                      {/* Doctor Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {doc.image ? (
                            <img
                              className="w-9 h-9 rounded-full object-cover bg-slate-100 border border-zinc-200"
                              src={doc.image}
                              alt={doctorDisplayName}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-teal-100 text-[#187595] flex items-center justify-center font-bold text-xs border border-teal-200">
                              {doctorInitials}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{doctorDisplayName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{doctorSpeciality}</p>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-800">{formattedDateDisplay}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">{apt.slotTime || "Standard Slot"}</p>
                      </td>

                      {/* Payment & Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              apt.status === "Completed"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : apt.status === "Cancelled"
                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                : apt.status === "Checked In"
                                ? "bg-teal-50 text-teal-600 border border-teal-200"
                                : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
                          >
                            {apt.status}
                          </span>

                          {/* Payment Method Badge */}
                          {apt.paymentMethod && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                              <span>{apt.paymentMethod.toLowerCase() === "card" ? "💳" : "💵"}</span>
                              <span>{apt.paymentMethod}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reception Action Buttons */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        {apt.status === "Pending" ? (
                          <div className="flex flex-col gap-2 items-center justify-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleCheckIn(apt._id || apt.appointmentId)}
                                disabled={loadingAction}
                                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#187595] rounded-lg text-xs font-bold transition-colors shadow-2xs w-[80px]"
                              >
                                Check In
                              </button>
                              <button
                                onClick={() => openPaymentModal(apt)}
                                disabled={loadingAction}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors shadow-2xs w-[80px]"
                              >
                                Collect $
                              </button>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openRescheduleModal(apt)}
                                disabled={loadingAction}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors shadow-2xs w-[80px]"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancel(apt._id || apt.appointmentId)}
                                disabled={loadingAction}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors text-rose-600"
                                title="Cancel Appointment"
                              >
                                <img className="w-4 h-4" src={assets.cancel_icon} alt="Cancel" />
                              </button>
                            </div>
                          </div>
                        ) : apt.status === "Checked In" ? (
                          <div className="flex flex-col gap-2 items-center justify-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleComplete(apt._id || apt.appointmentId)}
                                disabled={loadingAction}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors shadow-2xs w-[80px]"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleCancel(apt._id || apt.appointmentId)}
                                disabled={loadingAction}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors text-rose-600"
                                title="Cancel Appointment"
                              >
                                <img className="w-4 h-4" src={assets.cancel_icon} alt="Cancel" />
                              </button>
                            </div>
                            {(apt.paymentMethod || apt.status === "Paid" || apt.status === "Checked In") && (
                              <button
                                onClick={() => handlePrintVisitPass(apt, doctorDisplayName, formattedDateDisplay)}
                                disabled={loadingAction}
                                className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors border border-amber-200/60 shadow-2xs w-full max-w-[170px]"
                              >
                                Print Visit Pass
                              </button>
                            )}
                          </div>
                        ) : apt.status === "Completed" ? (
                          <div className="flex flex-col gap-2 items-center justify-center">
                            <span className="text-xs text-emerald-600 font-medium">Completed</span>
                            <button
                              onClick={() => handlePrintVisitPass(apt, doctorDisplayName, formattedDateDisplay)}
                              disabled={loadingAction}
                              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors border border-amber-200/60 shadow-2xs w-full max-w-[170px]"
                            >
                              Print Visit Pass
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-zinc-100 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Schedule Patient Appointment</h3>
                <p className="text-xs text-gray-500 mt-0.5">Front desk walk-in scheduling & counter payment</p>
              </div>
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
              {/* Patient Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Patient Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Vincent Smith"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="border border-zinc-200 focus:border-[#187595] focus:ring-1 focus:ring-[#187595]/20 outline-none rounded-xl p-3 text-sm"
                  required
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="border border-zinc-200 focus:border-[#187595] focus:ring-1 focus:ring-[#187595]/20 outline-none rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</label>
                  <input
                    type="text"
                    placeholder="077 123 4567"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="border border-zinc-200 focus:border-[#187595] focus:ring-1 focus:ring-[#187595]/20 outline-none rounded-xl p-3 text-sm"
                  />
                </div>
              </div>

              {/* Gender, DOB */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="border border-zinc-200 focus:border-[#187595] outline-none rounded-xl p-3 text-sm bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={patientDob}
                    onChange={(e) => setPatientDob(e.target.value)}
                    className="border border-zinc-200 focus:border-[#187595] outline-none rounded-xl p-3 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Assign Doctor */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Assign Doctor *</label>
                  {currentSelectedDoc && (
                    <span className="text-xs font-semibold text-[#187595]">
                      Fee: {currencySymbol} {Number(currentSelectedDoc.fees || currentSelectedDoc.consultationFee || 2500).toLocaleString()}
                    </span>
                  )}
                </div>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="border border-zinc-200 focus:border-[#187595] outline-none rounded-xl p-3 text-sm bg-white font-medium"
                  required
                >
                  {doctors.map((doc) => (
                    <option key={doc._id || doc.id} value={doc._id || doc.id}>
                      {doc.name} — {doc.speciality}
                    </option>
                  ))}
                </select>
              </div>

              {/* 01. Appointment Date with Dropdown Calendar and DD/MM/YYYY auto display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date *
                    </label>
                    {slotDate && (
                      <span className="text-[11px] font-bold text-[#187595] bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {formatToDMY(slotDate)}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    min={getTodayISO()}
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="border border-zinc-200 focus:border-[#187595] outline-none rounded-xl p-3 text-sm bg-white font-medium cursor-pointer"
                    required
                  />
                </div>

                {/* 02. Session Time Slot Dropdown */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Time Slot *
                    </label>
                    {loadingSlots && (
                      <span className="text-[10px] text-gray-400 animate-pulse">Loading slots...</span>
                    )}
                  </div>
                  <select
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="border border-zinc-200 focus:border-[#187595] outline-none rounded-xl p-3 text-sm bg-white font-medium cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Time Slot --</option>
                    {availableSlots.map((slot, idx) => (
                      <option key={idx} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 03. Boolean logic for Cash vs Card */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Payment Method *
                  </label>
                  <span className="text-xs font-bold text-gray-600">
                    Mode: {isCard ? "💳 Card" : "💵 Cash"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Cash Option: isCard = false */}
                  <button
                    type="button"
                    onClick={() => setIsCard(false)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                      !isCard
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs"
                        : "bg-slate-50 text-gray-600 border-zinc-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-base">💵</span>
                    <span>Cash</span>
                    {!isCard && <span className="ml-1 text-emerald-600 font-bold">✓</span>}
                  </button>

                  {/* Card Option: isCard = true */}
                  <button
                    type="button"
                    onClick={() => setIsCard(true)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                      isCard
                        ? "bg-indigo-50 text-[#187595] border-indigo-300 ring-2 ring-indigo-400/20 shadow-xs"
                        : "bg-slate-50 text-gray-600 border-zinc-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-base">💳</span>
                    <span>Card</span>
                    {isCard && <span className="ml-1 text-[#187595] font-bold">✓</span>}
                  </button>
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={loadingAction}
                className="bg-[#187595] hover:bg-[#135c75] text-white py-3.5 rounded-xl font-bold mt-2 shadow-md transition-all duration-200 transform active:scale-98 flex items-center justify-center gap-2"
              >
                {loadingAction ? (
                  <span>Scheduling Appointment...</span>
                ) : (
                  <span>Confirm Walk-In Appointment</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showPaymentModal && paymentApt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-zinc-100 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Collect Payment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Patient: <span className="font-semibold">{paymentApt.patientName}</span><br />
              Amount Due: <span className="font-bold text-emerald-600">{currencySymbol} {Number(paymentApt.amount || paymentApt.fee || paymentApt.totalCharge || 0).toLocaleString()}</span>
            </p>
            <form onSubmit={handleCollectPayment} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="border border-zinc-200 focus:border-[#187595] outline-none rounded-xl p-3 text-sm bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  {loadingAction ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && rescheduleApt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-100 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reschedule Appointment</h3>
                <p className="text-xs text-gray-500 mt-0.5">With {rescheduleApt.doctorName}</p>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select New Date *</label>
                <input
                  type="date"
                  min={getTodayISO()}
                  value={newRescheduleDate}
                  onChange={(e) => {
                    setNewRescheduleDate(e.target.value);
                    fetchRescheduleSlots(rescheduleApt.docId || rescheduleApt.doctorId || rescheduleApt.doctorUserId, e.target.value);
                  }}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary bg-white"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Available Time Slot *</label>
                {rescheduleLoading ? (
                  <p className="text-gray-400 italic py-2">Loading slots for selected date...</p>
                ) : availableRescheduleSlots.length === 0 ? (
                  <p className="text-amber-600 italic py-1">No predefined slots for this date. Enter time below:</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 mb-2">
                    {availableRescheduleSlots.map((slot, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setNewRescheduleTime(slot)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          newRescheduleTime === slot
                            ? 'bg-[#187595] text-white border-[#187595] shadow-xs'
                            : 'bg-white hover:bg-teal-50 text-gray-700 border-zinc-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Chosen Slot Time:</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM"
                    value={newRescheduleTime}
                    onChange={(e) => setNewRescheduleTime(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-xs focus:outline-primary bg-white font-semibold"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-[#187595] hover:bg-[#135c75] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {loadingAction ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
