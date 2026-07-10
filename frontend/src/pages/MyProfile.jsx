import React, { useState, useContext, useEffect } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import { updateUserProfile } from '../services/api'

const MyProfile = () => {
  const { userData, loadUserProfile, profileLoading, profileError } = useContext(AppContext)
  const [isEdit, setIsEdit] = useState(false)
  
  // Local state for editing
  const [formData, setFormData] = useState({
    name: "",
    image: assets.profile_pic,
    email: "",
    phone: "",
    address: { line1: "", line2: "" },
    gender: "Not Selected",
    dob: ""
  })

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        image: userData.profileImage || assets.profile_pic,
        email: userData.email || "",
        phone: userData.phone || "",
        address: { 
          line1: userData.address || "", 
          line2: "" 
        },
        gender: userData.gender || "Not Selected",
        dob: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : ""
      })
    }
  }, [userData])

  const handleSave = async () => {
    try {
      // Map local form data to API expectations
      const apiData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address.line1,
        gender: formData.gender === "Not Selected" ? null : formData.gender,
        dateOfBirth: formData.dob || null
      }
      
      const response = await updateUserProfile(apiData)
      if (response.success) {
        setIsEdit(false)
        loadUserProfile() // Refresh data from server
      }
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || 'Failed to update profile')
    }
  }

  if (profileLoading) {
    return <div className="p-8 text-center">Loading profile...</div>
  }

  if (!userData) {
    return (
      <div className="p-8 text-center text-sm text-red-500">
        {profileError || 'Profile data could not be loaded.'}
      </div>
    )
  }

  return (
    <div className='max-w-lg flex flex-col gap-2 text-sm'>
      <img className='w-36 rounded' src={formData.image} alt="Profile" />

      {
        isEdit 
        ? <input className='bg-gray-50 text-3xl font-medium max-w-60 mt-4' type="text" value={formData.name} onChange={e => setFormData(prev =>({...prev,name:e.target.value})) }/>
        : <p className='font-medium test-3xl text-neutral-800 mt-4'>{formData.name}</p>
      }

      <hr className='bg-zinc-400 h-[1px] border-none ' />
      <div>
        <p className='text-neutral-500 underline mt-3 '>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Email id:</p>
          <p className='text-blue-500'>{formData.email}</p>
          <p className='font-medium'>Phone:</p>
          {
            isEdit 
              ? <input className='bg-gray-100 max-w-52' type="text" value={formData.phone} onChange={e => setFormData(prev =>({...prev,phone:e.target.value})) }/>
              : <p className='text-blue-400'>{formData.phone || 'Not provided'}</p>
          }
          <p className='font-medium'>Address:</p>
          {
            isEdit
              ? <p>
                <input className='bg-gray-50' onChange={(e) => setFormData(prev => ({...prev, address: {...prev.address, line1: e.target.value }}))} value={formData.address.line1} type="text" />
              </p>
              : <p className='text-gray-500'>
                {formData.address.line1 || 'Not provided'}
              </p>
          }
        </div>
      </div>
      <div>
        <p className='text-neutral-500 underline mt-3'>BASIC INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Gender:</p>
              {
                isEdit 
                 ? <select className='max-w-28 bg-gray-100 ' onChange={(e) => setFormData(prev => ({...prev, gender: e.target.value}))} value ={formData.gender}>
                    <option value="Not Selected">Not Selected</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                 </select>
                 : <p className='text-gray-400 '>{formData.gender}</p>
               }
              <p className='font-medium'>Birthday:</p>
              {
                isEdit 
                ? <input className='max-w-36 bg-gray-100' type= "date" onChange={(e) => setFormData(prev => ({...prev, dob: e.target.value}))} value={formData.dob}/>
                : <p className='text-gray-400'>{formData.dob || 'Not provided'}</p>
              }
        </div>
      </div> 

      <div className='mt-10'>
        {
          isEdit 
          ? <button className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all' onClick={handleSave}>Save information</button>
          : <button className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all' onClick={()=>setIsEdit(true)}>Edit</button>
        }
      </div> 

    </div>
  )
}

export default MyProfile