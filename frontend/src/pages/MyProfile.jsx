import React, { useState, useRef, useContext } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import avatar_blue_hair from '../assets/avatar_blue_hair.png'
import avatar_young_male from '../assets/avatar_young_male.png'
import avatar_young_female from '../assets/avatar_young_female.png'
import avatar_baby_girl from '../assets/avatar_baby_girl.png'
import avatar_baby_boy from '../assets/avatar_baby_boy.png'
import avatar_elder_male from '../assets/avatar_elder_male.png'
import avatar_elder_female from '../assets/avatar_elder_female.png'

const MyProfile = () => {

  const { userData, setUserData } = useContext(AppContext)
  const [tempUserData, setTempUserData] = useState({ ...userData })

  const [isEdit, setIsEdit] = useState(true)
  const fileInputRef = useRef(null)
  const [showAvatars, setShowAvatars] = useState(false)
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

  const handleSave = () => {
    setUserData(tempUserData)
    setIsEdit(false)
  }

  const handleEdit = () => {
    setTempUserData({ ...userData })
    setIsEdit(true)
  }

  return (
    <div className='max-w-lg flex flex-col gap-2 text-sm'>

      {isEdit ? (
        <div className='flex items-center gap-6 mt-4'>
          {/* Avatar circle with bottom-right camera badge */}
          <div className='relative w-36 h-36 flex-shrink-0'>
            <img className='w-full h-full object-cover rounded-full shadow-md border border-gray-200' src={tempUserData.image} alt="" />
            <div className='absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#00A7a7] border-2 border-white flex items-center justify-center text-white shadow-md cursor-pointer hover:bg-[#008f8f] transition-colors' onClick={() => fileInputRef.current?.click()}>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*" 
              className='hidden' 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (uploadEvent) => {
                    setTempUserData(prev => ({ ...prev, image: uploadEvent.target.result }));
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />
          </div>

          {/* Action Buttons & Avatar Popover */}
          <div className='relative flex flex-col gap-2'>
            <div className='flex items-center gap-3'>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className='bg-[#00A7a7] hover:bg-[#008f8f] text-white font-semibold px-5 py-2.5 rounded-lg transition-all text-xs shadow-sm shadow-teal-500/10 cursor-pointer'
              >
                Upload New
              </button>
              <button 
                type="button"
                onClick={() => setShowAvatars(prev => !prev)}
                className='bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-lg transition-all text-xs shadow-sm border border-gray-200/50 cursor-pointer'
              >
                Choose avatar
              </button>
            </div>

            {/* Avatar Selector Dropdown Popover */}
            {showAvatars && (
              <div className="absolute top-12 left-0 p-3 bg-white border border-gray-200 rounded-xl shadow-xl z-30 w-60">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select Preset Avatar</p>
                <div className="grid grid-cols-4 gap-2">
                  {defaultAvatars.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      onClick={() => {
                        setTempUserData(prev => ({ ...prev, image: av }));
                        setShowAvatars(false);
                      }}
                      className="w-11 h-11 rounded-full cursor-pointer hover:border-2 hover:border-[#00A7a7] object-cover bg-gray-50 border border-gray-100 hover:scale-105 transition-all"
                      alt=""
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <img className='w-36 h-36 object-cover rounded-full shadow-sm border border-gray-100 mt-4' src={tempUserData.image} alt="" />
      )}

      {
        isEdit 
        ? <input className='bg-gray-50 text-3xl font-medium max-w-60 mt-4' type="text" value={tempUserData.name} onChange={e => setTempUserData(prev =>({...prev,name:e.target.value})) }/>
        : <p className='font-medium test-3xl text-neutral-800 mt-4'>{tempUserData.name}</p>
      }

      <hr className='bg-zinc-400 h-[1px] border-none ' />
      <div>
        <p className='text-neutral-500 underline mt-3 '>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Email id:</p>
          <p className='text-blue-500'>{tempUserData.email}</p>
          <p className='font-medium'>Phone:</p>
          {
            isEdit 
              ? <input className='bg-gray-100 max-w-52' type="text" value={tempUserData.phone} onChange={e => setTempUserData(prev =>({...prev,phone:e.target.value})) }/>
              : <p className='text-blue-400'>{tempUserData.phone}</p>
          }
          <p className='font-medium'>Address:</p>
          {
            isEdit
              ? <p>
                <input className='bg-gray-50' onChange={(e) => setTempUserData(prev => ({...prev, address: {...prev.address, line1: e.target.value }}))} value={tempUserData.address.line1} type="text" />
                <br/>
                <input className='bg-gray-50' onChange={(e) => setTempUserData(prev => ({...prev, address: {...prev.address, line2: e.target.value }}))} value={tempUserData.address.line2} type="text" />
              </p>
              : <p className='text-gray-500'>
                {tempUserData.address.line1}
                <br />
                {tempUserData.address.line2}
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
                 ? <select className='max-w-20 bg-gray-100 ' onChange={(e) => setTempUserData(prev => ({...prev, gender: e.target.value}))} value ={tempUserData.gender}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                 </select>
                 : <p className='text-gray-400 '>{tempUserData.gender}</p>
               }
              <p className='font-medium'>Birthday:</p>
              {
                isEdit 
                ? <input className='max-w-28 bg-gray-100' type= "date" onChange={(e) => setTempUserData(prev => ({...prev, dob: e.target.value}))} value={tempUserData.dob}/>
                : <p className='text-gray-400'>{tempUserData.dob}</p>
              }
        </div>
      </div> 

      <div className='mt-10'>
        {
          isEdit 
          ? <button className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all' onClick={handleSave}>Save information</button>
          : <button className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all' onClick={handleEdit}>Edit</button>
        }
      </div> 

    </div>
  )
}

export default MyProfile