import React, { useContext } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const DoctorAppointments = () => {
  const { currentDoctorId } = useContext(DoctorContext);
  const { appointments, setAppointments, syncAppointmentStatus, currencySymbol } = useContext(AppContext);

  // Filter appointments specifically assigned to this logged-in doctor
  const docApts = appointments.filter((apt) => apt.docId === currentDoctorId);

  const handleStatusChange = async (aptId, newStatus) => {
    try {
      await syncAppointmentStatus(aptId, newStatus);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || error.message || "Failed to update status");
    }
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
      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Appointments</h2>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xs overflow-hidden">
        {docApts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-medium">
            You do not have any patient appointments booked currently.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                 <table className="min-w-full divide-y divide-zinc-100">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Information</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {docApts.map((apt, index) => (
                      <tr key={apt._id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-semibold">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {apt.patientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <p>{apt.patientPhone}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{apt.patientEmail}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {calculateAge(apt.patientDob)} Years
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                          {apt.slotDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {apt.slotTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {apt.status === "Completed" || apt.status === "Cancelled" ? (
                            <span className="text-xs text-gray-400 font-semibold select-none">No Action</span>
                          ) : apt.status === "Pending" ? (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 text-center font-semibold select-none">Awaiting Payment</span>
                          ) : (
                            <select
                              value={apt.status === "Completed" ? "Completed" : apt.status}
                              onChange={(e) => handleStatusChange(apt._id, e.target.value)}
                              className={`border outline-none rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white cursor-pointer transition-all ${
                                apt.status === "Completed"
                                  ? "border-emerald-200 text-emerald-600 focus:border-emerald-400"
                                  : "border-indigo-200 text-indigo-600 focus:border-indigo-400"
                              }`}
                            >
                              <option value={apt.status} disabled className="font-semibold">{apt.status}</option>
                              <option value="Completed" className="text-emerald-600 font-semibold">Completed</option>
                            </select>
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

export default DoctorAppointments;
