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
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold select-none ${
                                apt.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : apt.status === "Cancelled"
                                  ? "bg-rose-50 text-rose-600"
                                  : apt.status === "Confirmed" || apt.status === "Checked In"
                                  ? "bg-teal-50 text-teal-600"
                                  : apt.status === "Paid"
                                  ? "bg-indigo-50 text-indigo-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {apt.status}
                            </span>
                            
                            {apt.status !== "Completed" && apt.status !== "Cancelled" && (
                              <div className="flex items-center justify-center gap-3 mt-1.5">
                                {/* Complete Button */}
                                {(apt.status === "Paid" || apt.status === "Checked In" || apt.status === "Confirmed") && (
                                  <button
                                    onClick={() => handleComplete(apt._id)}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors group"
                                    title="Complete Booking"
                                  >
                                    <img className="w-5 h-5 object-contain" src={assets.tick_icon} alt="Tick" />
                                  </button>
                                )}
                                {/* Cancel Button */}
                                {apt.status === "Pending" && (
                                  <button
                                    onClick={() => handleCancel(apt._id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors group"
                                    title="Cancel Booking"
                                  >
                                    <img className="w-5 h-5 object-contain" src={assets.cancel_icon} alt="Cancel" />
                                  </button>
                                )}
                              </div>
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
