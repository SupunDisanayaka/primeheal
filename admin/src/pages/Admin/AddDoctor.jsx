import React, { useState, useContext } from "react";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { addDoctorAPI } from "../../services/api";

const AddDoctor = () => {
  const { setDoctors } = useContext(AppContext);
  const navigate = useNavigate();

  // Form State
  const [docImg, setDocImg] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [experience, setExperience] = useState("1 Year");
  const [fees, setFees] = useState("");
  const [speciality, setSpeciality] = useState("General physician");
  const [degree, setDegree] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [about, setAbout] = useState("");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDocImg(e.target.files[0]);
    }
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!name || !email || !password || !fees || !degree || !address1 || !about) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("name", `Dr. ${name}`);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("speciality", speciality);
    formData.append("degree", degree);
    formData.append("experience", experience);
    formData.append("about", about);
    formData.append("fees", Number(fees));
    formData.append("address1", address1);
    formData.append("address2", address2 || "Colombo 03");
    if (docImg) {
      formData.append("image", docImg);
    }

    addDoctorAPI(formData).then((res) => {
      if (res.success) {
        setSuccessMsg("Doctor successfully added to the roster!");
        // Clear state
        setDocImg(null);
        setName("");
        setEmail("");
        setPassword("");
        setExperience("1 Year");
        setFees("");
        setSpeciality("General physician");
        setDegree("");
        setAddress1("");
        setAddress2("");
        setAbout("");

        // Automatically transition to list after 1.5 seconds
        setTimeout(() => {
          navigate("/doctors-list");
        }, 1500);
      }
    }).catch(err => {
      setErrorMsg(err.response?.data?.message || "Failed to add doctor.");
      console.error(err);
    });
  };

  return (
    <div className="m-5 sm:m-8 w-full max-w-4xl bg-white border border-zinc-100 p-6 sm:p-8 rounded-2xl shadow-xs">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <img className="w-6 h-6" src={assets.add_icon} alt="Add" />
        Add New Doctor Profile
      </h2>

      {/* Notifications */}
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

      <form onSubmit={onSubmitHandler} className="flex flex-col gap-6">
        
        {/* Upload Image Dropzone */}
        <div className="flex items-center gap-4">
          <label htmlFor="doc-img" className="cursor-pointer group relative">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-zinc-300 group-hover:border-primary flex flex-col items-center justify-center bg-slate-50 transition-colors overflow-hidden">
              {docImg ? (
                <img
                  className="w-full h-full object-cover"
                  src={URL.createObjectURL(docImg)}
                  alt="Doctor Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <img className="w-6 h-6 opacity-60 group-hover:opacity-100" src={assets.upload_area} alt="Upload" />
                  <span className="text-[10px] text-gray-400 mt-1 font-medium">Upload Photo</span>
                </div>
              )}
            </div>
          </label>
          <input
            onChange={handleImageChange}
            type="file"
            id="doc-img"
            accept="image/*"
            hidden
          />
          <div>
            <p className="text-sm font-bold text-gray-700">Doctor Profile Image</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG format (Max size: 2MB). If left blank, a professional default is generated.</p>
          </div>
        </div>

        {/* Form fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Doctor Name</label>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                type="text"
                placeholder="e.g. Richard James"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Doctor Email</label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                type="email"
                placeholder="e.g. richard@primeheal.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Password</label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Experience</label>
              <select
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20 cursor-pointer"
              >
                <option value="1 Year">1 Year</option>
                <option value="2 Years">2 Years</option>
                <option value="3 Years">3 Years</option>
                <option value="4 Years">4 Years</option>
                <option value="5 Years">5 Years</option>
                <option value="8 Years">8 Years</option>
                <option value="10 Years">10 Years</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Appointment Fee (LKR)</label>
              <input
                onChange={(e) => setFees(e.target.value)}
                value={fees}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                type="number"
                placeholder="e.g. 50"
                min="0"
                required
              />
            </div>

          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Speciality</label>
              <select
                onChange={(e) => setSpeciality(e.target.value)}
                value={speciality}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20 cursor-pointer"
              >
                <option value="General physician">General physician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatricians">Pediatricians</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Gastroenterologist">Gastroenterologist</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Degree</label>
              <input
                onChange={(e) => setDegree(e.target.value)}
                value={degree}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                type="text"
                placeholder="e.g. MBBS, MD"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Address Line 1</label>
              <input
                onChange={(e) => setAddress1(e.target.value)}
                value={address1}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                type="text"
                placeholder="e.g. 17th Cross, Richmond"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Address Line 2</label>
              <input
                onChange={(e) => setAddress2(e.target.value)}
                value={address2}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                type="text"
                placeholder="e.g. Circle, Ring Road, London"
              />
            </div>

          </div>

        </div>

        {/* Textarea About */}
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">About Doctor</label>
          <textarea
            onChange={(e) => setAbout(e.target.value)}
            value={about}
            className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20 h-28 resize-none"
            placeholder="Introduce the doctor, achievements, credentials, or brief description..."
            required
          />
        </div>

        {/* Add Button */}
        <button
          type="submit"
          className="bg-primary hover:bg-[#4f5fef] text-white py-3.5 px-10 rounded-xl font-semibold shadow-md active:scale-98 transition-all self-start mt-4"
        >
          Add Doctor Profile
        </button>

      </form>
    </div>
  );
};

export default AddDoctor;
