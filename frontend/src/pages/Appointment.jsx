import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import { createAppointment } from '../services/api'

const Appointment = () => {

  const { docID } = useParams()
<<<<<<< HEAD
  const { doctors, currencySymbol, userData } = useContext(AppContext)
  const daysOfWeek = ['SUN','MON','TUE','WED','THU','FRI','SAT']
=======
  const { doctors, currencySymbol } = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
>>>>>>> 84f2d783fcc04ef938456dcd307ac9b12820a753

  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')

  const navigate = useNavigate()

  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingTime, setBookingTime] = useState(null)
  const [patientNo, setPatientNo] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds

  // Form states
  const [formData, setFormData] = useState({
    country: 'Sri Lanka',
    title: 'Mr',
    name: userData?.name || '',
    phone: userData?.phone || '',
    nic: '',
    email: userData?.email || '',
    address: '',
    noShowRefund: false
  })

  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
        phone: userData.phone || prev.phone
      }))
    }
  }, [userData])

  // Timer Countdown Effect
  useEffect(() => {
    let timer = null;
    if (showBookingModal && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showBookingModal, timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Get selected slot date in a readable format
  const getSelectedSlotDate = () => {
    if (docSlots.length > 0 && docSlots[slotIndex] && docSlots[slotIndex][0]) {
      const date = docSlots[slotIndex][0].datetime;
      const day = date.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
    return '';
  }

  const handleOpenBooking = () => {
    if (!slotTime) {
      alert('Please select a time slot first.');
      return;
    }

    // Set booking click time
    const now = new Date();
    const formattedClickTime = now.toLocaleDateString() + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setBookingTime(formattedClickTime);

    // Generate random patient No (e.g. PT-49281)
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setPatientNo(`PT-${randomNum}`);

    // Reset timer and form
    setTimeLeft(600);
    setFormData({
      country: 'Sri Lanka',
      title: 'Mr',
      name: '',
      phone: '',
      nic: '',
      email: '',
      address: '',
      noShowRefund: false
    });

    setShowBookingModal(true);
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (timeLeft === 0) {
      alert('Session has expired. Please select the slot again.');
      return;
    }

<<<<<<< HEAD
    const payload = {
      doctorUserID: docInfo._id,
      doctorName: docInfo.name,
      appointmentDate: getSelectedSlotDate(),
      appointmentTime: slotTime,
      fee: docInfo.fees,
      totalCharge: formData.noShowRefund ? docInfo.fees + 275 : docInfo.fees,
=======
    // Create new appointment object
    const newAppointment = {
      _id: `apt_${Date.now()}`,
      docId: docInfo._id,
      docName: docInfo.name,
      docImage: docInfo.image,
      docSpeciality: docInfo.speciality,
      docAddress: docInfo.address,
>>>>>>> 84f2d783fcc04ef938456dcd307ac9b12820a753
      patientName: `${formData.title} ${formData.name}`,
      patientPhone: formData.phone,
      patientEmail: formData.email,
      patientNic: formData.nic,
      patientAddress: formData.address,
      patientNo: patientNo,
<<<<<<< HEAD
      docAddress: JSON.stringify(docInfo.address),
      noShowRefund: formData.noShowRefund,
      currency: 'LKR'
    };

    try {
      const data = await createAppointment(payload);
      if (data.success) {
        setShowBookingModal(false);
        navigate('/my-appointments');
      } else {
        alert(data.message || 'Unable to complete appointment. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Unable to complete appointment. Please try again.');
    }
  }

  const fetchDocInfo =async () => {
    const doc = doctors.find(doc => String(doc._id) === String(docID))
    setDocInfo(doc)    
=======
      slotDate: getSelectedSlotDate(),
      slotTime: slotTime,
      status: 'Pending',
      fees: 3500 + Number(docInfo.fees),
      totalCharge: formData.noShowRefund ? `${3500 + Number(docInfo.fees)} + 275 LKR` : `${3500 + Number(docInfo.fees)}`
    };

    // Save to local storage
    const currentApts = JSON.parse(localStorage.getItem('appointments')) || [];
    currentApts.unshift(newAppointment);
    localStorage.setItem('appointments', JSON.stringify(currentApts));

    setShowBookingModal(false);
    navigate('/my-appointments');
  }

  const fetchDocInfo = async () => {
    const doc = doctors.find(doc => doc._id === docID)
    setDocInfo(doc)
>>>>>>> 84f2d783fcc04ef938456dcd307ac9b12820a753
  }

  const getAvailableSlots = async () => {
    setDocSlots([])

    //getting current date
    let today = new Date()

    for (let i = 0; i < 7; i++) {
      //getting date with index
      let currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      //setting end time of the date with index
      let endTime = new Date()
      endTime.setDate(today.getDate() + i)
      endTime.setHours(21, 0, 0, 0)

      //setting hours
      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
      } else {
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }

      let timeSlots = []

      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        // add slot to array
        timeSlots.push({
          datetime: new Date(currentDate),
          time: formattedTime
        })

        //Increment current time by 30 minutes
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }

      setDocSlots(prev => ([...prev, timeSlots]))

    }

  }


  useEffect(() => {
    fetchDocInfo()
  }, [doctors, docID])

  useEffect(() => {
    getAvailableSlots()
  }, [docInfo])

  useEffect(() => {
    console.log(docSlots);
  }, [docSlots])


  if (!docInfo) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Loading appointment details...
      </div>
    )
  }

  return (
    <div>
      {/*---------- Doctor Details ---------- */}
      <div className="flex flex-col sm:flex-row gap-6">

        {/* Left Side: Premium Card representation */}
        <div className="w-full sm:max-w-72 flex-shrink-0">
          <div className='relative w-full h-[380px] rounded-[32px] overflow-hidden shadow-lg border border-white/20 bg-gradient-to-b from-[#a2c8db] via-[#dceef3] to-[#70824b]'>
            {/* Ambient gradient/vignette overlays */}
            <div className='absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/45 via-black/10 to-transparent pointer-events-none z-10'></div>
            <div className='absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-10'></div>

            {/* Main Portrait Image of Doctor */}
            <img
              src={docInfo.image}
              alt={docInfo.name}
              className='absolute inset-x-0 bottom-0 w-full h-[85%] object-contain object-bottom pointer-events-none z-0'
            />

            {/* Content Overlays */}
            <div className='absolute inset-0 p-5 flex flex-col justify-between z-20'>

              {/* Top: Name and Status */}
              <div className='text-center'>
                <h3 className='text-white text-lg md:text-xl font-semibold tracking-wide drop-shadow-sm truncate'>{docInfo.name}</h3>
                <div className='flex items-center justify-center gap-1.5 mt-1 text-white/85 text-xs'>
                  {/* Small custom animated spinner */}
                  <svg className='animate-spin h-3.5 w-3.5 text-white/85' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                  <span className='font-light tracking-wide'>{docInfo.speciality}</span>
                </div>
              </div>

              {/* Bottom: Info Footer */}
              <div className='flex items-end justify-between w-full gap-2'>

                {/* Left: Avatar and Handle */}
                <div className='flex items-center gap-2 min-w-0'>
                  <img
                    src={docInfo.image}
                    alt="avatar"
                    className='w-8 h-8 rounded-full border border-white/50 object-cover bg-white/70 flex-shrink-0'
                  />
                  <div className='flex flex-col min-w-0'>
                    <span className='text-white font-medium text-xs truncate'>
                      @{docInfo.name.toLowerCase().replace(/dr\.\s*/, '').replace(/\s+/g, '')}
                    </span>
                    <span className='text-white/60 text-[10px] font-light truncate'>
                      {docInfo.experience} Exp
                    </span>
                  </div>
                </div>

                {/* Right side indicator: Active label to match button layout */}
                <div className='bg-white/95 text-gray-900 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md select-none flex-shrink-0'>
                  Active
                </div>

              </div>

            </div>
          </div>
        </div>

        <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 sm:mt-0 mt-[-80px]">

          {/* ------ Name ------ */}
          <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
            {docInfo.name}
            <img className="w-5" src={assets.verified_icon} alt="verified" />
          </p>

          {/* ------ Degree & Experience ------ */}
          <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
            <p>{docInfo.degree} • {docInfo.speciality}</p>
            <button className="py-0.5 px-2 border text-xs rounded-full">
              {docInfo.experience}
            </button>
          </div>

          {/* ------- About ------- */}
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
              About <img src={assets.info_icon} alt="info" />
            </p>
            <p className="text-sm text-gray-500 max-w-[700px] mt-1">
              {docInfo.about}
            </p>
          </div>

          {/* -------- Fees -------- */}
          <p className="text-gray-500 font-medium mt-4">
            Channeling fee:
            <span className="text-gray-600 ml-1 font-bold text-teal-600">
              LKR {3500 + Number(docInfo.fees)}
            </span>
            <span className="text-xs text-gray-400 font-normal block mt-1">
              (LKR 3500 base channeling fee + LKR {docInfo.fees} booking fee)
            </span>
          </p>

        </div>
      </div>

      {/*--------- Booking Slots ---------- */}
      <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700 '>
        <p>Booking slots</p>
        <div className='flex gap-3 items-center w- full overflow-scroll mt-4'>
          {
            docSlots.length && docSlots.map((item, index) => (
              <div onClick={() => setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'}`} key={index}>
                <p>{item[0] && daysOfWeek[item[0].datetime.getDate()]}</p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </div>
            ))
          }
        </div>

        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {docSlots.length && docSlots[slotIndex].map((item, index) => (
            <p onClick={() => setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`} key={index}>
              {item.time.toLowerCase()}
            </p>
          ))}
        </div>
        <button onClick={handleOpenBooking} className='bg-[#00A7a7] text-white text-sm font-light px-14 py-3 rounded-full my-6 hover:shadow-md transition-all active:scale-95 duration-150 hover:bg-[#008f8f]'> Book an appointment</button>
      </div>

      {/*----- Listing Related Doctors ----*/}
      <RelatedDoctors docID={docID} speciality={docInfo.speciality} />

      {/* ---------- Patient Booking Modal ---------- */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all duration-300 flex flex-col max-h-[90vh]">

            {/* Modal Top Bar */}
            <div className="bg-gradient-to-r from-[#00A7A7] to-[#008F8F] text-white p-5 select-none relative shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold tracking-wide">Confirm Appointment Booking</h3>
                  <p className="text-xs text-teal-100 mt-1">Clicked: {bookingTime}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold shadow-inner">
                  <span className={`w-2 h-2 rounded-full ${timeLeft < 60 ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`}></span>
                  <span className={timeLeft < 60 ? 'text-rose-200 animate-pulse font-extrabold' : 'text-white'}>{formatTime(timeLeft)}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-teal-50 border-t border-teal-400/30 pt-3">
                <p><span className="font-semibold text-teal-200">Patient No:</span> {patientNo}</p>
                <p><span className="font-semibold text-teal-200">Slot:</span> {getSelectedSlotDate()} ({slotTime.toLowerCase()})</p>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Session Expiration Message */}
              {timeLeft === 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium flex items-center justify-between">
                  <span>Session expired. Please select slot again.</span>
                  <button type="button" onClick={() => setShowBookingModal(false)} className="underline hover:text-rose-800 font-bold">Close</button>
                </div>
              )}

              {/* Title & Name Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Title</label>
                  <select
                    disabled={timeLeft === 0}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                  >
                    <option value="Mr">Mr.</option>
                    <option value="Mrs">Mrs.</option>
                    <option value="Miss">Miss.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Patient Name</label>
                  <input
                    required
                    type="text"
                    disabled={timeLeft === 0}
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Country & NIC Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Country</label>
                  <select
                    disabled={timeLeft === 0}
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                  >
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="India">India</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">NIC Number</label>
                  <input
                    required
                    type="text"
                    disabled={timeLeft === 0}
                    placeholder="e.g. 199912345678"
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Phone & Email Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    disabled={timeLeft === 0}
                    placeholder="e.g. 0771234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    disabled={timeLeft === 0}
                    placeholder="e.g. pat@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Residential Address</label>
                <textarea
                  required
                  rows={2}
                  disabled={timeLeft === 0}
                  placeholder="Enter patient home address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              {/* No Show Refund Checkbox */}
              <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${formData.noShowRefund ? 'bg-teal-50/40 border-teal-200 shadow-sm' : 'border-gray-200 bg-gray-50/20'}`}>
                <input
                  id="noShowRefund"
                  type="checkbox"
                  disabled={timeLeft === 0}
                  checked={formData.noShowRefund}
                  onChange={(e) => setFormData({ ...formData, noShowRefund: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#00A7A7] focus:ring-primary cursor-pointer mt-1"
                />
                <div>
                  <label htmlFor="noShowRefund" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                    No show refund
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {formData.noShowRefund ? (
                      <span className="text-teal-600 font-bold">yes (additional services charge 275 LKR)</span>
                    ) : (
                      "Opt-in for refund if you cannot attend (additional services charge 275 LKR)"
                    )}
                  </p>
                </div>
              </div>

              {/* Fees Summary */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Total Booking Cost:</span>
                <span className="font-bold text-gray-800 text-teal-600">
                  LKR {3500 + Number(docInfo.fees)}
                  {formData.noShowRefund && <span className="text-xs font-semibold text-[#00A7A7] ml-1.5">+ 275 LKR</span>}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={timeLeft === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#00A7A7] hover:bg-[#008f8f] disabled:bg-gray-300 text-white text-sm font-bold shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 transition-all cursor-pointer"
                >
                  Confirm & Book
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Appointment
