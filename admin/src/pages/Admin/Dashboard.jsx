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
    adminRecentTransactions,
    adminDataLoading,
    syncAppointmentStatus
  } = useContext(AppContext);

  console.log('[ADMIN DASHBOARD RENDER]', {
    appointments: appointments.length,
    stats: adminDashboardStats,
    recentAppointments: adminRecentAppointments.length,
    recentTransactions: adminRecentTransactions?.length || 0,
    loading: adminDataLoading
  });

  const todayRevenue = adminDashboardStats?.todayRevenue ?? 0;
  const monthlyRevenue = adminDashboardStats?.monthlyRevenue ?? 0;
  const totalRevenue = adminDashboardStats?.revenue ?? 0;
  const successfulPayments = adminDashboardStats?.successfulPayments ?? 0;
  const pendingPayments = adminDashboardStats?.pendingPayments ?? 0;
  const failedPayments = adminDashboardStats?.failedPayments ?? 0;

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
    <div className="m-5 sm:m-8 flex flex-col gap-6 w-full max-w-[100%]">
      {/* Overview stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Today's Revenue */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-teal-50 rounded-xl">
            <img className="w-10 h-10 object-contain filter hue-rotate-60" src={assets.earning_icon} alt="Today's Revenue" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {currencySymbol}
              {todayRevenue.toFixed(2)}
            </p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Today's Revenue</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-blue-50 rounded-xl">
            <img className="w-10 h-10 object-contain filter hue-rotate-15" src={assets.earning_icon} alt="Monthly Revenue" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {currencySymbol}
              {monthlyRevenue.toFixed(2)}
            </p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Monthly Revenue</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <img className="w-10 h-10 object-contain" src={assets.earning_icon} alt="Total Revenue" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {currencySymbol}
              {totalRevenue.toFixed(2)}
            </p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Total Revenue</p>
          </div>
        </div>

        {/* Successful Payments */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <img className="w-10 h-10 object-contain filter hue-rotate-60" src={assets.tick_icon} alt="Successful Payments" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{successfulPayments}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Successful Payments</p>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-amber-50 rounded-xl">
            <img className="w-10 h-10 object-contain filter hue-rotate-30" src={assets.patients_icon} alt="Pending Payments" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingPayments}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Pending Payments</p>
          </div>
        </div>

        {/* Failed Payments */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
          <div className="p-3 bg-rose-50 rounded-xl">
            <img className="w-10 h-10 object-contain" src={assets.cancel_icon} alt="Failed Payments" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{failedPayments}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Failed Payments</p>
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
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {latestBookings.map((apt) => {
                    const doc = doctors.find((d) =>
                      String(d._id) === String(apt.docId) ||
                      String(d.doctorID) === String(apt.doctorID) ||
                      String(d.doctorUserId) === String(apt.docId) ||
                      String(d.doctorId) === String(apt.doctorId)
                    ) || {};
                    const doctorDisplayName = apt.doctorName || doc.name || "Doctor";
                    const doctorDisplaySpec = apt.speciality || doc.speciality || "General Practitioner";
                    return (
                      <tr key={apt._id || apt.appointmentId} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">{apt.patientName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{apt.patientPhone}</p>
                          {apt.patientNic && <p className="text-[10px] text-gray-400 mt-0.5 tracking-wider font-mono">NIC: {apt.patientNic}</p>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-extrabold shrink-0">
                              {doctorDisplayName.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase() || 'D'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{doctorDisplayName}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{doctorDisplaySpec}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <p>{apt.slotDate}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{apt.slotTime}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider select-none bg-[#187595] text-white uppercase">
                            {apt.paymentMethod === 'Cash' || apt.paymentMethod === 'Card'
                              ? `${apt.paymentMethod}`
                              : (apt.paymentStatus === 'Completed' || apt.paymentStatus === 'Paid'
                              ? 'Web Portal'
                              : 'Front Desk')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {apt.status === "Completed" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider select-none bg-emerald-600 text-white uppercase">
                                Completed
                              </span>
                            ) : apt.status === "Cancelled" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider select-none bg-rose-600 text-white uppercase">
                                Cancelled
                              </span>
                            ) : apt.status === "Checked In" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider select-none bg-teal-600 text-white uppercase">
                                Checked In
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider select-none bg-amber-500 text-white uppercase">
                                Pending
                              </span>
                            )}
                          </div>
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

      {/* Recent Transactions Panel */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs mt-4">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-zinc-100">
          <img className="w-5 h-5 object-contain" src={assets.list_icon} alt="Transactions List" />
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {adminRecentTransactions.map((tx) => (
                    <tr key={tx.paymentID} className="hover:bg-slate-50/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <p className="font-semibold text-gray-900">{tx.transactionId || 'Pending'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{tx.merchantOrderId}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-gray-900">{tx.patientName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{tx.patientEmail}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.doctorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {currencySymbol}{tx.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {tx.paymentMethod ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider select-none bg-slate-600 text-white uppercase">
                            {tx.paymentMethod}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase select-none text-white ${
                            tx.paymentStatus === "Completed"
                              ? "bg-emerald-600"
                              : tx.paymentStatus === "Failed" || tx.paymentStatus === "Cancelled"
                              ? "bg-rose-600"
                              : "bg-amber-500"
                          }`}
                        >
                          {tx.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {adminRecentTransactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 font-medium">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
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
