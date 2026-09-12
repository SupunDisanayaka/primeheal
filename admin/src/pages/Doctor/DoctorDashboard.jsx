import React, { useContext, useState, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { getDoctorFeedbackAPI } from "../../services/api";

const DoctorDashboard = () => {
  const { currentDoctorId } = useContext(DoctorContext);
  const { appointments, doctors, setAppointments, syncAppointmentStatus, currencySymbol } = useContext(AppContext);
  const [feedbackData, setFeedbackData] = useState({ averageRating: 0, totalReviews: 0, feedback: [] });
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    if (currentDoctorId) {
      setLoadingFeedback(true);
      getDoctorFeedbackAPI(currentDoctorId)
        .then((res) => {
          if (res.success) {
            setFeedbackData({
              averageRating: res.averageRating || 0,
              totalReviews: res.totalReviews || 0,
              feedback: res.feedback || []
            });
          }
        })
        .catch((err) => console.error("Error loading doctor feedback:", err))
        .finally(() => setLoadingFeedback(false));
    }
  }, [currentDoctorId]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
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

        {/* Patient Satisfaction & Rating Card */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 flex items-center gap-1.5">
              {feedbackData.averageRating > 0 ? Number(feedbackData.averageRating).toFixed(1) : "N/A"}
              {feedbackData.averageRating > 0 && <span className="text-sm text-gray-400 font-normal">/ 5.0</span>}
            </p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">{feedbackData.totalReviews} Patient Reviews</p>
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

      {/* Patient Reviews & Ratings Panel */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs p-6">
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-50 text-amber-500 rounded-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Patient Reviews & Feedback</h3>
              <p className="text-xs text-gray-400">Verified patient satisfaction ratings and clinical consultation comments.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-gray-500 bg-zinc-100 px-3 py-1 rounded-full">
              {feedbackData.totalReviews} Total Verified Reviews
            </span>
          </div>
        </div>

        {loadingFeedback ? (
          <div className="py-8 text-center text-sm text-gray-400">Loading patient feedback...</div>
        ) : feedbackData.feedback.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            No patient reviews published yet. Completed consultations will display verified reviews here once approved.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbackData.feedback.map((item) => (
              <div
                key={item.feedbackID}
                className="p-4 rounded-xl border border-zinc-100 bg-slate-50/40 flex flex-col gap-2 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">{item.patientName || "Verified Patient"}</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < item.rating ? "text-amber-400 fill-amber-400" : "text-zinc-200 fill-zinc-200"}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-xs font-bold text-gray-700 ml-1">{item.rating}.0</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed italic">
                  "{item.comments || "No written comments provided."}"
                </p>
                <p className="text-[10px] text-gray-400 mt-auto pt-1">
                  Submitted: {item.createdAt ? String(item.createdAt).substring(0, 10) : "Recent"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
