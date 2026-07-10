import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const Dashboard = () => {
  const {
    appointments,
    doctors,
    currencySymbol,
    adminDashboardStats,
    adminRecentAppointments,
    adminDataLoading,
    syncAppointmentStatus
  } = useContext(AppContext);

  console.log('[ADMIN DASHBOARD RENDER]', {
    appointments: appointments.length,
    stats: adminDashboardStats,
    recentAppointments: adminRecentAppointments.length,
    loading: adminDataLoading
  });

  const completedApts = appointments.filter((apt) => apt.status === "Completed");
  const totalEarnings = adminDashboardStats?.revenue ?? completedApts.reduce((sum, apt) => sum + apt.amount, 0);
  const totalAptsCount = adminDashboardStats?.totalAppointments ?? appointments.length;
  const totalPatientsCount = adminDashboardStats?.totalPatients ?? new Set(appointments.map((apt) => apt.patientEmail.toLowerCase())).size;
  const latestBookings = adminRecentAppointments.length > 0
    ? adminRecentAppointments
    : [...appointments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const handleComplete = async (aptId) => {
    await syncAppointmentStatus(aptId, "Completed");
  };

  const handleCancel = async (aptId) => {
    await syncAppointmentStatus(aptId, "Cancelled");
  };

  return (
    <div className="m-5 sm:m-8 flex flex-col gap-6 w-full max-w-6xl">
      {/* Overview stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Earnings Card */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <img className="w-10 h-10 object-contain" src={assets.earning_icon} alt="Earnings Icon" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {currencySymbol}
              {totalEarnings}
            </p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Total Earnings</p>
          </div>
        </div>

        {/* Appointments Card */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <img className="w-10 h-10 object-contain" src={assets.appointments_icon} alt="Appointments Icon" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalAptsCount}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Appointments</p>
          </div>
        </div>

        {/* Patients Card */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <img className="w-10 h-10 object-contain" src={assets.patients_icon} alt="Patients Icon" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalPatientsCount}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Total Patients</p>
          </div>
        </div>

      </div>

      {/* Recent Bookings Panel */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs mt-2">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-zinc-100">
          <img className="w-5 h-5 object-contain" src={assets.list_icon} alt="Bookings List" />
          <h3 className="text-lg font-bold text-gray-900">Recent Bookings</h3>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {latestBookings.map((apt) => {
                    const doc = doctors.find((d) => d._id === apt.docId) || {};
                    return (
                      <tr key={apt._id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">{apt.patientName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{apt.patientPhone}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <img className="w-8 h-8 rounded-full object-cover bg-slate-100" src={doc.image} alt={doc.name} />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{doc.speciality}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <p>{apt.slotDate}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{apt.slotTime}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold select-none ${
                              apt.status === "Completed"
                                ? "bg-emerald-50 text-emerald-600"
                                : apt.status === "Cancelled"
                                ? "bg-rose-50 text-rose-600"
                                : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {apt.status === "Pending" || apt.status === "Checked In" ? (
                            <div className="flex items-center justify-center gap-3">
                              {/* Complete Action */}
                              <button
                                onClick={() => handleComplete(apt._id)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors group"
                                title="Complete Appointment"
                              >
                                <img className="w-5 h-5 object-contain" src={assets.tick_icon} alt="Tick" />
                              </button>
                              {/* Cancel Action */}
                              <button
                                onClick={() => handleCancel(apt._id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors group"
                                title="Cancel Appointment"
                              >
                                <img className="w-5 h-5 object-contain" src={assets.cancel_icon} alt="Cancel" />
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
