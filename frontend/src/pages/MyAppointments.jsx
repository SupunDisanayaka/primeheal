import React, { useContext, useState, useEffect, useCallback } from 'react'
import { AppContext } from '../context/AppContext'
import { cancelAppointment as cancelAppointmentRequest, getMyAppointments, createPaymentSession } from '../services/api'

const MyAppointments = () => {

  const { doctors, currencySymbol, token } = useContext(AppContext)
  const [appointments, setAppointments] = useState([])

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedApt, setSelectedApt] = useState(null)

  // Payment Form States
  const [selectedCard, setSelectedCard] = useState('visa')
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 9842')
  const [expiry, setExpiry] = useState('08 / 19')
  const [cardholderName, setCardholderName] = useState('Jeremiah Miroslavia')
  const [cvv, setCvv] = useState('•••')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Payment Processing States
  const [paymentStatus, setPaymentStatus] = useState('idle') // 'idle', 'processing', 'success'
  const [payingAptId, setPayingAptId] = useState(null)

  const loadAppointments = useCallback(async (allowFallback = true) => {
    try {
      const data = await getMyAppointments();
      if (data.success) {
        setAppointments(data.appointments.map((item) => ({
          ...item,
          appointmentId: item.appointmentId ?? item.appointmentID ?? item._id,
          docAddress: item.docAddress ? JSON.parse(item.docAddress) : item.docAddress
        })));
        return;
      }

      throw new Error(data.message || 'Unable to load appointments');
    } catch (error) {
      console.error('Failed to load appointments from backend.', error);

      if (!allowFallback) {
        throw error;
      }

      const storedApts = localStorage.getItem('appointments')
      if (storedApts) {
        const parsedAppointments = JSON.parse(storedApts).map((item) => ({
          ...item,
          appointmentId: item.appointmentId ?? item.appointmentID ?? item._id
        }));
        setAppointments(parsedAppointments)
      } else {
        // If none exist, let's load default placeholders from doctors.slice(0, 3)
        const defaultApts = doctors.slice(0, 3).map((doc, idx) => ({
          appointmentId: `default_${idx}`,
          docId: doc._id,
          docName: doc.name,
          docImage: doc.image,
          docSpeciality: doc.speciality,
          docAddress: doc.address,
          slotDate: '25, July, 2024',
          slotTime: '8:30 PM',
          status: 'Pending',
          fees: doc.fees,
          isDefault: true
        }))
        localStorage.setItem('appointments', JSON.stringify(defaultApts))
        setAppointments(defaultApts)
      }
    }
  }, [doctors])

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments])

  const openPaymentModal = (apt) => {
    setSelectedApt(apt)
    setCardNumber('•••• •••• •••• 9842')
    setExpiry('08 / 19')
    setCardholderName('Jeremiah Miroslavia')
    setCvv('•••')
    setTermsAccepted(false)
    setPaymentStatus('idle')
    setShowPaymentModal(true)
  }

  const cancelAppointment = async (appointmentId) => {
    const apt = appointments.find(a => String(a.appointmentId) === String(appointmentId))
    if (!apt || apt.isDefault || !token) {
      const updated = appointments.map(a =>
        String(a.appointmentId) === String(appointmentId) ? { ...a, status: 'Cancelled' } : a
      )
      setAppointments(updated)
      localStorage.setItem('appointments', JSON.stringify(updated))
      return
    }

    try {
      const data = await cancelAppointmentRequest(appointmentId)
      if (!data.success) {
        throw new Error(data.message || 'Unable to cancel appointment')
      }

      const updated = appointments.map((apt) =>
        String(apt.appointmentId) === String(appointmentId)
          ? { ...apt, status: 'Cancelled' }
          : apt
      )
      setAppointments(updated)
      localStorage.setItem('appointments', JSON.stringify(updated))

      await loadAppointments(false)
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
      alert(error.response?.data?.message || error.message || 'Unable to cancel appointment')
    }
  }

  const handlePayNow = async (apt) => {
    try {
      setPayingAptId(apt.appointmentId);
      const data = await createPaymentSession(apt.appointmentId);
      if (!data.success) {
        alert(data.message || 'Failed to initiate payment.');
        setPayingAptId(null);
        return;
      }

      // Configure PayHere JS SDK Callbacks
      window.payhere.onCompleted = function onCompleted(orderId) {
        console.log("Payment completed. OrderID:" + orderId);
        
        // Optimistically update frontend state to show Paid and disable buttons immediately
        setAppointments((prev) =>
          prev.map((item) =>
            String(item.appointmentId) === String(apt.appointmentId)
              ? { ...item, status: 'Paid', paymentStatus: 'Completed' }
              : item
          )
        );
        setPayingAptId(null);
        
        let attempts = 0;
        const maxAttempts = 15;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const res = await getMyAppointments();
            if (res.success) {
              const updatedApt = res.appointments.find(
                (a) => String(a.appointmentId) === String(apt.appointmentId)
              );
              if (updatedApt && updatedApt.paymentStatus === 'Completed') {
                clearInterval(interval);
                setAppointments(res.appointments.map((item) => ({
                  ...item,
                  appointmentId: item.appointmentId ?? item.appointmentID ?? item._id,
                  docAddress: item.docAddress ? JSON.parse(item.docAddress) : item.docAddress
                })));
                alert("Payment completed and verified successfully!");
                return;
              }
            }
          } catch (e) {
            console.error('Polling error', e);
          }
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            alert("Payment completed! It may take a moment to update your dashboard.");
            loadAppointments(false);
          }
        }, 1500);
      };

      window.payhere.onDismissed = function onDismissed() {
        console.log("Payment dismissed");
        setPayingAptId(null);
      };

      window.payhere.onError = function onError(error) {
        console.error("Payment error:", error);
        alert("Payment failed: " + error);
        setPayingAptId(null);
      };

      // Launch the PayHere Payment Gateway Sandbox
      const paymentObj = {
        sandbox: true,
        ...data.checkout
      };

      window.payhere.startPayment(paymentObj);
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert(error.response?.data?.message || error.message || 'Failed to start payment.');
      setPayingAptId(null);
    }
  };

  const handleMakePayment = (e) => {
    e.preventDefault()
    if (!termsAccepted) {
      alert("Please accept the terms & conditions to proceed.")
      return
    }

    setPaymentStatus('processing')

    setTimeout(() => {
      // Success transition: Update appointment status to Paid
      const updated = appointments.map(apt =>
        String(apt.appointmentId) === String(selectedApt.appointmentId) ? { ...apt, status: 'Paid' } : apt
      )
      setAppointments(updated)
      localStorage.setItem('appointments', JSON.stringify(updated))
      setPaymentStatus('success')
    }, 1500)
  }

  return (
    <div>
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>

      <div>
        {appointments.map((item, index) => (
          <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b border-gray-100' key={item.appointmentId || item._id || index}>

            <div>
              <img className='w-32 bg-indigo-50 rounded-lg object-cover' src={item.docImage || item.image} alt={item.docName || item.name} />
            </div>

            <div className='flex-1 text-sm text-zinc-600'>
              <p className='text-neutral-800 font-semibold text-base'>{item.docName || item.name}</p>
              <p className='text-xs text-gray-500'>{item.docSpeciality || item.speciality}</p>
              <p className='text-zinc-700 font-medium mt-2'>Address:</p>
              <p className='text-xs'>{(item.docAddress || item.address)?.line1}</p>
              <p className='text-xs'>{(item.docAddress || item.address)?.line2}</p>
              <p className='text-xs mt-2'>
                <span className='text-xs text-neutral-700 font-semibold'>Date & Time:</span> {item.slotDate} | {item.slotTime}
              </p>

              {/* Dynamic Patient Details */}
              {!item.isDefault && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-0.5 border border-gray-100">
                  <p><span className="font-semibold text-gray-700">Patient:</span> {item.patientName} ({item.patientNo})</p>
                  <p><span className="font-semibold text-gray-700">NIC:</span> {item.patientNic} | <span className="font-semibold text-gray-700">Phone:</span> {item.patientPhone}</p>
                  <p><span className="font-semibold text-gray-700">Email:</span> {item.patientEmail} | <span className="font-semibold text-gray-700">Address:</span> {item.patientAddress}</p>
                  <p><span className="font-semibold text-gray-700">No Show Refund:</span> {item.noShowRefund ? <span className="text-teal-600 font-semibold">Yes (Surcharge: 275 LKR)</span> : 'No'}</p>
                  <p><span className="font-semibold text-gray-700">Total Charged:</span> <span className="font-bold text-gray-800">{currencySymbol}{item.fees}{item.noShowRefund && " + 275 LKR"}</span></p>
                </div>
              )}

              {item.paymentStatus === 'Completed' && (
                <div className="mt-2 p-2 bg-emerald-50/50 rounded-lg text-xs text-gray-500 space-y-0.5 border border-emerald-100">
                  <p><span className="font-semibold text-emerald-800">Payment Status:</span> Paid</p>
                  <p><span className="font-semibold text-emerald-800">Transaction ID:</span> {item.transactionId || 'N/A'}</p>
                  <p><span className="font-semibold text-emerald-800">Amount:</span> {currencySymbol}{item.paymentAmount || item.totalCharge || item.fees}</p>
                  {item.receiptUrl && (
                    <p>
                      <span className="font-semibold text-emerald-800">Receipt:</span>{' '}
                      <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Receipt
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
            <div></div>
            <div className='flex flex-col gap-2 justify-end'>
              {item.status === 'Cancelled' && (
                <button disabled className='text-sm text-red-500 text-center sm:min-w-48 py-2 border border-red-200 bg-red-50 rounded font-medium select-none'>
                  Cancelled
                </button>
              )}
              {item.status === 'Completed' && (
                <button disabled className='text-sm text-emerald-600 text-center sm:min-w-48 py-2 border border-emerald-200 bg-emerald-50 rounded font-medium select-none'>
                  Completed
                </button>
              )}
              {item.status === 'Confirmed' && (
                <button disabled className='text-sm text-blue-600 text-center sm:min-w-48 py-2 border border-blue-200 bg-blue-50 rounded font-medium select-none'>
                  Confirmed
                </button>
              )}
              {(item.paymentStatus === 'Completed' || item.status === 'Paid') && item.status !== 'Completed' && item.status !== 'Confirmed' && (
                <button disabled className='text-sm text-teal-600 text-center sm:min-w-48 py-2 border border-teal-200 bg-teal-50 rounded font-medium select-none'>
                  Paid / Payment Successful
                </button>
              )}
              {item.status !== 'Cancelled' && item.status !== 'Completed' && item.status !== 'Confirmed' && item.status !== 'Paid' && item.paymentStatus !== 'Completed' && (
                <>
                  <button
                    onClick={() => {
                      if (token && !item.isDefault) {
                        handlePayNow(item);
                      } else {
                        openPaymentModal(item);
                      }
                    }}
                    disabled={payingAptId === item.appointmentId}
                    className={`text-sm text-center sm:min-w-48 py-2 border rounded transition-all duration-300 ${
                      payingAptId === item.appointmentId
                        ? 'text-stone-400 bg-stone-100 cursor-not-allowed border-stone-200'
                        : 'text-stone-500 hover:bg-primary hover:text-white'
                    }`}
                  >
                    {payingAptId === item.appointmentId ? 'Processing...' : (token && !item.isDefault ? 'Pay Now' : 'Pay Online')}
                  </button>
                  <button
                    onClick={() => cancelAppointment(item.appointmentId)}
                    disabled={payingAptId === item.appointmentId}
                    className={`text-sm text-center sm:min-w-48 py-2 border rounded transition-all duration-300 ${
                      payingAptId === item.appointmentId
                        ? 'text-stone-400 bg-stone-100 cursor-not-allowed border-stone-200'
                        : 'text-stone-500 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    Cancel appointment
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Payment Modal ---------- */}
      {showPaymentModal && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[900px] overflow-hidden flex flex-col md:flex-row border border-gray-100/80 relative transition-all duration-300">

            {/* Close Button */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors z-30"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {paymentStatus === 'success' ? (
              /* Success Screen */
              <div className="w-full p-12 flex flex-col items-center justify-center text-center gap-4 bg-white min-h-[450px]">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 border border-teal-200 shadow-sm animate-pulse">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight mt-2">Payment Successful!</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  Your payment for the appointment with <span className="font-semibold text-gray-700">{selectedApt.docName || selectedApt.name}</span> has been processed successfully.
                </p>
                <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 w-full max-w-xs text-left text-xs text-gray-500 mt-4 space-y-1">
                  <p><span className="font-semibold text-gray-700">Amount Paid:</span> {currencySymbol}{(selectedApt.fees + 24.10).toFixed(2)}</p>
                  <p><span className="font-semibold text-gray-700">Payment Mode:</span> {selectedCard.toUpperCase()} ending in {cardNumber.slice(-4)}</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-[#00B4B4] hover:bg-[#009E9E] text-white font-semibold px-8 py-3 rounded-xl mt-6 transition-all duration-150 shadow-md shadow-[#00B4B4]/10 active:scale-95"
                >
                  Done
                </button>
              </div>
            ) : paymentStatus === 'processing' ? (
              /* Processing Loader */
              <div className="w-full p-12 flex flex-col items-center justify-center text-center gap-4 bg-white min-h-[450px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
                <h3 className="text-xl font-bold text-gray-800 mt-2">Processing Payment...</h3>
                <p className="text-gray-400 text-sm">Please do not close this window or refresh the page.</p>
              </div>
            ) : (
              /* Form & Summary view */
              <>
                {/* Left side: Payment Options Form */}
                <div className="w-full md:w-[60%] p-8 md:p-10 flex flex-col gap-6 bg-white justify-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Payment Options</h2>

                    {/* Sub-tabs */}
                    <div className="flex gap-6 text-[10px] font-extrabold tracking-widest border-b border-gray-100 pb-3 mt-4 text-gray-400 uppercase">
                      <span className="text-[#00B4B4] border-b-2 border-[#00B4B4] pb-3 cursor-pointer">Credit Card</span>
                      <span className="cursor-not-allowed">Online Banking</span>
                      <span className="cursor-not-allowed">Payment Partners</span>
                    </div>
                  </div>

                  {/* Card selector */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedCard('visa')}
                      className={`flex-1 py-4 border rounded-xl flex items-center justify-center transition-all ${selectedCard === 'visa' ? 'border-[#00B4B4] bg-[#00B4B4]/5 ring-2 ring-[#00B4B4]/10 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <span className="text-[#1A1F71] font-black text-xl italic tracking-tight">VISA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCard('mastercard')}
                      className={`flex-1 py-4 border rounded-xl flex items-center justify-center transition-all ${selectedCard === 'mastercard' ? 'border-[#00B4B4] bg-[#00B4B4]/5 ring-2 ring-[#00B4B4]/10 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-1.5 justify-center">
                        <span className="w-4 h-4 rounded-full bg-[#EB001B] opacity-90 block"></span>
                        <span className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-90 block -ml-2.5"></span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCard('amex')}
                      className={`flex-1 py-4 border rounded-xl flex items-center justify-center transition-all ${selectedCard === 'amex' ? 'border-[#00B4B4] bg-[#00B4B4]/5 ring-2 ring-[#00B4B4]/10 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <span className="text-[#0070CD] font-extrabold text-lg italic tracking-wider">AMEX</span>
                    </button>
                  </div>

                  {/* Input Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Card Number */}
                    <div className="col-span-2 relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Card Number</label>
                      <div className="flex items-center justify-between mt-0.5">
                        <input
                          type="text"
                          required
                          className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0"
                          value={cardNumber}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val.startsWith('••••')) val = '';
                            setCardNumber(val);
                          }}
                          placeholder="•••• •••• •••• 9842"
                        />
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect width="18" height="12" x="3" y="6" rx="2" strokeWidth="2" />
                          <path strokeWidth="2" d="M3 11h18" />
                        </svg>
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Exp. Date</label>
                      <input
                        type="text"
                        required
                        className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM / YY"
                      />
                    </div>

                    {/* Cardholder Name */}
                    <div className="col-span-2 relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="Cardholder Name"
                      />
                    </div>

                    {/* CVV */}
                    <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">CVV</label>
                      <input
                        type="password"
                        required
                        className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                        value={cvv}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val.startsWith('•')) val = '';
                          setCvv(val.substring(0, 3));
                        }}
                        placeholder="•••"
                      />
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-500 select-none">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#00B4B4] focus:ring-[#00B4B4]"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span>I accept the terms & conditions</span>
                  </label>
                </div>

                {/* Right side: Booking Summary */}
                <div className="w-full md:w-[40%] bg-slate-50 border-l border-gray-100 p-8 md:p-10 flex flex-col justify-between">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800">Booking Summary</h3>

                    {/* Price breakdown */}
                    <div className="space-y-4 text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>Consultation Fee</span>
                        <span className="font-semibold text-gray-700">{currencySymbol}{selectedApt.fees}.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes & Fees</span>
                        <span className="font-semibold text-gray-700">{currencySymbol}20.00</span>
                      </div>

                      <hr className="border-gray-200" />

                      <div className="flex justify-between font-bold text-gray-700">
                        <span>Subtotal</span>
                        <span>{currencySymbol}{selectedApt.fees + 20}.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Services Tax</span>
                        <span className="font-semibold text-gray-700">{currencySymbol}4.10</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
                    {/* Grand Total */}
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total LKR</span>
                      <span className="text-3xl font-extrabold text-[#00B4B4]">{currencySymbol}{(selectedApt.fees + 24.10).toFixed(2)}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleMakePayment}
                        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 shadow-md ${termsAccepted
                            ? 'bg-[#00B4B4] hover:bg-[#009E9E] shadow-[#00B4B4]/10 active:scale-[0.98]'
                            : 'bg-gray-300 cursor-not-allowed shadow-none'
                          }`}
                      >
                        <span>Make payment</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => alert(`Doctor: ${selectedApt.docName || selectedApt.name}\nSpeciality: ${selectedApt.docSpeciality || selectedApt.speciality}\nSlot Date: ${selectedApt.slotDate}\nSlot Time: ${selectedApt.slotTime}`)}
                        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors font-semibold flex items-center justify-center gap-1.5 py-1"
                      >
                        <span>Booking info</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

export default MyAppointments