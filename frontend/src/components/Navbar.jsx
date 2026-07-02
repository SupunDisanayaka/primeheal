import React, { useState, useContext } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import avatar_blue_hair from '../assets/avatar_blue_hair.png'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  const [showMenu, setShowMenu] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { token, setToken, doctors, userData } = useContext(AppContext)

  // Get unique categories/specialties from doctors list
  const allCategories = doctors ? Array.from(new Set(doctors.map(doc => doc.speciality))) : [];

  // Filter categories matching query
  const filteredCategories = searchQuery.trim() !== ''
    ? allCategories.filter(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Filter doctors matching query by name or specialty
  const filteredDoctors = searchQuery.trim() !== '' && doctors
    ? doctors.filter(doc =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.speciality.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  return (
    <div className={`flex items-center justify-between text-sm py-3.5 px-6 border border-white/30 bg-white/75 backdrop-blur-md z-50 rounded-2xl shadow-[0_8px_32px_0_rgba(0,167,167,0.06)] transition-all duration-300 ${isHome ? 'fixed top-4 left-4 right-4 sm:left-[10%] sm:right-[10%]' : 'sticky top-4 mb-8'}`}>

      {/* -------- Logo -------- */}
      <img
        onClick={() => navigate('/')}
        src={assets.logo}
        alt="logo"
        className='w-32 cursor-pointer'
      />

      {/* -------- Desktop Menu -------- */}
      <ul className='hidden md:flex items-center gap-4'>
        <NavLink to='/' className={({ isActive }) => `glass-button ${isActive ? 'active' : ''}`}>
          HOME
        </NavLink>
        <NavLink to='/doctors' className={({ isActive }) => `glass-button ${isActive ? 'active' : ''}`}>
          ALL DOCTORS
        </NavLink>
        <NavLink to='/about' className={({ isActive }) => `glass-button ${isActive ? 'active' : ''}`}>
          ABOUT
        </NavLink>
        <NavLink to='/contact' className={({ isActive }) => `glass-button ${isActive ? 'active' : ''}`}>
          CONTACT
        </NavLink>
      </ul>

      {/* -------- Right Side -------- */}
      <div className='flex items-center gap-4'>

        {/* -------- Search Button -------- */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="glass-button gap-2"
          title="Search doctors or categories"
        >
          <span>Search</span>
          <svg className="w-4 h-4 text-gray-600 hover:text-black transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>

        {token ? (
          <div className='flex items-center gap-2 cursor-pointer group relative'>
            <img className='w-8 h-8 rounded-full border border-white/20 object-cover bg-blue-50' src={userData.image} alt="Profile" />
            <img className='w-2.5' src={assets.dropdown_icon} alt="Dropdown" />

            {/* Dropdown */}
            <div className='absolute top-0 right-0 pt-14 z-20 hidden group-hover:block'>
              <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-955/95 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.45)] rounded-[2rem] p-6 w-72 flex flex-col items-center gap-4 text-center text-white">

                {/* Avatar with circular outline */}
                <div className="w-20 h-20 rounded-full border-2 border-white/90 p-0.5 overflow-hidden shadow-lg bg-slate-850">
                  <img className="w-full h-full rounded-full object-cover" src={userData.image} alt="Avatar" />
                </div>

                {/* Profile Details */}
                <div>
                  <h3 className="font-bold text-lg tracking-wide text-white">{userData.name}</h3>
                  <p className="text-[10px] text-slate-300 font-light mt-1 max-w-[200px] leading-relaxed">
                    "Designer who creates delightful experiences"
                  </p>
                </div>

                {/* Divider Line */}
                <div className="w-full h-[1px] bg-white/10 my-1" />

                {/* Sub-item Glass Boxes */}
                <div className="w-full flex flex-col gap-2.5">
                  <div
                    onClick={() => navigate('/my-profile')}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group cursor-pointer text-sm font-medium text-slate-200 hover:text-white"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                      </svg>
                    </div>
                    <span>My Profile</span>
                  </div>

                  <div
                    onClick={() => navigate('/my-appointments')}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group cursor-pointer text-sm font-medium text-slate-200 hover:text-white"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path>
                      </svg>
                    </div>
                    <span>My Appointments</span>
                  </div>
                </div>

                {/* White Pill Logout Button */}
                <button
                  onClick={() => setToken(false)}
                  className="w-full py-3 mt-1 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  <svg className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"></path>
                  </svg>
                  <span>Logout</span>
                </button>

              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className='bg-[#00A7a7] text-white px-4 py-2 rounded-md hover:bg-[#008f8f]'
          >
            Create account
          </button>
        )}

        {/* -------- Mobile Menu Icon -------- */}
        <img
          onClick={() => setShowMenu(true)}
          className='w-6 md:hidden cursor-pointer'
          src={assets.menu_icon}
          alt="menu"
        />
      </div>

      {/* -------- Mobile Menu -------- */}
      <div
        className={`fixed top-0 right-0 h-full w-[75%] bg-white z-20 transform transition-transform duration-300 md:hidden 
        ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-6 border-b'>
          <img className='w-32' src={assets.logo} alt="logo" />
          <img
            className='w-7 cursor-pointer'
            onClick={() => setShowMenu(false)}
            src={assets.cross_icon}
            alt="close"
          />
        </div>

        {/* Menu Items */}
        <ul className='flex flex-col items-start gap-4 mt-5 px-5 text-lg font-medium'>
          <NavLink onClick={() => setShowMenu(false)} to='/'>
            <p className='px-4 py-2 rounded hover:bg-gray-100 w-full'>HOME</p>
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to='/doctors'>
            <p className='px-4 py-2 rounded hover:bg-gray-100 w-full'>ALL DOCTORS</p>
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to='/about'>
            <p className='px-4 py-2 rounded hover:bg-gray-100 w-full'>ABOUT</p>
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to='/contact'>
            <p className='px-4 py-2 rounded hover:bg-gray-100 w-full'>CONTACT</p>
          </NavLink>
        </ul>
      </div>

      {/* -------- Overlay (optional but nice UX) -------- */}
      {showMenu && (
        <div
          onClick={() => setShowMenu(false)}
          className='fixed inset-0 bg-black opacity-30 z-10 md:hidden'
        />
      )}

      {/* -------- Search Dropdown Card -------- */}
      {showSearchModal && (
        <>
          {/* Invisible click-out handler */}
          <div className="fixed inset-0 z-40" onClick={() => { setShowSearchModal(false); setSearchQuery(''); }} />

          {/* Dropdown Card */}
          <div className="absolute top-full left-0 right-0 mx-auto max-w-2xl mt-3 bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,167,167,0.12)] border border-white/50 z-50 flex flex-col max-h-[70vh] text-left">

            {/* Header: Input & Close button */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search doctor's name or category (specialty)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-100/80 pl-12 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#00A7A7] text-gray-800 transition-all text-base"
                />
              </div>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Results Section */}
            <div className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-thin">
              {searchQuery.trim() === '' ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  Type name of any doctor or category to see results...
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Matching Categories Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                      Matching Categories ({filteredCategories.length})
                    </h3>
                    {filteredCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filteredCategories.map((cat, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              navigate(`/doctors/${cat}`);
                              setShowSearchModal(false);
                              setSearchQuery('');
                            }}
                            className="glass-button bg-slate-50 hover:bg-[#00A7A7]/10 hover:text-[#00A7A7] border-white px-4 py-1.5 text-xs text-gray-600 lowercase first-letter:uppercase transition-all"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No matching categories</p>
                    )}
                  </div>

                  {/* Matching Doctors Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                      Matching Doctors ({filteredDoctors.length})
                    </h3>
                    {filteredDoctors.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {filteredDoctors.map((doc) => (
                          <div
                            key={doc._id}
                            onClick={() => {
                              navigate(`/appointment/${doc._id}`);
                              setShowSearchModal(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/50 hover:bg-[#00A7A7]/5 border border-transparent hover:border-[#00A7A7]/20 transition-all cursor-pointer group"
                          >
                            <img
                              src={doc.image}
                              alt={doc.name}
                              className="w-12 h-12 rounded-full object-cover bg-blue-50 border border-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-800 group-hover:text-[#00A7A7] transition-colors truncate">
                                {doc.name}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">
                                {doc.speciality} • {doc.degree}
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-[#00A7A7] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No matching doctors</p>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  )
}

export default Navbar