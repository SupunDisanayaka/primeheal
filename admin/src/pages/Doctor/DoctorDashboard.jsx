import React, { useContext } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const DoctorDashboard = () => {
  const { currentDoctorId } = useContext(DoctorContext);
  const { appointments, doctors, setAppointments, syncAppointmentStatus, currencySymbol } = useContext(AppContext);

  // Filter appointments specifically assigned to this logged-in doctor
  const docApts = appointments.filter((apt) => String(apt.docId) === String(currentDoctorId));

  // Stats Computations
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const today = new Date();
  const dayPadded = String(today.getDate()).padStart(2, '0');
  const dayUnpadded = String(today.getDate());
  const monthName = months[today.getMonth()];
  const year = today.getFullYear();

  const todayStrPadded = `${dayPadded}, ${monthName}, ${year}`.toLowerCase().replace(/\s+/g, "");
  const todayStrUnpadded = `${dayUnpadded}, ${monthName}, ${year}`.toLowerCase().replace(/\s+/g, "");

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const cleanStr = dateStr.toLowerCase().replace(/\s+/g, "");
    return cleanStr === todayStrPadded || cleanStr === todayStrUnpadded;
  };

  const todayApts = docApts.filter((apt) => isToday(apt.slotDate));
  const completedAptsCount = todayApts.filter((apt) => apt.status === "Completed").length;
  const pendingAptsCount = todayApts.filter((apt) => apt.status === "Pending" || apt.status === "Checked In").length;
  const todayAptsCount = completedAptsCount + pendingAptsCount;

  const latestBookings = [...docApts]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const handleComplete = async (aptId) => {
    try {
      await syncAppointmentStatus(aptId, "Completed");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || error.message || "Failed to update status");
    }
  };

  const handleCancel = async (aptId) => {
    try {
      await syncAppointmentStatus(aptId, "Cancelled");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || error.message || "Failed to update status");
    }
  };

  return (
    <div className="m-5 sm:m-8 flex flex-col gap-6 w-full max-w-6xl">
      {/* Welcome Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back,{" "}
          <span className="text-primary font-extrabold">
            {doctors.find((d) => String(d._id) === String(currentDoctorId))?.name || "Doctor"}
          </span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Here is a quick overview of your clinical activity for today, <span className="font-semibold text-gray-700">{dayPadded} {monthName} {year}</span>.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Today's Appointments Card */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <img className="w-10 h-10 object-contain" src={assets.appointments_icon} alt="Today's Appointments" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{todayAptsCount}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Today's Appointments</p>
          </div>
        </div>

        {/* Completed Visits Card */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <img className="w-10 h-10 object-contain filter hue-rotate-60" src={assets.tick_icon} alt="Completed Visits" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{completedAptsCount}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Completed Visits</p>
          </div>
        </div>

        {/* Pending Visits Card */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-amber-50 rounded-xl">
            <img className="w-10 h-10 object-contain filter hue-rotate-30" src={assets.patients_icon} alt="Pending Visits" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingAptsCount}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Pending Visits</p>
          </div>
        </div>

      </div>

      {/* Doctor Recent Bookings Panel */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs mt-2">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-zinc-100">
          <img className="w-5 h-5 object-contain" src={assets.list_icon} alt="Bookings List" />
          <h3 className="text-lg font-bold text-gray-900">Your Recent Bookings</h3>
        </div>

        {latestBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-medium">
            No appointments booked yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-100">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Info</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fees</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {latestBookings.map((apt) => (
                      <tr key={apt._id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {apt.patientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <p>{apt.patientPhone}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{apt.patientGender} • {apt.patientDob}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <p>{apt.slotDate}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{apt.slotTime}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {currencySymbol}{apt.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap flex flex-col gap-1 items-start">
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
                                : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {apt.status}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold select-none ${
                              apt.paymentStatus === "Completed"
                                ? "bg-teal-100 text-teal-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {apt.paymentStatus === "Completed" ? "Paid" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {apt.status === "Pending" || apt.status === "Checked In" ? (
                            <div className="flex items-center justify-center gap-3">
                              {/* Complete Action */}
                              <button
                                onClick={() => handleComplete(apt._id)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors"
                                title="Mark as Completed"
                              >
                                <img className="w-5 h-5 object-contain" src={assets.tick_icon} alt="Tick" />
                              </button>
                              {/* Cancel Action */}
                              <button
                                onClick={() => handleCancel(apt._id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors"
                                title="Cancel Booking"
                              >
                                <img className="w-5 h-5 object-contain" src={assets.cancel_icon} alt="Cancel" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">No actions</span>
                          )}
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
    </div>
  );
};

export default DoctorDashboard;
