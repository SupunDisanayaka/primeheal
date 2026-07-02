import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'

const Header = () => {
  const images = [
    assets.header_img_01,
    assets.header_img_02,
    assets.header_img_03,
    assets.header_img_04,
    assets.header_img_05,
    assets.header_img_06,
    assets.header_img_07,
    assets.header_img_08
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000) // 5 seconds interval
    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="relative w-full overflow-hidden bg-slate-900 min-h-[420px] md:min-h-[460px] flex transition-all duration-300">

      {/* Background Slideshow */}
      <div className="absolute inset-0 w-full h-full z-0">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Header Background ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover object-right transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
          />
        ))}
      </div>

      {/* Primary Brand Gradient Shade Overlay */}
      <div className="absolute inset-y-0 left-0 w-full md:w-[50%] bg-gradient-to-b from-[#00A7A7]/90 via-[#00A7A7]/80 to-[#00A7A7]/45 md:bg-gradient-to-r md:from-[#00A7A7]/95 md:to-transparent z-10 pointer-events-none" />

      {/* Content Wrapper */}
      <div className="relative z-20 w-full mx-auto px-4 sm:px-[10%] flex flex-col md:flex-row min-h-[420px] md:min-h-[460px]">
        {/* Left Side Content Container */}
        <div className="w-full md:w-1/2 flex flex-col items-start justify-center gap-4 pt-28 pb-12 md:py-[10vw]">
          <p className="text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight">
            Book Appointment<br /> With Trusted Doctors
          </p>
          <div className="flex flex-col md:flex-row items-center gap-3 text-white text-sm font-light">
            <img className="w-28" src={assets.group_profiles} alt="Profiles" />
            <p>
              Simply browse through our extensive list of trusted doctors,<br className="hidden sm:block" /> schedule your appointment hassle-free.
            </p>
          </div>
          <a
            href="#speciality"
            className="flex items-center gap-2 bg-white px-8 py-3 rounded-full text-gray-600 text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300"
          >
            Book appointment <img className="w-3" src={assets.arrow_icon} alt="Arrow" />
          </a>
        </div>

        {/* Right Side Spacer Container (empty, since image is now in background) */}
        <div className="hidden md:block md:w-1/2" />
      </div>

    </div>
  )
}

export default Header