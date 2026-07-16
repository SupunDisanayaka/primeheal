import React, { useContext, useState, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { updateDoctorProfile, changePasswordAPI, uploadProfileImageAPI, deleteProfileImageAPI } from "../../services/api";
import { assets } from "../../assets/assets";

const DoctorProfile = () => {
  const { currentDoctorId } = useContext(DoctorContext);
  const { doctors, setDoctors, currencySymbol, backendUrl } = useContext(AppContext);

  // Retrieve current doctor details
  const docInfo = doctors.find((d) => String(d._id) === String(currentDoctorId));

  // Edit Mode state
  const [isEdit, setIsEdit] = useState(false);
  const [fees, setFees] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [about, setAbout] = useState("");
  const [available, setAvailable] = useState(false);

  const [notification, setNotification] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync state with docInfo when docInfo changes or when entering edit mode
  useEffect(() => {
    if (docInfo) {
      setFees(docInfo.fees);
      setAddress1(docInfo.address.line1);
      setAddress2(docInfo.address.line2);
      setAbout(docInfo.about);
      setAvailable(docInfo.available);
    }
  }, [docInfo, isEdit]);

  if (!docInfo) {
    return (
      <div className="m-5 sm:m-8 p-6 text-center text-gray-500 font-medium">
        Error loading profile. Doctor not found.
      </div>
    );
  }

  const handleSave = async () => {
    setNotification("");
    if (!fees || !address1 || !about) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const doctorData = {
        fees: Number(fees),
        about,
        available,
        address: { line1: address1, line2: address2 }
      };

      const res = await updateDoctorProfile(currentDoctorId, doctorData);
      
      if (res.success) {
        setDoctors((prev) =>
          prev.map((doc) =>
            doc._id === currentDoctorId
              ? { ...doc, ...doctorData }
              : doc
          )
        );

        setNotification("Profile details saved successfully!");
        setIsEdit(false);

        setTimeout(() => {
          setNotification("");
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setNotification("");
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await changePasswordAPI({ currentPassword, newPassword, confirmPassword });
      if (res.success) {
        setNotification("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setNotification(""), 3000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNotification("");

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const res = await uploadProfileImageAPI(formData);
      if (res.success) {
        // Reload page or update doctors list in context
        // Since image path is returned in res.imagePath or similar, let's update local context
        const imagePath = res.imagePath || `/uploads/profile/${file.name}`; // fallback or check response
        setDoctors((prev) =>
          prev.map((doc) =>
            doc._id === currentDoctorId
              ? { ...doc, image: res.profileImage || imagePath }
              : doc
          )
        );
        setNotification("Profile photo updated successfully!");
        setTimeout(() => setNotification(""), 3000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to upload photo.");
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm("Are you sure you want to delete your profile photo?")) return;
    setNotification("");
    try {
      const res = await deleteProfileImageAPI();
      if (res.success) {
        setDoctors((prev) =>
          prev.map((doc) =>
            doc._id === currentDoctorId
              ? { ...doc, image: null }
              : doc
          )
        );
        setNotification("Profile photo removed successfully!");
        setTimeout(() => setNotification(""), 3000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete photo.");
    }
  };

  return (
    <div className="m-5 sm:m-8 w-full max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Doctor Profile</h2>

      {notification && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-semibold animate-fade-in shadow-xs">
          {notification}
        </div>
      )}

      <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-xs flex flex-col md:flex-row">
        {/* Left Aspect: Profile Photo */}
        <div className="w-full md:w-1/3 bg-slate-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-zinc-100">
          <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-2xl overflow-hidden shadow-sm border border-zinc-150">
            <img
              className="w-full h-full object-cover"
              src={docInfo.image ? (docInfo.image.startsWith('http') ? docInfo.image : `${backendUrl}${docInfo.image}`) : assets[`doc${(((docInfo._id || docInfo.userID || 0) % 15) + 1)}`]}
              alt={docInfo.name}
            />
          </div>
        </div>

        {/* Right Aspect: Profile Details */}
        <div className="w-full md:w-2/3 p-6 sm:p-8 flex flex-col gap-5 justify-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {docInfo.name}
            </h3>
            <p className="text-sm font-semibold text-gray-400 mt-1">
              {docInfo.degree} - {docInfo.speciality}
            </p>
            <span className="mt-2.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
              {docInfo.experience} Experience
            </span>
          </div>

          <hr className="border-zinc-100" />

          {/* Form details */}
          <div className="flex flex-col gap-4 text-sm">
            {/* About Section */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                About Medical Practitioner
              </p>
              {isEdit ? (
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all bg-gray-50/20 h-24 resize-none"
                  required
                />
              ) : (
                <p className="text-gray-600 leading-relaxed text-sm">{docInfo.about}</p>
              )}
            </div>

            {/* Price Fee & Availability Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Appointment Fee
                </p>
                {isEdit ? (
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-gray-400 font-semibold">Rs.</span>
                    <input
                      type="number"
                      value={fees}
                      onChange={(e) => setFees(e.target.value)}
                      className="pl-7 pr-3 py-2.5 border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                      min="0"
                      required
                    />
                  </div>
                ) : (
                  <p className="text-gray-900 font-bold text-lg">
                    {currencySymbol}
                    {docInfo.fees}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Scheduling Availability
                </p>
                <div className="flex items-center gap-2.5 h-10 select-none">
                  {isEdit ? (
                    <>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={available}
                          onChange={(e) => setAvailable(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                      <span className={`text-xs font-bold ${available ? "text-primary" : "text-gray-400"}`}>
                        {available ? "Available for Bookings" : "Temporarily Away"}
                      </span>
                    </>
                  ) : (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        docInfo.available
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}
                    >
                      {docInfo.available ? "Active & Accepting Patients" : "Away / Unscheduled"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Address Lines */}
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Clinic Location Address
              </p>
              {isEdit ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-2.5 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                    placeholder="Address Line 1"
                    required
                  />
                  <input
                    type="text"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-2.5 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                    placeholder="Address Line 2"
                  />
                </div>
              ) : (
                <div className="text-gray-600 bg-slate-50/50 border border-zinc-100 rounded-xl p-3 text-sm">
                  <p>{docInfo.address.line1}</p>
                  <p className="mt-0.5">{docInfo.address.line2}</p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-zinc-100 mt-2" />

          {/* Action buttons */}
          <div className="flex gap-3">
            {isEdit ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-primary hover:bg-[#4f5fef] text-white py-2.5 px-8 rounded-xl font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  Save Information
                </button>
                <button
                  onClick={() => setIsEdit(false)}
                  className="border border-zinc-250 hover:bg-slate-50 text-gray-600 py-2.5 px-8 rounded-xl font-semibold transition-all cursor-pointer active:scale-95 bg-white"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEdit(true)}
                className="bg-primary hover:bg-[#4f5fef] text-white py-2.5 px-8 rounded-xl font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Settings / Security Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password Block */}
        <div className="bg-white border border-zinc-100 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Security & Password</h3>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-2.5 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-2.5 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-2.5 w-full text-sm text-gray-800 transition-all bg-gray-50/20"
                required
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-primary hover:bg-[#4f5fef] text-white py-2.5 px-6 rounded-xl font-semibold shadow-xs transition-all cursor-pointer text-sm active:scale-95 disabled:opacity-50"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Change Profile Photo Block */}
        <div className="bg-white border border-zinc-100 rounded-2xl p-6 sm:p-8 shadow-xs">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Photo</h3>
          <div className="flex flex-col gap-4 items-center">
            <div className="w-28 h-28 rounded-full overflow-hidden shadow-sm border border-zinc-150 relative group">
              <img
                className="w-full h-full object-cover"
                src={docInfo.image ? (docInfo.image.startsWith('http') ? docInfo.image : `${backendUrl}${docInfo.image}`) : assets[`doc${(((docInfo._id || docInfo.userID || 0) % 15) + 1)}`]}
                alt={docInfo.name}
              />
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              <input
                type="file"
                id="profile-img-upload"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <label
                htmlFor="profile-img-upload"
                className="bg-primary hover:bg-[#4f5fef] text-white py-2.5 px-6 rounded-xl font-semibold shadow-xs transition-all cursor-pointer text-sm text-center block active:scale-95"
              >
                Upload New Photo
              </label>
              <button
                onClick={handleDeletePhoto}
                className="border border-red-200 hover:bg-red-50 text-red-600 py-2.5 px-6 rounded-xl font-semibold transition-all cursor-pointer text-sm active:scale-95 bg-white"
              >
                Remove Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
