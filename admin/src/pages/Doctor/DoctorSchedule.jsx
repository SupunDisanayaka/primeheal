import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { DoctorContext } from "../../context/DoctorContext";
import { assets } from "../../assets/assets";
import api, { saveDoctorAvailabilityAPI } from "../../services/api";

const ALL_TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM", "09:00 PM"
];

const parseTimeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
};

const DoctorSchedule = () => {
  const { currentDoctorId } = useContext(DoctorContext);

  // Set default date picker value to today's date formatted as YYYY-MM-DD
  const getTodayInputStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDateInput, setSelectedDateInput] = useState(getTodayInputStr());
  const [rangeStart, setRangeStart] = useState("09:00 AM");
  const [rangeEnd, setRangeEnd] = useState("05:00 PM");
  const [savedNotification, setSavedNotification] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to format input Date (YYYY-MM-DD) to context layout (DD, MMMM, YYYY)
  const getFormattedDateStr = (dateInputStr) => {
    if (!dateInputStr) return "";
    const [year, month, day] = dateInputStr.split("-");
    const date = new Date(year, month - 1, day);
    const dayPadded = String(date.getDate()).padStart(2, "0");
    const monthName = months[date.getMonth()];
    return `${dayPadded}, ${monthName}, ${date.getFullYear()}`;
  };

  const selectedFormattedDate = getFormattedDateStr(selectedDateInput);

  // Fetch availability from backend
  useEffect(() => {
    const loadAvailability = async () => {
      if (!currentDoctorId || !selectedDateInput) return;
      try {
        const response = await api.get(`/doctors/${currentDoctorId}/slots?date=${selectedDateInput}`);
        if (response.data && response.data.success) {
          const slotsByDate = response.data.slotsByDate;
          if (slotsByDate && slotsByDate[0]) {
            const times = slotsByDate[0].slots.map(s => s.time.trim().toUpperCase());
            // Map ALL_TIME_SLOTS to match trim and upper casing for accurate matching
            const matchedTimes = ALL_TIME_SLOTS.filter(t => times.includes(t.toUpperCase()));
            setAvailableSlots(matchedTimes);
          } else {
            setAvailableSlots([]);
          }
        }
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error("Failed to load availability from backend:", err);
        setAvailableSlots([]);
        setHasUnsavedChanges(false);
      }
    };
    loadAvailability();
  }, [currentDoctorId, selectedDateInput]);

  const handleSaveUpdate = async () => {
    try {
      setIsSaving(true);
      setSavedNotification("Saving schedule to database...");
      const res = await saveDoctorAvailabilityAPI(currentDoctorId, {
        date: selectedDateInput,
        slots: availableSlots
      });
      if (res.success) {
        setSavedNotification("Schedule updated successfully!");
        setHasUnsavedChanges(false);
        setTimeout(() => setSavedNotification(""), 3500);
      } else {
        alert(res.message || "Failed to save schedule");
        setSavedNotification("");
      }
    } catch (err) {
      console.error("Failed to save schedule:", err);
      alert("Failed to save schedule to database");
      setSavedNotification("");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle availability of a specific slot (local state)
  const handleToggleSlot = (timeSlot) => {
    setAvailableSlots((prev) => {
      if (prev.includes(timeSlot)) {
        return prev.filter((s) => s !== timeSlot);
      } else {
        return [...prev, timeSlot];
      }
    });
    setHasUnsavedChanges(true);
  };

  // Apply a time range availability (local state)
  const handleApplyRange = (e) => {
    e.preventDefault();
    const startMins = parseTimeToMinutes(rangeStart);
    const endMins = parseTimeToMinutes(rangeEnd);

    if (startMins >= endMins) {
      alert("Start time must be earlier than end time.");
      return;
    }

    const filteredRangeSlots = ALL_TIME_SLOTS.filter((slot) => {
      const slotMins = parseTimeToMinutes(slot);
      return slotMins >= startMins && slotMins <= endMins;
    });

    setAvailableSlots(filteredRangeSlots);
    setHasUnsavedChanges(true);
  };

  // Clear availability for this date (local state)
  const handleClearDate = () => {
    if (window.confirm("Are you sure you want to clear your schedule for this date? (Click 'Save Update' after to apply changes)")) {
      setAvailableSlots([]);
      setHasUnsavedChanges(true);
    }
  };

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Availability Schedule</h2>
          <p className="text-sm text-gray-500 mt-1">Configure the days and times you are available for consultation slots.</p>
        </div>
        <div className="flex items-center gap-3">
          {savedNotification && (
            <div className="bg-teal-50 text-teal-600 px-4 py-2 rounded-xl text-xs font-bold border border-teal-200 animate-pulse transition-all">
              {savedNotification}
            </div>
          )}
          <button
            onClick={handleSaveUpdate}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center gap-2 ${
              hasUnsavedChanges
                ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300"
                : "bg-primary hover:bg-[#4f5fef]"
            } disabled:opacity-50 cursor-pointer`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {isSaving ? "Saving..." : "Save Update"}
            {hasUnsavedChanges && (
              <span className="w-2 h-2 bg-amber-300 rounded-full animate-ping"></span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calendar Date Selection and Range Builder */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Calendar Picker Card */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs flex flex-col gap-4">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select Target Date
            </h3>
            
            <input
              type="date"
              value={selectedDateInput}
              onChange={(e) => setSelectedDateInput(e.target.value)}
              className="border border-zinc-200 outline-none rounded-xl p-3 text-sm focus:border-primary w-full bg-slate-50 font-semibold cursor-pointer text-gray-800"
            />
            
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 mt-2">
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Configuring for</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedFormattedDate}</p>
            </div>
          </div>

          {/* Quick Range Selector Card */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs flex flex-col gap-4">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Apply Range Availability
            </h3>
            <p className="text-xs text-gray-500">Quickly mark a range of continuous hours as available on this date.</p>
            
            <form onSubmit={handleApplyRange} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">From</label>
                  <select
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="border border-zinc-200 outline-none rounded-xl p-2.5 text-xs bg-slate-50 font-semibold cursor-pointer"
                  >
                    {ALL_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">To</label>
                  <select
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="border border-zinc-200 outline-none rounded-xl p-2.5 text-xs bg-slate-50 font-semibold cursor-pointer"
                  >
                    {ALL_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-[#4f5fef] text-white py-2.5 rounded-xl text-xs font-bold mt-2 shadow-md transition-all cursor-pointer"
              >
                Apply Range
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Interactive Time Slots Grid */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs flex flex-col gap-5 h-full">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-md font-bold text-gray-900">Available Time Slots</h3>
                <p className="text-xs text-gray-400 mt-0.5">Toggle individual slot items to set precise availability, then click Save Update.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearDate}
                  disabled={availableSlots.length === 0}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/50 py-1.5 px-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  onClick={handleSaveUpdate}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Update"}
                </button>
              </div>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-2">
              {ALL_TIME_SLOTS.map((slot) => {
                const isSelected = availableSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => handleToggleSlot(slot)}
                    className={`py-3 px-2 border rounded-xl text-xs font-bold text-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-teal-50 border-teal-300 text-teal-700 shadow-xs hover:bg-teal-100/70"
                        : "bg-slate-50/50 border-zinc-100 text-gray-400 hover:bg-slate-50 hover:text-gray-700"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-6 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-teal-50 border border-teal-300 rounded-full inline-block"></span>
                Available Slots ({availableSlots.length})
                {hasUnsavedChanges && (
                  <span className="text-amber-600 font-bold ml-2">(Unsaved Changes)</span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-50 border border-zinc-100 rounded-full inline-block"></span>
                Unavailable
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedule;
