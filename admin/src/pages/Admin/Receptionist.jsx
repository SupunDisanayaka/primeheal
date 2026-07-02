import React, { useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { addReceptionistAPI } from "../../services/api";

const Receptionist = () => {
  const { receptionists, setReceptionists } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("list"); // 'list' or 'add'
  const [searchTerm, setSearchTerm] = useState("");

  // Add Form State
  const [recImg, setRecImg] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Receptionist@123");
  const [phone, setPhone] = useState("");
  const [shift, setShift] = useState("Morning (08:00 AM - 04:00 PM)");
  const [deskBlock, setDeskBlock] = useState("Main Lobby, Desk A");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setRecImg(e.target.files[0]);
    }
  };

  const toggleAvailability = (id) => {
    setReceptionists((prev) =>
      prev.map((rec) => (rec._id === id ? { ...rec, available: !rec.available } : rec))
    );
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this receptionist?")) {
      setReceptionists((prev) => prev.filter((rec) => rec._id !== id));
    }
  };

  const handleAddReceptionist = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!name || !email || !password || !phone || !shift || !deskBlock) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    try {
      const data = await addReceptionistAPI({
        name,
        email,
        password,
        phone,
        shift,
        deskBlock,
      });

      if (data.success) {
        const newRec = {
          _id: `rec_${Date.now()}`,
          name,
          email,
          phone,
          image: recImg
            ? URL.createObjectURL(recImg)
            : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
          shift,
          deskBlock,
          available: true,
          createdAt: new Date(),
        };

        setReceptionists((prev) => [...prev, newRec]);
        setSuccessMsg(`Receptionist registered successfully! The account can now sign in with ${email} and the chosen password.`);

        setRecImg(null);
        setName("");
        setEmail("");
        setPassword("Receptionist@123");
        setPhone("");
        setShift("Morning (08:00 AM - 04:00 PM)");
        setDeskBlock("Main Lobby, Desk A");

        setTimeout(() => {
          setSuccessMsg("");
          setActiveTab("list");
        }, 1800);
      } else {
        setErrorMsg(data.message || "Unable to create receptionist account.");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || "Unable to create receptionist account.");
    }
  };

  // Filtered List
  const filteredReceptionists = receptionists.filter(
    (rec) =>
      rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.deskBlock.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Receptionist Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage front desk staff shifts, desks, and availability.</p>
        </div>

        {/* Tab Controls */}
        <div className="bg-white border border-zinc-100 p-1 rounded-xl flex gap-1 shadow-xs">
          <button
            onClick={() => {
              setActiveTab("list");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "list"
                ? "bg-primary text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Staff Roster
          </button>
          <button
            onClick={() => {
              setActiveTab("add");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "add"
                ? "bg-primary text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Add Receptionist
          </button>
        </div>
      </div>

      {/* Roster List Tab */}
      {activeTab === "list" && (
        <div className="flex flex-col gap-6">
          {/* Search Box */}
          <div className="flex items-center bg-white border border-zinc-100 rounded-xl px-4 py-3 shadow-xs max-w-md w-full">
            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or desk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.value || e.target.value)}
              className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          {/* Cards Grid */}
          {filteredReceptionists.length === 0 ? (
            <div className="bg-white p-12 border border-zinc-100 rounded-2xl text-center text-gray-500 font-medium shadow-xs">
              No receptionists found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReceptionists.map((rec) => (
                <div
                  key={rec._id}
                  className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Photo and Badges */}
                    <div className="flex items-start gap-4">
                      <img
                        className="w-16 h-16 rounded-full object-cover bg-slate-100 border border-zinc-100"
                        src={rec.image}
                        alt={rec.name}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-gray-900 truncate">{rec.name}</h4>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{rec.email}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">{rec.phone}</p>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium uppercase tracking-wider">Shift</span>
                        <span className="text-gray-800 font-semibold">{rec.shift}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium uppercase tracking-wider">Desk</span>
                        <span className="text-gray-800 font-semibold">{rec.deskBlock}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Block */}
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    {/* Toggle */}
                    <div className="flex items-center gap-2 select-none">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rec.available}
                          onChange={() => toggleAvailability(rec._id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                      <span className={`text-xs font-bold transition-colors ${rec.available ? "text-primary" : "text-gray-400"}`}>
                        {rec.available ? "On Duty" : "Off Duty"}
                      </span>
                    </div>

                    {/* Delete Icon */}
                    <button
                      onClick={() => handleDelete(rec._id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
                      title="Remove staff member"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add New Receptionist Tab */}
      {activeTab === "add" && (
        <div className="bg-white border border-zinc-100 p-6 sm:p-8 rounded-2xl shadow-xs max-w-3xl">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <img className="w-5 h-5" src={assets.add_icon} alt="Add" />
            Register New Receptionist
          </h3>

          {/* Messages */}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-semibold">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAddReceptionist} className="flex flex-col gap-6">
            {/* Image Upload Block */}
            <div className="flex items-center gap-4">
              <label htmlFor="rec-img" className="cursor-pointer group relative">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-zinc-300 group-hover:border-primary flex flex-col items-center justify-center bg-slate-50 transition-colors overflow-hidden">
                  {recImg ? (
                    <img className="w-full h-full object-cover" src={URL.createObjectURL(recImg)} alt="Preview" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <img className="w-6 h-6 opacity-60 group-hover:opacity-100" src={assets.upload_area} alt="Upload" />
                      <span className="text-[10px] text-gray-400 mt-1 font-medium">Upload Photo</span>
                    </div>
                  )}
                </div>
              </label>
              <input onChange={handleImageChange} type="file" id="rec-img" accept="image/*" hidden />
              <div>
                <p className="text-sm font-bold text-gray-700">Staff Photo</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG or PNG format. If blank, a professional default is used.</p>
              </div>
            </div>

            {/* Input grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alice Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. alice@primeheal.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="Choose a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 555-0101"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Shift Timing</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20 cursor-pointer"
                >
                  <option value="Morning (08:00 AM - 04:00 PM)">Morning (08:00 AM - 04:00 PM)</option>
                  <option value="Evening (04:00 PM - 12:00 AM)">Evening (04:00 PM - 12:00 AM)</option>
                  <option value="Night (12:00 AM - 08:00 AM)">Night (12:00 AM - 08:00 AM)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Desk/Block Location</label>
                <input
                  type="text"
                  placeholder="e.g. Main Lobby, Desk A"
                  value={deskBlock}
                  onChange={(e) => setDeskBlock(e.target.value)}
                  className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-[#4f5fef] text-white py-3 px-8 rounded-xl font-semibold shadow-xs transition-all self-start mt-2"
            >
              Add Staff Profile
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Receptionist;
