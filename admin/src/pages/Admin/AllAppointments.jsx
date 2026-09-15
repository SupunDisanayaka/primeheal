import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const AllAppointments = () => {
  const { appointments, doctors, currencySymbol, syncAppointmentStatus, adminDataLoading } = useContext(AppContext);

  console.log('[ADMIN APPOINTMENTS PAGE]', {
    appointments: appointments.length,
    loading: adminDataLoading
  });

  const handleComplete = async (aptId) => {
    await syncAppointmentStatus(aptId, "Completed");
  };

  const handleCancel = async (aptId) => {
    await syncAppointmentStatus(aptId, "Cancelled");
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
      <h2 className="text-xl font-bold text-gray-900 mb-6">All Appointments</h2>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fees</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {appointments.map((apt, index) => {
                    const doc = doctors.find((d) => d._id === apt.docId) || {};
                    return (
                      <tr key={apt._id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-semibold">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">{apt.patientName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{apt.patientPhone}</p>
                          {apt.patientNic && <p className="text-[10px] text-gray-400 mt-0.5 tracking-wider font-mono">NIC: {apt.patientNic}</p>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {calculateAge(apt.patientDob)} Years
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <p className="font-medium text-gray-800">{apt.slotDate}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{apt.slotTime}</p>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {currencySymbol}{apt.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider select-none border ${
                              apt.paymentStatus === 'Completed' || apt.paymentStatus === 'Paid'
                                ? apt.paymentMethod === 'Online'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' // Via PayHere
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200' // Front Desk
                                : 'bg-amber-50 text-amber-700 border-amber-200' // Pending
                            }`}
                          >
                            {apt.paymentStatus === 'Completed' || apt.paymentStatus === 'Paid'
                              ? apt.paymentMethod === 'Online'
                                ? 'Via PayHere'
                                : 'Front Desk'
                              : 'Pending Payment'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {apt.status === "Completed" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 select-none">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Session Completed
                              </span>
                            ) : apt.status === "Cancelled" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 select-none">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Session Cancelled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 select-none opacity-80">
                                <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Pending Session
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
    </div>
  );
};

export default AllAppointments;
