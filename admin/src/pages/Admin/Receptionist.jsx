import React, { useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { addReceptionistAPI } from "../../services/api";

const Receptionist = () => {
  const { receptionists, setReceptionists, receptionistsLoading, receptionistsError, fetchReceptionists, backendUrl } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("list"); // 'list' or 'add'
  const [searchTerm, setSearchTerm] = useState("");

  // Add Form State
  const [recImg, setRecImg] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Receptionist@123");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [shift, setShift] = useState("Morning (08:00 AM - 04:00 PM)");
  const [deskBlock, setDeskBlock] = useState("Main Lobby - Desk A");
  
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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,12}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg("Password too easy to guess. It must be 8-12 characters long and include at least one uppercase letter, one lowercase letter, and one symbol.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("phone", phone);
      formData.append("shift", shift);
      formData.append("deskBlock", deskBlock);
      if (recImg) {
        formData.append("image", recImg);
      }

      const data = await addReceptionistAPI(formData);

      if (data.success) {
        setSuccessMsg(`Receptionist registered successfully! They can log in with ${email}.`);

        setRecImg(null);
        setName("");
        setEmail("");
        setPassword("Receptionist@123");
        setPhone("");
        setShift("Morning (08:00 AM - 04:00 PM)");
        setDeskBlock("Main Lobby - Desk A");

        // Refresh list
        await fetchReceptionists();

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
      (rec.deskBlock || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Receptionist Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage front-desk staff, assigned desks, and active status.</p>
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

          {/* Loading State */}
          {receptionistsLoading && (
            <div className="bg-white p-12 border border-zinc-100 rounded-2xl text-center shadow-xs">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <p className="text-sm text-gray-400 font-medium">Loading staff roster...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!receptionistsLoading && receptionistsError && (
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center shadow-xs">
              <p className="text-rose-600 font-semibold text-sm mb-3">{receptionistsError}</p>
              <button
                onClick={fetchReceptionists}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-[#4f5fef] transition-all"
              >
                Retry
              </button>
            </div>
          )}

          {/* Cards Grid */}
          {!receptionistsLoading && !receptionistsError && (
            filteredReceptionists.length === 0 ? (
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
                        src={rec.image ? (rec.image.startsWith('http') ? rec.image : `${backendUrl}${rec.image}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.name)}&background=6574f0&color=fff&size=64`}
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
                        <span className="text-gray-800 font-semibold">{rec.shift || "Not assigned"}</span>
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
            )
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
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Choose a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +94 77 555 0101"
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
