import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const Doctors = () => {

  const { speciality } = useParams()
  const navigate = useNavigate()

  const { doctors, backendUrl } = useContext(AppContext)

  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false) // ✅ fixed
  const getDoctorImage = (item) => {
    if (item.image && typeof item.image === 'string') {
      return item.image.startsWith('http') ? item.image : `${backendUrl}${item.image}`;
    }
    const numericId = parseInt(String(item._id || item.userID || '1').replace(/\D/g, ''), 10) || 1;
    const docKey = `doc${((numericId - 1) % 15) + 1}`;
    return assets[docKey] || assets.doc1;
  };

  // Apply filter
  const applyFilter = () => {
    if (speciality) {
      const target = speciality.toLowerCase().trim().replace(/s$/, '');
      setFilterDoc(
        doctors.filter(doc => {
          if (!doc.speciality) return false;
          const s = doc.speciality.toLowerCase().trim().replace(/s$/, '');
          return s === target || s.includes(target) || target.includes(s);
        })
      )
    } else {
      setFilterDoc(doctors)
    }
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality])

  // Handle navigation + close filter (for mobile)
  const handleFilterClick = (value) => {
    if (speciality === value) {
      navigate('/doctors')
    } else {
      navigate(`/doctors/${value}`)
    }
    setShowFilter(false) // ✅ auto close on mobile
  }

  return (
    <div>
      <p className="text-gray-600">Browse through the doctors specialist.</p>

      <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">

        {/* Mobile Filter Button */}
        <button
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden 
          ${showFilter ? 'bg-blue-500 text-white' : ''}`}
          onClick={() => setShowFilter(prev => !prev)}
        >
          Filters
        </button>

        {/* -------- Left Side (Filters) -------- */}
        <div className={`${showFilter ? 'flex' : 'hidden'} sm:flex flex-col gap-6 text-sm w-full sm:w-64 flex-shrink-0 bg-white/40 backdrop-blur-md border border-white/40 p-6 rounded-[28px] md:rounded-[32px] shadow-lg sm:sticky sm:top-28`}>

          {/* Header branding overlay */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200/40 select-none">
            <div>
              <h4 className="font-bold text-gray-800 text-sm">Specialities</h4>
              <p className="text-[10px] text-gray-500 font-medium">Filter doctors list</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/80 border border-gray-100 flex items-center justify-center text-gray-500 text-xs shadow-xs cursor-pointer hover:bg-white transition-all">
              &gt;
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-extrabold tracking-widest text-gray-400/90 uppercase mb-1 px-2 select-none">Categories</p>

            {/* General physician */}
            <div
              onClick={() => handleFilterClick('General physician')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 group relative
              ${speciality === "General physician"
                  ? "bg-white text-gray-900 shadow-sm font-semibold border-l-4 border-[#00A7A7] pl-2.5"
                  : "text-gray-500 hover:bg-white/30 hover:text-gray-800"}`}
            >
              <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>General physician</span>
            </div>

            {/* Gynecologist */}
            <div
              onClick={() => handleFilterClick('Gynecologist')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 group relative
              ${speciality === "Gynecologist"
                  ? "bg-white text-gray-900 shadow-sm font-semibold border-l-4 border-[#00A7A7] pl-2.5"
                  : "text-gray-500 hover:bg-white/30 hover:text-gray-800"}`}
            >
              <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Gynecologist</span>
            </div>

            {/* Dermatologist */}
            <div
              onClick={() => handleFilterClick('Dermatologist')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 group relative
              ${speciality === "Dermatologist"
                  ? "bg-white text-gray-900 shadow-sm font-semibold border-l-4 border-[#00A7A7] pl-2.5"
                  : "text-gray-500 hover:bg-white/30 hover:text-gray-800"}`}
            >
              <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Dermatologist</span>
            </div>

            {/* Pediatricians */}
            <div
              onClick={() => handleFilterClick('Pediatricians')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 group relative
              ${speciality === "Pediatricians"
                  ? "bg-white text-gray-900 shadow-sm font-semibold border-l-4 border-[#00A7A7] pl-2.5"
                  : "text-gray-500 hover:bg-white/30 hover:text-gray-800"}`}
            >
              <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828-9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Pediatricians</span>
            </div>

            {/* Neurologist */}
            <div
              onClick={() => handleFilterClick('Neurologist')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 group relative
              ${speciality === "Neurologist"
                  ? "bg-white text-gray-900 shadow-sm font-semibold border-l-4 border-[#00A7A7] pl-2.5"
                  : "text-gray-500 hover:bg-white/30 hover:text-gray-800"}`}
            >
              <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Neurologist</span>
            </div>

            {/* Gastroenterologist */}
            <div
              onClick={() => handleFilterClick('Gastroenterologist')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 group relative
              ${speciality === "Gastroenterologist"
                  ? "bg-white text-gray-900 shadow-sm font-semibold border-l-4 border-[#00A7A7] pl-2.5"
                  : "text-gray-500 hover:bg-white/30 hover:text-gray-800"}`}
            >
              <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>Gastroenterologist</span>
            </div>

          </div>

        </div>

        {/* -------- Right Side (Doctors List) -------- */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {
            filterDoc.map((item) => (
              <div
                key={item._id}
                onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0); }}
                className='relative w-full h-[380px] rounded-[32px] overflow-hidden cursor-pointer shadow-lg hover:shadow-xl hover:translate-y-[-8px] transition-all duration-500 group border border-white/20 bg-gradient-to-b from-[#a2c8db] via-[#dceef3] via-[85%] to-[#70824b]'
              >
                {/* Ambient gradient/vignette overlays */}
                <div className='absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/45 via-black/10 to-transparent pointer-events-none z-10'></div>
                <div className='absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-10'></div>

                {/* Main Portrait Image of Doctor */}
                <img
                  src={getDoctorImage(item)}
                  alt={item.name}
                  className='absolute inset-x-0 bottom-0 w-full h-[85%] object-contain object-bottom pointer-events-none group-hover:scale-105 transition-transform duration-500 z-0'
                />

                {/* Content Overlays */}
                <div className='absolute inset-0 p-5 flex flex-col justify-between z-20'>

                  {/* Top: Name and Status */}
                  <div className='text-center'>
                    <h3 className='text-white text-lg md:text-xl font-semibold tracking-wide drop-shadow-sm truncate'>{item.name}</h3>
                    <div className='flex items-center justify-center gap-1.5 mt-1 text-white/85 text-xs'>
                      <span className='font-light tracking-wide'>{item.speciality}</span>
                    </div>
                  </div>

                  {/* Bottom: Info Footer */}
                  <div className='flex items-end justify-between w-full gap-2'>

                    {/* Left: Avatar and Handle */}
                    <div className='flex items-center gap-2 min-w-0'>
                      <img
                        src={getDoctorImage(item)}
                        alt="avatar"
                        className='w-8 h-8 rounded-full border border-white/50 object-cover bg-white/70 flex-shrink-0'
                      />
                      <div className='flex flex-col min-w-0'>
                        <span className='text-white font-medium text-xs truncate'>
                          @{item.name.toLowerCase().replace(/dr\.\s*/, '').replace(/\s+/g, '')}
                        </span>
                        <span className='text-white/60 text-[10px] font-light truncate'>
                          {item.experience} Exp
                        </span>
                      </div>
                    </div>

                    {/* Right: Pill booking button */}
                    <button
                      type='button'
                      onClick={(event) => {
                        event.stopPropagation()
                        navigate(`/appointment/${item._id}`)
                        scrollTo(0, 0)
                      }}
                      className='bg-white text-gray-900 px-4 py-2 rounded-full text-xs font-semibold shadow-md hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-300 flex-shrink-0'
                    >
                      + Book
                    </button>

                  </div>

                </div>
              </div>
            ))
          }
        </div>

      </div>
    </div>
  )
}

export default Doctors