import React, { useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { addAccountantAPI } from "../../services/api";

const Accountant = () => {
  const { accountants, setAccountants } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("list"); // 'list' or 'add'
  const [searchTerm, setSearchTerm] = useState("");

  // Add Form State
  const [accImg, setAccImg] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Accountant@123");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Billing & Insurance");
  const [shift, setShift] = useState("Full-Time (09:00 AM - 05:00 PM)");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAccImg(e.target.files[0]);
    }
  };

  const toggleAvailability = (id) => {
    setAccountants((prev) =>
      prev.map((acc) => (acc._id === id ? { ...acc, available: !acc.available } : acc))
    );
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this accountant?")) {
      setAccountants((prev) => prev.filter((acc) => acc._id !== id));
    }
  };

  const handleAddAccountant = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!name || !email || !password || !phone || !department || !shift) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    try {
      const data = await addAccountantAPI({
        name,
        email,
        password,
        phone,
        department,
        shift,
      });

      if (data.success) {
        const newAcc = {
          _id: `acc_${Date.now()}`,
          name,
          email,
          phone,
          image: accImg
            ? URL.createObjectURL(accImg)
            : "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
          department,
          shift,
          available: true,
          createdAt: new Date(),
        };

        setAccountants((prev) => [...prev, newAcc]);
        setSuccessMsg(`Accountant registered successfully! The account can now sign in with ${email} and the chosen password.`);

        setAccImg(null);
        setName("");
        setEmail("");
        setPassword("Accountant@123");
        setPhone("");
        setDepartment("Billing & Insurance");
        setShift("Full-Time (09:00 AM - 05:00 PM)");

        setTimeout(() => {
          setSuccessMsg("");
          setActiveTab("list");
        }, 1800);
      } else {
        setErrorMsg(data.message || "Unable to create accountant account.");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || "Unable to create accountant account.");
    }
  };

  // Filtered List
  const filteredAccountants = accountants.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="m-5 sm:m-8 w-full max-w-6xl">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accountant Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage hospital accountants, departments, shifts, and active status.</p>
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
            Add Accountant
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
              placeholder="Search by name, email or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.value || e.target.value)}
              className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          {/* Cards Grid */}
          {filteredAccountants.length === 0 ? (
            <div className="bg-white p-12 border border-zinc-100 rounded-2xl text-center text-gray-500 font-medium shadow-xs">
              No accountants found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccountants.map((acc) => (
                <div
                  key={acc._id}
                  className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Photo and Badges */}
                    <div className="flex items-start gap-4">
                      <img
                        className="w-16 h-16 rounded-full object-cover bg-slate-100 border border-zinc-100"
                        src={acc.image}
                        alt={acc.name}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-gray-900 truncate">{acc.name}</h4>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{acc.email}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">{acc.phone}</p>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium uppercase tracking-wider">Department</span>
                        <span className="text-gray-800 font-semibold">{acc.department}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium uppercase tracking-wider">Shift</span>
                        <span className="text-gray-800 font-semibold">{acc.shift}</span>
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
                          checked={acc.available}
                          onChange={() => toggleAvailability(acc._id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                      <span className={`text-xs font-bold transition-colors ${acc.available ? "text-primary" : "text-gray-400"}`}>
                        {acc.available ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Delete Icon */}
                    <button
                      onClick={() => handleDelete(acc._id)}
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

      {/* Add New Accountant Tab */}
      {activeTab === "add" && (
        <div className="bg-white border border-zinc-100 p-6 sm:p-8 rounded-2xl shadow-xs max-w-3xl">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <img className="w-5 h-5" src={assets.add_icon} alt="Add" />
            Register New Accountant
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

          <form onSubmit={handleAddAccountant} className="flex flex-col gap-6">
            {/* Image Upload Block */}
            <div className="flex items-center gap-4">
              <label htmlFor="acc-img" className="cursor-pointer group relative">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-zinc-300 group-hover:border-primary flex flex-col items-center justify-center bg-slate-50 transition-colors overflow-hidden">
                  {accImg ? (
                    <img className="w-full h-full object-cover" src={URL.createObjectURL(accImg)} alt="Preview" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <img className="w-6 h-6 opacity-60 group-hover:opacity-100" src={assets.upload_area} alt="Upload" />
                      <span className="text-[10px] text-gray-400 mt-1 font-medium">Upload Photo</span>
                    </div>
                  )}
                </div>
              </label>
              <input onChange={handleImageChange} type="file" id="acc-img" accept="image/*" hidden />
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
                  placeholder="e.g. Sarah Jenkins"
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
                  placeholder="e.g. sarah@primeheal.com"
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
                  placeholder="e.g. +1 555-0201"
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
                  <option value="Full-Time (09:00 AM - 05:00 PM)">Full-Time (09:00 AM - 05:00 PM)</option>
                  <option value="Morning (08:00 AM - 04:00 PM)">Morning (08:00 AM - 04:00 PM)</option>
                  <option value="Evening (04:00 PM - 12:00 AM)">Evening (04:00 PM - 12:00 AM)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20 cursor-pointer"
                >
                  <option value="Billing & Insurance">Billing & Insurance</option>
                  <option value="Payroll & Accounts">Payroll & Accounts</option>
                  <option value="Internal Audit">Internal Audit</option>
                  <option value="Purchasing & Procurement">Purchasing & Procurement</option>
                </select>
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

export default Accountant;
