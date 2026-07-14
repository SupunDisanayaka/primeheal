import React, { useState, useRef, useContext, useEffect } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import { updateUserProfile, uploadProfileImage, deleteProfileImage, changePassword } from '../services/api'
import avatar_blue_hair from '../assets/avatar_blue_hair.png'
import avatar_young_male from '../assets/avatar_young_male.png'
import avatar_young_female from '../assets/avatar_young_female.png'
import avatar_baby_girl from '../assets/avatar_baby_girl.png'
import avatar_baby_boy from '../assets/avatar_baby_boy.png'
import avatar_elder_male from '../assets/avatar_elder_male.png'
import avatar_elder_female from '../assets/avatar_elder_female.png'

const MyProfile = () => {
  const { userData, loadUserProfile, profileLoading, profileError, token } = useContext(AppContext)
  
  const [isEdit, setIsEdit] = useState(false)
  const fileInputRef = useRef(null)
  const [showAvatars, setShowAvatars] = useState(false)

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Local state for editing
  const [formData, setFormData] = useState({
    name: "",
    image: assets.profile_pic,
    email: "",
    phone: "",
    address: { line1: "", line2: "" },
    gender: "Not Selected",
    dob: "",
    nic: "",
    country: "Sri Lanka",
    emergencyContact: "",
    allergies: "",
    specialization: "",
    qualifications: "",
    bio: "",
    consultationFee: 0,
    experience: "",
    labSection: "",
    certificateNumber: ""
  })

  const defaultAvatars = [
    assets.profile_pic,
    avatar_blue_hair,
    avatar_young_male,
    avatar_young_female,
    avatar_baby_girl,
    avatar_baby_boy,
    avatar_elder_male,
    avatar_elder_female,
    assets.doc1,
    assets.doc2,
    assets.doc3,
    assets.doc4,
    assets.doc5,
    assets.doc6
  ]

  // Sync userData with local formData
  useEffect(() => {
    if (userData) {
      const isAddrObj = userData.address && typeof userData.address === 'object';
      const line1 = isAddrObj ? (userData.address.line1 || "") : (userData.address || "");
      const line2 = isAddrObj ? (userData.address.line2 || "") : "";

      // Resolve backend profile image URL if it is relative
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      let resolvedImg = userData.profileImage || userData.image || assets.profile_pic;
      if (typeof resolvedImg === 'string' && resolvedImg.startsWith('/uploads/')) {
        resolvedImg = `${backendUrl.replace('/api', '')}${resolvedImg}`;
      }

      setFormData({
        name: userData.name || "",
        image: resolvedImg,
        email: userData.email || "",
        phone: userData.phone || "",
        address: { 
          line1: line1, 
          line2: line2 
        },
        gender: userData.gender || "Not Selected",
        dob: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : (userData.dob || ""),
        nic: userData.nic || "",
        country: userData.country || "Sri Lanka",
        emergencyContact: userData.emergencyContact || "",
        allergies: userData.allergies || "",
        specialization: userData.specialization || "",
        qualifications: userData.qualifications || "",
        bio: userData.bio || "",
        consultationFee: userData.consultationFee || 0,
        experience: userData.experience || "",
        labSection: userData.labSection || "",
        certificateNumber: userData.certificateNumber || ""
      })
    }
  }, [userData])

  const handlePhotoUpload = async (e) => {
    if (!token) {
      alert("Local storage bypass doesn't support photo uploads to backend. Please log in.");
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!/image\/(jpeg|jpg|png|webp|gif)/i.test(file.type)) {
        alert('Only JPEG, PNG, WEBP, and GIF images are allowed.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB.');
        return;
      }

      const uploadForm = new FormData();
      uploadForm.append('profileImage', file);

      try {
        const response = await uploadProfileImage(uploadForm);
        if (response.success) {
          loadUserProfile();
          alert('Profile picture uploaded successfully!');
        }
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Failed to upload photo');
      }
    }
  }

  const handlePhotoRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    try {
      const response = await deleteProfileImage();
      if (response.success) {
        loadUserProfile();
        alert('Profile picture removed successfully.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to remove photo');
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }
    try {
      const response = await changePassword(currentPassword, newPassword, confirmPassword);
      if (response.success) {
        alert('Password changed successfully! Other device sessions have been logged out.');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to change password');
    }
  }

  const handleSave = async () => {
    if (token) {
      try {
        const userType = userData.userType || userData.role || 'patient';
        let apiData = {
          name: formData.name,
          phone: formData.phone
        };

        if (userType === 'patient') {
          apiData = {
            ...apiData,
            address: formData.address.line1,
            gender: formData.gender === "Not Selected" ? null : formData.gender,
            dateOfBirth: formData.dob || null,
            nic: formData.nic || null,
            country: formData.country,
            emergencyContact: formData.emergencyContact || null,
            allergies: formData.allergies || null
          };
        } else if (userType === 'doctor') {
          apiData = {
            ...apiData,
            fees: formData.consultationFee,
            about: formData.bio,
            speciality: formData.specialization,
            degree: formData.qualifications,
            experience: formData.experience,
            addressLine1: formData.address.line1,
            addressLine2: formData.address.line2
          };
        } else if (userType === 'labstaff') {
          apiData = {
            ...apiData,
            labSection: formData.labSection,
            certificateNumber: formData.certificateNumber
          };
        }

        const response = await updateUserProfile(apiData)
        if (response.success) {
          setIsEdit(false)
          loadUserProfile()
          alert('Profile saved successfully!');
        }
      } catch (error) {
        console.error(error)
        alert(error.response?.data?.message || 'Failed to update profile')
      }
    } else {
      setIsEdit(false)
    }
  }

  if (profileLoading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading profile...</div>
  }

  if (!userData) {
    return (
      <div className="p-8 text-center text-sm text-red-500 font-medium">
        {profileError || 'Profile data could not be loaded.'}
      </div>
    )
  }

  const userType = userData.userType || userData.role || 'patient';

  return (
    <div className='max-w-2xl flex flex-col gap-4 text-sm bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 mt-6'>
      
      {/* Top Section: Photo & Identity */}
      <div className='flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100'>
        <div className='relative w-32 h-32 flex-shrink-0'>
          <img className='w-full h-full object-cover rounded-full shadow-md border-2 border-gray-100 bg-gray-50' src={formData.image} alt="Profile" />
          <div className='absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#00B4B4] border-2 border-white flex items-center justify-center text-white shadow-md cursor-pointer hover:bg-[#009E9E] transition-colors' onClick={() => fileInputRef.current?.click()}>
            <svg className='w-4.5 h-4.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*" 
            className='hidden' 
            onChange={handlePhotoUpload} 
          />
        </div>

        <div className='flex-1 text-center sm:text-left'>
          {isEdit ? (
            <input 
              className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-2xl font-bold text-gray-800 w-full max-w-sm focus:outline-none focus:border-[#00B4B4] focus:ring-1 focus:ring-[#00B4B4]/20' 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} 
            />
          ) : (
            <h2 className='text-2xl font-bold text-gray-800'>{formData.name}</h2>
          )}
          <p className='text-gray-400 capitalize font-medium mt-1'>{userType}</p>
          
          <div className='flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3'>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className='bg-[#00B4B4] hover:bg-[#009E9E] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer'
            >
              Upload Photo
            </button>
            {userData.profileImage && (
              <button 
                type="button" 
                onClick={handlePhotoRemove}
                className='bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer border border-red-200/50'
              >
                Remove
              </button>
            )}
            <button 
              type="button"
              onClick={() => setShowAvatars(prev => !prev)}
              className='bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 rounded-lg transition-colors border border-gray-200/50 cursor-pointer'
            >
              Choose preset
            </button>
          </div>

          {showAvatars && (
            <div className="absolute mt-2 p-3 bg-white border border-gray-200 rounded-xl shadow-xl z-30 w-60">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Preset Avatars</p>
              <div className="grid grid-cols-4 gap-2">
                {defaultAvatars.map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    onClick={async () => {
                      try {
                        const response = await updateUserProfile({ profileImage: av });
                        if (response.success) {
                          loadUserProfile();
                          setShowAvatars(false);
                        }
                      } catch (err) {
                        alert('Failed to set preset avatar');
                      }
                    }}
                    className="w-11 h-11 rounded-full cursor-pointer hover:border-2 hover:border-[#00B4B4] object-cover bg-gray-50 border border-gray-100 hover:scale-105 transition-all"
                    alt=""
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Form Fields */}
      <div className='flex flex-col gap-6'>
        
        {/* Contact Info */}
        <div>
          <h4 className='text-xs font-bold uppercase tracking-wider text-gray-400 mb-3'>Contact Details</h4>
          <div className='grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center text-gray-700'>
            <span className='font-semibold text-gray-500'>Email Address:</span>
            <span className='text-gray-900'>{formData.email}</span>

            <span className='font-semibold text-gray-500'>Phone Number:</span>
            {isEdit ? (
              <input 
                className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:border-[#00B4B4] focus:ring-1 focus:ring-[#00B4B4]/20' 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData(prev => ({...prev, phone: e.target.value}))} 
              />
            ) : (
              <span className='text-gray-900'>{formData.phone || 'Not provided'}</span>
            )}

            <span className='font-semibold text-gray-500'>Primary Address:</span>
            {isEdit ? (
              <div className='flex flex-col gap-1.5 max-w-md w-full'>
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00B4B4] focus:ring-1 focus:ring-[#00B4B4]/20' 
                  type="text" 
                  placeholder="Address Line 1" 
                  value={formData.address.line1} 
                  onChange={e => setFormData(prev => ({...prev, address: {...prev.address, line1: e.target.value}}))} 
                />
                {userType === 'doctor' && (
                  <input 
                    className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00B4B4] focus:ring-1 focus:ring-[#00B4B4]/20' 
                    type="text" 
                    placeholder="Address Line 2" 
                    value={formData.address.line2} 
                    onChange={e => setFormData(prev => ({...prev, address: {...prev.address, line2: e.target.value}}))} 
                  />
                )}
              </div>
            ) : (
              <span className='text-gray-800'>
                {formData.address.line1 || 'Not provided'}
                {formData.address.line2 && <span className='block text-gray-500 mt-0.5'>{formData.address.line2}</span>}
              </span>
            )}
          </div>
        </div>

        {/* Patient Specific Fields */}
        {userType === 'patient' && (
          <div>
            <h4 className='text-xs font-bold uppercase tracking-wider text-gray-400 mb-3'>Medical Profile Details</h4>
            <div className='grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center text-gray-700'>
              <span className='font-semibold text-gray-500'>NIC Number:</span>
              {isEdit ? (
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:border-[#00B4B4] focus:ring-1 focus:ring-[#00B4B4]/20' 
                  type="text" 
                  value={formData.nic} 
                  onChange={e => setFormData(prev => ({...prev, nic: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-900'>{formData.nic || 'Not provided'}</span>
              )}

              <span className='font-semibold text-gray-500'>Country:</span>
              {isEdit ? (
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:border-[#00B4B4] focus:ring-1 focus:ring-[#00B4B4]/20' 
                  type="text" 
                  value={formData.country} 
                  onChange={e => setFormData(prev => ({...prev, country: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-900'>{formData.country}</span>
              )}

              <span className='font-semibold text-gray-500'>Gender:</span>
              {isEdit ? (
                <select 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00B4B4]' 
                  value={formData.gender} 
                  onChange={e => setFormData(prev => ({...prev, gender: e.target.value}))}
                >
                  <option value="Not Selected">Not Selected</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <span className='text-gray-900'>{formData.gender}</span>
              )}

              <span className='font-semibold text-gray-500'>Birthday:</span>
              {isEdit ? (
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00B4B4]' 
                  type="date" 
                  value={formData.dob} 
                  onChange={e => setFormData(prev => ({...prev, dob: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-900'>{formData.dob || 'Not provided'}</span>
              )}

              <span className='font-semibold text-gray-500'>Emergency Contact:</span>
              {isEdit ? (
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:border-[#00B4B4] focus:ring-1 focus:ring-[#00B4B4]/20' 
                  type="text" 
                  value={formData.emergencyContact} 
                  onChange={e => setFormData(prev => ({...prev, emergencyContact: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-900'>{formData.emergencyContact || 'Not provided'}</span>
              )}

              <span className='font-semibold text-gray-500'>Allergies:</span>
              {isEdit ? (
                <textarea 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-md focus:outline-none focus:border-[#00B4B4]' 
                  rows="2"
                  value={formData.allergies} 
                  onChange={e => setFormData(prev => ({...prev, allergies: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-900'>{formData.allergies || 'None'}</span>
              )}
            </div>
          </div>
        )}

        {/* Doctor Specific Fields */}
        {userType === 'doctor' && (
          <div>
            <h4 className='text-xs font-bold uppercase tracking-wider text-gray-400 mb-3'>Doctor Consultation Details</h4>
            <div className='grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center text-gray-700'>
              <span className='font-semibold text-gray-500'>Speciality:</span>
              {isEdit ? (
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:border-[#00B4B4]' 
                  type="text" 
                  value={formData.specialization} 
                  onChange={e => setFormData(prev => ({...prev, specialization: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-900 font-semibold'>{formData.specialization}</span>
              )}

              <span className='font-semibold text-gray-500'>Degree/Qualifications:</span>
              {isEdit ? (
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:border-[#00B4B4]' 
                  type="text" 
                  value={formData.qualifications} 
                  onChange={e => setFormData(prev => ({...prev, qualifications: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-900'>{formData.qualifications}</span>
              )}

              <span className='font-semibold text-gray-500'>Channeling Fees:</span>
              {isEdit ? (
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:border-[#00B4B4]' 
                  type="number" 
                  value={formData.consultationFee} 
                  onChange={e => setFormData(prev => ({...prev, consultationFee: Number(e.target.value)}))} 
                />
              ) : (
                <span className='text-teal-600 font-bold'>LKR {Number(formData.consultationFee).toFixed(2)}</span>
              )}

              <span className='font-semibold text-gray-500'>Experience:</span>
              {isEdit ? (
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:border-[#00B4B4]' 
                  type="text" 
                  value={formData.experience} 
                  onChange={e => setFormData(prev => ({...prev, experience: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-900'>{formData.experience}</span>
              )}

              <span className='font-semibold text-gray-500'>About/Bio:</span>
              {isEdit ? (
                <textarea 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-md focus:outline-none focus:border-[#00B4B4]' 
                  rows="3"
                  value={formData.bio} 
                  onChange={e => setFormData(prev => ({...prev, bio: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-600 leading-relaxed block text-justify'>{formData.bio}</span>
              )}
            </div>
          </div>
        )}

        {/* Lab Staff Specific Fields */}
        {userType === 'labstaff' && (
          <div>
            <h4 className='text-xs font-bold uppercase tracking-wider text-gray-400 mb-3'>Laboratory Details</h4>
            <div className='grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center text-gray-700'>
              <span className='font-semibold text-gray-500'>Lab Section:</span>
              {isEdit ? (
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs' 
                  type="text" 
                  value={formData.labSection} 
                  onChange={e => setFormData(prev => ({...prev, labSection: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-900'>{formData.labSection || 'General Lab'}</span>
              )}

              <span className='font-semibold text-gray-500'>Lab Certificate:</span>
              {isEdit ? (
                <input 
                  className='bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs' 
                  type="text" 
                  value={formData.certificateNumber} 
                  onChange={e => setFormData(prev => ({...prev, certificateNumber: e.target.value}))} 
                />
              ) : (
                <span className='text-gray-900'>{formData.certificateNumber || 'N/A'}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className='flex flex-wrap items-center justify-between border-t border-gray-100 pt-6 mt-4 gap-4'>
        <div className='flex items-center gap-3'>
          {isEdit ? (
            <>
              <button className='bg-[#00B4B4] hover:bg-[#009E9E] text-white font-semibold px-6 py-2.5 rounded-full transition-all duration-200 shadow-sm cursor-pointer' onClick={handleSave}>
                Save Profile
              </button>
              <button className='bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-full transition-all duration-200 cursor-pointer' onClick={() => setIsEdit(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className='border-2 border-[#00B4B4] text-[#00B4B4] hover:bg-[#00B4B4] hover:text-white font-semibold px-8 py-2.5 rounded-full transition-all duration-200 cursor-pointer' onClick={() => setIsEdit(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {token && (
          <button 
            type="button" 
            onClick={() => setShowPasswordModal(true)}
            className='bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-200 font-semibold px-6 py-2.5 rounded-full transition-all duration-200 cursor-pointer text-xs'
          >
            Change Account Password
          </button>
        )}
      </div>

      {/* Password Change Dialog Modal */}
      {showPasswordModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn'>
          <div className='bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 relative animate-scaleUp'>
            <button className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none' onClick={() => setShowPasswordModal(false)}>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className='text-xl font-bold text-gray-800 mb-2'>Update Password</h3>
            <p className='text-xs text-gray-400 mb-6'>Provide your current password and select a strong new one. Changing your password will sign you out of other active browser sessions.</p>

            <form onSubmit={handlePasswordChange} className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1'>
                <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Current Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Enter current password"
                  className='bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00B4B4] focus:ring-1 focus:ring-[#00B4B4]/20'
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-1 mt-2'>
                <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="At least 8 chars + numbers + special"
                  className='bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00B4B4] focus:ring-1 focus:ring-[#00B4B4]/20'
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-1 mt-2'>
                <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Re-enter new password"
                  className='bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00B4B4] focus:ring-1 focus:ring-[#00B4B4]/20'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className='bg-[#00B4B4] hover:bg-[#009E9E] text-white font-semibold py-3 rounded-xl transition-colors mt-6 shadow-md shadow-teal-500/10'
              >
                Change password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyProfile;