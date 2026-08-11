import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { toggleDoctorAvailability } from "../../services/api";
import { assets } from "../../assets/assets";

const DoctorsList = () => {
  const { doctors, setDoctors, fetchDoctors, backendUrl } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchDoctors();
      } catch (err) {
        console.error("Error loading doctors in DoctorsList:", err);
        setError("Failed to load doctor records from server.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchDoctors]);

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

  const getDocImage = (item) => {
    if (item.image && typeof item.image === 'string') {
      return item.image.startsWith('http') ? item.image : `${backendUrl}${item.image}`;
    }
    const numericId = parseInt(String(item._id || item.userID || '1').replace(/\D/g, ''), 10) || 1;
    const docKey = `doc${((numericId - 1) % 15) + 1}`;
    return assets[docKey] || assets.doc1;
  };

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">All Doctors</h2>
        <button
          onClick={() => fetchDoctors()}
          className="text-xs font-semibold text-[#00B4B4] hover:text-[#008B8B] bg-teal-50 hover:bg-teal-100/60 px-3.5 py-1.5 rounded-lg border border-teal-100 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Roster
        </button>
      </div>

      {loading && doctors.length === 0 ? (
        <div className="bg-white p-12 border border-zinc-100 rounded-2xl text-center text-gray-500 font-medium shadow-xs animate-pulse">
          Loading doctors roster from database...
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 border border-red-100 rounded-2xl text-center text-red-600 font-medium text-sm">
          {error}
          <div className="mt-3">
            <button
              onClick={() => fetchDoctors()}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white p-8 border border-zinc-100 rounded-2xl text-center text-gray-500 font-medium shadow-xs">
          No doctors registered. Click "Add Doctor" to add one!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {doctors.map((item) => (
            <div
              key={item._id || item.doctorID}
              className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:translate-y-[-4px] transition-all duration-300 group"
            >
              {/* Doctor Photo */}
              <div className="relative overflow-hidden aspect-square bg-gradient-to-b from-teal-50 to-[#E0F2F1]/50 flex items-center justify-center">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={getDocImage(item)}
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
                <p className="text-xs font-bold text-teal-600">
                  Fee: Rs. {Number(item.fees || 0).toFixed(2)}
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
