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
    <div className="m-5 sm:m-8 w-full max-w-[100%]">
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
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-extrabold shrink-0">
                              {doc?.name ? doc.name.replace('Dr. ', '').charAt(0).toUpperCase() : 'D'}
                            </div>
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
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider select-none bg-[#187595] text-white uppercase">
                            {apt.paymentMethod === 'Cash' || apt.paymentMethod === 'Card'
                              ? `${apt.paymentMethod}`
                              : (apt.paymentStatus === 'Completed' || apt.paymentStatus === 'Paid'
                              ? 'Web Portal'
                              : 'Front Desk')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
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
    </div>
  );
};

export default AllAppointments;
