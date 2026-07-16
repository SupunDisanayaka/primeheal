import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { toggleDoctorAvailability } from "../../services/api";
import { assets } from "../../assets/assets";

const DoctorsList = () => {
  const { doctors, setDoctors, backendUrl } = useContext(AppContext);

  const toggleAvailability = async (docId) => {
    try {
      const res = await toggleDoctorAvailability(docId);
      if (res.success) {
        setDoctors((prev) =>
          prev.map((doc) => (doc._id === docId ? { ...doc, available: !doc.available } : doc))
        );
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
      alert("Failed to toggle availability");
    }
  };

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">All Doctors</h2>

      {doctors.length === 0 ? (
        <div className="bg-white p-8 border border-zinc-100 rounded-2xl text-center text-gray-500 font-medium shadow-xs">
          No doctors registered. Click "Add Doctor" to add one!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {doctors.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:translate-y-[-4px] transition-all duration-300 group"
            >
              {/* Doctor Photo */}
              <div className="relative overflow-hidden aspect-square bg-gradient-to-b from-primary to-[#E0F2F1]/50 flex items-center justify-center">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={item.image ? (item.image.startsWith('http') ? item.image : `${backendUrl}${item.image}`) : assets[`doc${((item._id || 0) % 15) + 1}`]}
                  alt={item.name}
                />
              </div>

              {/* Doctor Details */}
              <div className="p-5 flex flex-col gap-1.5">
                <p className="text-lg font-bold text-gray-900 leading-tight truncate">
                  {item.name}
                </p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {item.degree} • {item.speciality}
                </p>

                {/* Availability Toggle */}
                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-zinc-100 select-none">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={() => toggleAvailability(item._id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span
                    className={`text-xs font-bold transition-colors ${
                      item.available ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
