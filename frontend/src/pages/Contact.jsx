import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {

  const onSubmit = (e) => {
    e.preventDefault();
    alert('Message sent successfully!');
  }

  return (
    <div className="pb-16">
      
      {/* Hero Banner Section */}
      <div className='relative w-full h-[380px] rounded-[2.5rem] overflow-hidden bg-cover bg-center' style={{ backgroundImage: `url(${assets.contact_us})` }}>
        <div className='absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/75 to-slate-800/40 flex flex-col justify-center items-center text-center p-6 z-10'>
          <h1 className='text-white text-4xl md:text-5xl font-extrabold tracking-wide drop-shadow-lg animate-fade-in'>Contact us</h1>
          <p className='text-white/85 text-xs md:text-sm mt-3 max-w-md leading-relaxed font-light uppercase tracking-widest'>
            PrimeHeal is ready to provide the right solution according to your needs
          </p>
        </div>
      </div>

      {/* Main Overlapping Card Container */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-[1.1fr_1.9fr]">
          
          {/* Left Column: Get In Touch */}
          <div className="bg-slate-50/70 p-8 md:p-12 flex flex-col justify-between border-r border-gray-100">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Get in touch</h2>
                <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                  Sociosqu viverra lectus placerat sem efficitur molestie vehicula cubilia leo etiam nam.
                </p>
              </div>

              {/* Contact Info Items */}
              <div className="space-y-6">
                
                {/* Office Info */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#00A7A7] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">Our OFFICE</h3>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      54709 Willms Station <br/> Suite 350, Washington, USA
                    </p>
                  </div>
                </div>

                {/* Call Info */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#00A7A7] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">Call Us</h3>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      Tel: +94715442254
                    </p>
                  </div>
                </div>

                {/* Email Info */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#00A7A7] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">Email Us</h3>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      PrimeHeal@gmail.com
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Careers & Social Section */}
            <div className="mt-8 pt-6 border-t border-gray-200/50 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Careers at PRIMEHEAL</h4>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Learn more about our teams and job openings.
                </p>
                <button className="mt-3 border border-[#00A7A7] text-[#00A7A7] hover:bg-[#00A7A7] hover:text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 shadow-sm active:scale-95">
                  Explore jobs
                </button>
              </div>

              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Follow our social media</p>
                <div className="flex items-center gap-3">
                  <a href="#" className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.002 3.002 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Send Us A Message Form */}
          <form onSubmit={onSubmit} className="p-8 md:p-12 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Send us a message</h2>
            </div>

            <div className="space-y-4">
              
              {/* Row 1: Name and Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 bg-slate-50/30 text-gray-800 text-sm focus:border-[#00A7A7] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</label>
                  <input
                    type="text"
                    placeholder="Company"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 bg-slate-50/30 text-gray-800 text-sm focus:border-[#00A7A7] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Phone and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 bg-slate-50/30 text-gray-800 text-sm focus:border-[#00A7A7] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 bg-slate-50/30 text-gray-800 text-sm focus:border-[#00A7A7] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Subject"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200/80 bg-slate-50/30 text-gray-800 text-sm focus:border-[#00A7A7] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Row 4: Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Message"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200/80 bg-slate-50/30 text-gray-800 text-sm focus:border-[#00A7A7] focus:bg-white focus:outline-none transition-all resize-none"
                />
              </div>

            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Send
            </button>

          </form>

        </div>

        {/* Embedded Interactive Map */}
        <div className="w-full mt-16">
          <iframe 
            src="https://maps.google.com/maps?q=Prime%20Heal%20Medical%20Center,%20opposite%20University%20of%20Sri%20Jayewardenepura,%20Sri%20Lanka&t=&z=17&ie=UTF8&iwloc=&output=embed"
            width="100%" 
            height="450" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full rounded-[2.5rem] shadow-lg border border-gray-100"
          ></iframe>
        </div>

      </div>

    </div>
  )
}

export default Contact