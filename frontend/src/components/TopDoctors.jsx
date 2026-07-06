import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const TopDoctors = () => {

  const navigate = useNavigate()
  const { doctors } = useContext(AppContext)
  const [topDoctors, setTopDoctors] = React.useState([])

  React.useEffect(() => {
    // Get appointments from local storage
    const storedApts = JSON.parse(localStorage.getItem('appointments')) || [];
    
    // Count appointments per doctor ID
    const appointmentCounts = {};
    storedApts.forEach(apt => {
      const docId = apt.docId;
      if (docId) {
        appointmentCounts[docId] = (appointmentCounts[docId] || 0) + 1;
      }
    });

    // Group doctors by speciality (category)
    const grouped = {};
    doctors.forEach(doc => {
      if (!grouped[doc.speciality]) {
        grouped[doc.speciality] = [];
      }
      grouped[doc.speciality].push(doc);
    });

    // For each speciality/category, select the doctor with the most appointments
    const list = [];
    Object.keys(grouped).forEach(speciality => {
      const docsInCat = grouped[speciality];
      const sorted = [...docsInCat].sort((a, b) => {
        const countA = appointmentCounts[a._id] || 0;
        const countB = appointmentCounts[b._id] || 0;
        return countB - countA;
      });
      if (sorted.length > 0) {
        list.push(sorted[0]);
      }
    });

    setTopDoctors(list);
  }, [doctors]);

  return (
    <div className='flex flex-col items-center gap-4 my-16 text-gray-900'>
      <h1 className='text-3xl font-medium'>Top Doctors to Book</h1>

      <p className='sm:w-1/3 text-center text-sm'>
        Simply browse through our extensive list of trusted doctors.
      </p>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 pt-5 w-full max-w-7xl px-4'>
        {topDoctors.map((item) => (
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
              src={item.image}
              alt={item.name}
              className='absolute inset-x-0 bottom-0 w-full h-[85%] object-contain object-bottom pointer-events-none group-hover:scale-105 transition-transform duration-500 z-0'
            />

            {/* Content Overlays */}
            <div className='absolute inset-0 p-5 flex flex-col justify-between z-20'>
              
              {/* Top: Name and Status */}
              <div className='text-center'>
                <h3 className='text-white text-lg md:text-xl font-semibold tracking-wide drop-shadow-sm truncate'>{item.name}</h3>
                <div className='flex items-center justify-center gap-1.5 mt-1 text-white/85 text-xs'>
                  {/* Small custom animated spinner */}
                  <svg className='animate-spin h-3.5 w-3.5 text-white/85' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                  <span className='font-light tracking-wide'>{item.speciality}</span>
                </div>
              </div>

              {/* Bottom: Info Footer */}
              <div className='flex items-end justify-between w-full gap-2'>
                
                {/* Left: Avatar and Handle */}
                <div className='flex items-center gap-2 min-w-0'>
                  <img
                    src={item.image}
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
        ))}
      </div>

      <button
        onClick={() => {
          navigate('/doctors')
          scrollTo(0, 0)
        }}
        className='bg-blue-50 text-gray-600 px-12 py-3 rounded-full mt-10'
      >
        More
      </button>
    </div>
  )
}

export default TopDoctors
