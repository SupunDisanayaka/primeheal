import React, { useContext, useState, useEffect, useCallback } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import {
  cancelAppointment as cancelAppointmentRequest,
  getMyAppointments,
  createPaymentSession,
  downloadInvoice,
  verifyPaymentAPI,
  rescheduleAppointment,
  getDoctorSlots
} from '../services/api'
import { assets } from '../assets/assets'
import FeedbackModal from '../components/feedback/FeedbackModal'

const MyAppointments = () => {
  const { doctors, currencySymbol, token } = useContext(AppContext)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Payment Modal States (For local fallback sandbox checkout)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedApt, setSelectedApt] = useState(null)

  // Payment Form States
  const [selectedCard, setSelectedCard] = useState('visa')
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 9842')
  const [expiry, setExpiry] = useState('08 / 19')
  const [cardholderName, setCardholderName] = useState('Patient Customer')
  const [cvv, setCvv] = useState('•••')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Payment Processing States
  const [paymentStatus, setPaymentStatus] = useState('idle') 
  const [payingAptId, setPayingAptId] = useState(null)

  // Feedback Modal States
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackApt, setFeedbackApt] = useState(null)

  // Reschedule Modal States
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [rescheduleApt, setRescheduleApt] = useState(null)
  const [newRescheduleDate, setNewRescheduleDate] = useState('')
  const [newRescheduleTime, setNewRescheduleTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [slotLoading, setSlotLoading] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)

  const loadDoctorSlotsForDate = async (docId, selectedDate) => {
    if (!docId) return
    setSlotLoading(true)
    try {
      const data = await getDoctorSlots(docId, selectedDate)
      if (data.success && data.slotsByDate) {
        const dateEntry = data.slotsByDate.find(d => d.date === selectedDate)
        if (dateEntry) {
          setAvailableSlots(dateEntry.slots || [])
        } else if (data.slotsByDate.length > 0) {
          setAvailableSlots(data.slotsByDate[0].slots || [])
        } else {
          setAvailableSlots([])
        }
      }
    } catch (err) {
      console.error("Failed to load doctor slots for reschedule:", err)
      setAvailableSlots([])
    } finally {
      setSlotLoading(false)
    }
  }

  const openRescheduleModal = (apt) => {
    setRescheduleApt(apt)
    const initDate = apt.appointmentDate ? apt.appointmentDate.split('T')[0] : new Date().toISOString().split('T')[0]
    setNewRescheduleDate(initDate)
    setNewRescheduleTime(apt.appointmentTime || '')
    setRescheduleModalOpen(true)
    const docId = apt.doctorUserId || apt.doctorId || apt.docId || apt.doctorID
    loadDoctorSlotsForDate(docId, initDate)
  }

  const handleDateChange = (dateVal) => {
    setNewRescheduleDate(dateVal)
    const docId = rescheduleApt?.doctorUserId || rescheduleApt?.doctorId || rescheduleApt?.docId || rescheduleApt?.doctorID
    loadDoctorSlotsForDate(docId, dateVal)
  }

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault()
    if (!rescheduleApt || !newRescheduleDate || !newRescheduleTime) {
      alert("Please select both a date and an available time slot.")
      return
    }
    setRescheduling(true)
    try {
      const res = await rescheduleAppointment(rescheduleApt.appointmentId, newRescheduleDate, newRescheduleTime)
      if (res.success) {
        alert("Appointment rescheduled successfully!")
        setRescheduleModalOpen(false)
        loadAppointments()
      }
    } catch (err) {
      console.error("Reschedule failed:", err)
      alert(err.response?.data?.message || "Failed to reschedule appointment.")
    } finally {
      setRescheduling(false)
    }
  }

  const loadAppointments = useCallback(async (showLoadingSpinner = false) => {
    if (!token) {
      setAppointments([])
      setLoading(false)
      return
    }
    if (showLoadingSpinner) setLoading(true)
    try {
      const data = await getMyAppointments()
      if (data.success) {
        setAppointments(data.appointments.map((item) => {
          let parsedAddress = item.docAddress;
          if (item.docAddress && typeof item.docAddress === 'string') {
            try {
              parsedAddress = JSON.parse(item.docAddress);
            } catch (e) {
              parsedAddress = { line1: item.docAddress, line2: '' };
            }
          }
          return {
            ...item,
            appointmentId: item.appointmentId ?? item.appointmentID ?? item._id,
            docAddress: parsedAddress
          };
        }))
      }
    } catch (error) {
      console.error('Failed to load appointments from database.', error)
      setAppointments([])
    } finally {
      if (showLoadingSpinner) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadAppointments(true)
  }, [loadAppointments])

  const openPaymentModal = (apt) => {
    setSelectedApt(apt)
    setCardNumber('•••• •••• •••• 9842')
    setExpiry('08 / 19')
    setCardholderName('Patient Customer')
    setCvv('•••')
    setTermsAccepted(false)
    setPaymentStatus('idle')
    setShowPaymentModal(true)
  }

  const openFeedbackModal = (apt) => {
    setFeedbackApt(apt);
    setShowFeedbackModal(true);
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const data = await cancelAppointmentRequest(appointmentId)
      if (data.success) {
        alert('Appointment cancelled successfully.')
        loadAppointments()
      }
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
      alert(error.response?.data?.message || 'Unable to cancel appointment')
    }
  }

  const handlePayNow = async (apt) => {
    try {
      setPayingAptId(apt.appointmentId)
      const data = await createPaymentSession(apt.appointmentId)
      if (!data.success) {
        alert(data.message || 'Failed to initiate payment.')
        setPayingAptId(null)
        return
      }

      const activeOrderId = data.checkout?.order_id || data.payment?.merchantOrderId;

      // Configure PayHere SDK Callbacks
      window.payhere.onCompleted = async function onCompleted(orderId) {
        const finalOrderId = orderId || activeOrderId;
        console.log("Payment completed. OrderID:" + finalOrderId)
        
        // Optimistically update frontend state immediately
        setAppointments((prev) =>
          prev.map((item) =>
            String(item.appointmentId) === String(apt.appointmentId)
              ? { ...item, status: 'Paid', paymentStatus: 'Completed' }
              : item
          )
        )
        setPayingAptId(null)

        // Directly call backend to finalize payment and save 'Paid' status in MySQL DB
        try {
          if (finalOrderId) {
            const verifyRes = await verifyPaymentAPI({ orderId: finalOrderId });
            console.log("[PAYMENT COMPLETE] Backend verification response:", verifyRes);
          }
          await loadAppointments();
        } catch (verifyErr) {
          console.error("Payment verification API error:", verifyErr);
          let attempts = 0
          const maxAttempts = 5
          const interval = setInterval(async () => {
            attempts++
            try {
              const res = await getMyAppointments()
              if (res.success) {
                const updatedApt = res.appointments.find(
                  (a) => String(a.appointmentId ?? a.appointmentID) === String(apt.appointmentId)
                )
                if (updatedApt && (updatedApt.paymentStatus === 'Completed' || updatedApt.status === 'Paid')) {
                  clearInterval(interval)
                  loadAppointments()
                  return
                }
              }
            } catch (e) {
              console.error('Polling error', e)
            }
            if (attempts >= maxAttempts) {
              clearInterval(interval)
              loadAppointments()
            }
          }, 2000)
        }
      }

      window.payhere.onDismissed = function onDismissed() {
        console.log("Payment dismissed")
        setPayingAptId(null)
      }

      window.payhere.onError = function onError(error) {
        console.error("Payment error:", error)
        alert("Payment failed: " + error)
        setPayingAptId(null)
      }

      const paymentObj = {
        sandbox: true,
        ...data.checkout
      }

      window.payhere.startPayment(paymentObj)
    } catch (error) {
      console.error("Payment initiation error:", error)
      alert(error.response?.data?.message || 'Failed to start payment.')
      setPayingAptId(null)
    }
  }

  const handleMakePayment = async (e) => {
    e.preventDefault()
    if (!termsAccepted) {
      alert("Please accept the terms & conditions to proceed.")
      return
    }
    setPaymentStatus('processing')
    try {
      if (selectedApt) {
        const session = await createPaymentSession(selectedApt.appointmentId);
        if (session.success && (session.payment?.merchantOrderId || session.checkout?.order_id)) {
          const orderId = session.payment?.merchantOrderId || session.checkout?.order_id;
          await verifyPaymentAPI({ orderId });
        }
      }
      setPaymentStatus('success')
      await loadAppointments()
    } catch (err) {
      console.error('Payment modal error:', err)
      setPaymentStatus('idle')
      alert('Payment processing failed.')
    }
  }

  const handleDownloadInvoice = async (appointmentId) => {
    try {
      const blob = await downloadInvoice(appointmentId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${appointmentId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (err) {
      console.error(err)
      alert('Failed to download invoice PDF.')
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading appointments...</div>
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h2 className='pb-3 font-semibold text-lg text-zinc-700 border-b border-gray-100'>My Booked Appointments</h2>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mt-6 gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">No appointments booked yet</h3>
          <p className="text-gray-400 text-sm max-w-sm">
            You don't have any upcoming or past medical appointments scheduled in the database.
          </p>
          <button 
            onClick={() => navigate('/doctors')}
            className="bg-[#00B4B4] hover:bg-[#009E9E] text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-teal-500/10 mt-2 cursor-pointer"
          >
            Find & Book a Doctor
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {appointments.map((item, index) => (
            <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 py-6 px-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300' key={item.appointmentId || index}>
              
              <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                <img className='w-full h-full object-cover rounded-xl bg-teal-50/50 border border-gray-100' src={item.docImage || item.image || assets.profile_pic} alt={item.docName || item.name} />
              </div>

              <div className='flex-1 text-sm text-zinc-600 flex flex-col justify-between'>
                <div>
                  <h3 className='text-neutral-800 font-bold text-base leading-tight'>{item.docName || item.name}</h3>
                  <p className='text-xs text-[#00B4B4] font-medium mt-0.5'>{item.docSpeciality || item.speciality}</p>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <p><span className="font-semibold text-gray-500">Date:</span> {(() => { const d = new Date(item.appointmentDate); return !item.appointmentDate || isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString(); })()}</p>
                    <p><span className="font-semibold text-gray-500">Time:</span> {item.appointmentTime}</p>
                    <p className="col-span-2"><span className="font-semibold text-gray-500">Hospital:</span> {item.docAddress?.line1 || 'PrimeHeal specialist center'}, {item.docAddress?.line2 || 'Colombo 03'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-gray-500">Patient: <span className="font-bold text-gray-700">{item.patientName}</span></p>
                    <p className="text-gray-400">Total charge: <span className="font-bold text-teal-600">LKR {Number(item.totalCharge || item.fee).toFixed(2)}</span></p>
                  </div>
                  
                  <div>
                    {item.paymentStatus === 'Completed' || item.status === 'Paid' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Paid / Confirmed
                      </span>
                    ) : item.status === 'Cancelled' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                        Payment Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex sm:flex-col gap-2 justify-end sm:justify-center border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 flex-shrink-0'>
                {item.status === 'Cancelled' && (
                  <button disabled className='w-full sm:min-w-44 text-xs text-red-500 py-2 border border-red-100 bg-red-50/50 rounded-lg font-bold select-none cursor-not-allowed'>
                    Appointment Cancelled
                  </button>
                )}
                
                {item.status === 'Completed' && (
                  <>
                    <span className='w-full sm:min-w-44 text-xs text-center text-emerald-600 py-2 border border-emerald-100 bg-emerald-50/50 rounded-lg font-bold select-none block'>
                      Completed
                    </span>
                    <button
                      onClick={() => openFeedbackModal(item)}
                      className='w-full sm:min-w-44 text-xs text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-500 py-2 border border-amber-300 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs group'
                    >
                      <svg className="w-3.5 h-3.5 text-amber-500 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Leave Feedback</span>
                    </button>
                  </>
                )}
                
                {(item.paymentStatus === 'Completed' || item.status === 'Paid') && (
                  <>
                    <button 
                      onClick={() => handleDownloadInvoice(item.appointmentId)}
                      className='w-full sm:min-w-44 text-xs text-[#00B4B4] hover:bg-[#00B4B4] hover:text-white py-2 border border-[#00B4B4]/30 rounded-lg font-bold transition-all cursor-pointer'
                    >
                      Download Invoice PDF
                    </button>
                    {item.status !== 'Completed' && item.status !== 'Confirmed' && (
                      <button disabled className='w-full sm:min-w-44 text-xs text-teal-600 py-2 bg-teal-50 border border-teal-100 rounded-lg font-bold select-none cursor-not-allowed'>
                        Paid Successful
                      </button>
                    )}
                  </>
                )}

                {item.status !== 'Cancelled' && item.status !== 'Completed' && (
                  <button
                    onClick={() => openRescheduleModal(item)}
                    disabled={payingAptId === item.appointmentId}
                    className='w-full sm:min-w-44 text-xs text-[#187595] hover:bg-[#187595] hover:text-white py-2 border border-[#187595]/30 rounded-lg font-bold transition-all cursor-pointer'
                  >
                    Reschedule Slot
                  </button>
                )}

                {item.status !== 'Cancelled' && item.status !== 'Completed' && item.status !== 'Paid' && item.paymentStatus !== 'Completed' && (
                  <>
                    <button
                      onClick={() => handlePayNow(item)}
                      disabled={payingAptId === item.appointmentId}
                      className={`w-full sm:min-w-44 text-xs text-center py-2.5 rounded-lg font-bold transition-all duration-150 cursor-pointer ${
                        payingAptId === item.appointmentId
                          ? 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
                          : 'bg-[#00B4B4] hover:bg-[#009E9E] text-white shadow-sm shadow-teal-500/10'
                      }`}
                    >
                      {payingAptId === item.appointmentId ? 'Processing...' : 'Pay with PayHere'}
                    </button>
                    <button
                      onClick={() => cancelAppointment(item.appointmentId)}
                      disabled={payingAptId === item.appointmentId}
                      className='w-full sm:min-w-44 text-xs text-gray-500 hover:bg-red-500 hover:text-white hover:border-red-500 py-2 border border-gray-200 rounded-lg font-bold transition-all cursor-pointer'
                    >
                      Cancel Appointment
                    </button>
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Feedback Submission Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        appointment={feedbackApt}
        appointmentID={feedbackApt?.appointmentId || feedbackApt?.appointmentID}
        doctorID={feedbackApt?.doctorID || feedbackApt?.docId}
        doctorName={feedbackApt?.docName || feedbackApt?.doctorName || feedbackApt?.name}
        token={token}
        onSubmitSuccess={() => {
          loadAppointments();
        }}
      />

      {/* ---------- Sandbox Payment Modal ---------- */}
      {showPaymentModal && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[900px] overflow-hidden flex flex-col md:flex-row border border-gray-100/80 relative transition-all duration-300">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors z-30"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {paymentStatus === 'success' ? (
              <div className="w-full p-12 flex flex-col items-center justify-center text-center gap-4 bg-white min-h-[450px]">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 border border-teal-200 shadow-sm animate-pulse">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight mt-2">Payment Successful!</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-[#00B4B4] hover:bg-[#009E9E] text-[#ffffff] font-semibold px-8 py-3 rounded-xl mt-6 cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : paymentStatus === 'processing' ? (
              <div className="w-full p-12 flex flex-col items-center justify-center text-center gap-4 bg-white min-h-[450px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
                <h3 className="text-xl font-bold text-gray-800 mt-2">Processing Payment...</h3>
              </div>
            ) : (
              <>
                <div className="w-full md:w-[60%] p-8 md:p-10 flex flex-col gap-6 bg-white justify-center">
                  <h2 className="text-2xl font-bold text-gray-800">Simulate Payment Options</h2>
                  <div className="flex gap-4">
                    <button type="button" className="flex-1 py-4 border rounded-xl flex items-center justify-center border-[#00B4B4] bg-[#00B4B4]/5 shadow-sm">
                      <span className="text-[#1A1F71] font-black text-xl italic tracking-tight">VISA</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] transition-all duration-200">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Card Number</label>
                      <input
                        type="text"
                        required
                        className="w-full border-none bg-transparent p-0 text-sm text-gray-800 focus:outline-none"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-500 select-none">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#00B4B4]"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span>I accept the terms & conditions</span>
                  </label>
                </div>

                <div className="w-full md:w-[40%] bg-slate-50 border-l border-gray-100 p-8 md:p-10 flex flex-col justify-between">
                  <h3 className="text-xl font-bold text-gray-800 font-sans">Booking Summary</h3>
                  <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total LKR</span>
                      <span className="text-3xl font-extrabold text-[#00B4B4]">{currencySymbol}{(selectedApt.fees + 24.10).toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleMakePayment}
                      className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${termsAccepted ? 'bg-[#00B4B4] hover:bg-[#009E9E]' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                      <span>Simulate Payment</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && rescheduleApt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-100 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reschedule Appointment</h3>
                <p className="text-xs text-gray-500 mt-0.5">With {rescheduleApt.doctorName}</p>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs">
                <span className="text-gray-500 font-medium block">Current Booking:</span>
                <span className="font-bold text-teal-800 text-sm">
                  {new Date(rescheduleApt.appointmentDate).toLocaleDateString()} at {rescheduleApt.appointmentTime}
                </span>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Select New Date *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={newRescheduleDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-primary bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Available Time Slot *</label>
                {slotLoading ? (
                  <p className="text-gray-400 italic py-2">Loading slots for selected date...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-amber-600 italic py-1">No predefined slots for this date. Enter time below:</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 mb-2">
                    {availableSlots.map((slot, idx) => (
                      <button
                        type="button"
                        key={idx}
                        disabled={!slot.available}
                        onClick={() => setNewRescheduleTime(slot.time)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          newRescheduleTime === slot.time
                            ? 'bg-[#00B4B4] text-white border-[#00B4B4] shadow-xs'
                            : slot.available
                            ? 'bg-white hover:bg-teal-50 text-gray-700 border-zinc-200'
                            : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Chosen Slot Time:</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM"
                    value={newRescheduleTime}
                    onChange={(e) => setNewRescheduleTime(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl text-xs focus:outline-primary bg-white font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="px-5 py-2 bg-[#00B4B4] hover:bg-[#009E9E] text-white rounded-xl font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {rescheduling ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyAppointments;