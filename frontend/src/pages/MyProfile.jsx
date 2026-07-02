import React, { useState } from 'react'
import { assets } from '../assets/assets'

const MyProfile = () => {

  const [userData,setUserData] = useState({
    name:"Edward Vincent",
    image:assets.profile_pic,
    email:'richardjameswap@gmail.com',
    phone:'0715442254',
    address:{
      line1:"159/1, high level road",
      line2:"maharagama",
    },
    gender:'Male',
    dob:'2000-01-20'
  })

  const[isEdit,setIsEdit]= useState(true)

  return (
    <div className='max-w-lg flex flex-col gap-2 text-sm'>

      {isEdit ? (
        <label className='relative cursor-pointer group block w-36 h-36 rounded overflow-hidden shadow-md border border-gray-200 hover:opacity-90 transition-opacity'>
          <img className='w-full h-full object-cover' src={userData.image} alt="" />
          <div className='absolute inset-0 bg-black/45 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className='text-[10px] font-bold mt-1 uppercase tracking-wider'>Upload Photo</span>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className='hidden' 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (uploadEvent) => {
                  setUserData(prev => ({ ...prev, image: uploadEvent.target.result }));
                };
                reader.readAsDataURL(file);
              }
            }} 
          />
        </label>
      ) : (
        <img className='w-36 h-36 object-cover rounded shadow-sm border border-gray-100' src={userData.image} alt="" />
      )}

      {
        isEdit 
        ? <input className='bg-gray-50 text-3xl font-medium max-w-60 mt-4' type="text" value={userData.name} onChange={e => setUserData(prev =>({...prev,name:e.target.value})) }/>
        : <p className='font-medium test-3xl text-neutral-800 mt-4'>{userData.name}</p>
      }

      <hr className='bg-zinc-400 h-[1px] border-none ' />
      <div>
        <p className='text-neutral-500 underline mt-3 '>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Email id:</p>
          <p className='text-blue-500'>{userData.email}</p>
          <p className='font-medium'>Phone:</p>
          {
            isEdit 
              ? <input className='bg-gray-100 max-w-52' type="text" value={userData.phone} onChange={e => setUserData(prev =>({...prev,phone:e.target.value})) }/>
              : <p className='text-blue-400'>{userData.phone}</p>
          }
          <p className='font-medium'>Address:</p>
          {
            isEdit
              ? <p>
                <input className='bg-gray-50' onChange={(e) => setUserData(prev => ({...prev, address: {...prev.address, line1: e.target.value }}))} value={userData.address.line1} type="text" />
                <br/>
                <input className='bg-gray-50' onChange={(e) => setUserData(prev => ({...prev, address: {...prev.address, line2: e.target.value }}))} value={userData.address.line2} type="text" />
              </p>
              : <p className='text-gray-500'>
                {userData.address.line1}
                <br />
                {userData.address.line2}
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
                 ? <select className='max-w-20 bg-gray-100 ' onChange={(e) => setUserData(prev => ({...prev, gender: e.target.value}))} value ={userData.gender}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                 </select>
                 : <p className='text-gray-400 '>{userData.gender}</p>
               }
              <p className='font-medium'>Birthday:</p>
              {
                isEdit 
                ? <input className='max-w-28 bg-gray-100' type= "date" onChange={(e) => setUserData(prev => ({...prev, dob: e.target.value}))} value={userData.dob}/>
                : <p className='text-gray-400'>{userData.dob}</p>
              }
        </div>
      </div> 

      <div className='mt-10'>
        {
          isEdit 
          ? <button className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all' onClick={()=>setIsEdit(false)}>Save information</button>
          : <button className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all' onClick={()=>setIsEdit(true)}>Edit</button>
        }
      </div> 

    </div>
  )
}

export default MyProfile