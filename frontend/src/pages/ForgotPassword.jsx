import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestPasswordReset } from '../services/api'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    try {
      const data = await requestPasswordReset(email)
      setMessage(data.message || 'If an account exists, you will receive password reset instructions.')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Unable to send reset instructions. Please try again later.')
    }
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-[42%] min-h-screen flex flex-col justify-center bg-white p-8 md:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-[400px] mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Reset Password</h2>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">Enter the email address for your account and we’ll send a reset link.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="border border-gray-200 rounded-xl px-4 py-3">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-transparent border-none p-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 mt-1"
              />
            </div>

            <button type="submit" className="w-full bg-[#00B4B4] hover:bg-[#009E9E] text-white font-semibold py-3.5 rounded-xl transition-all duration-150">Send reset link</button>
          </form>

          {message && <p className="mt-4 text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-xl p-3">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}

          <button onClick={() => navigate('/login')} className="mt-6 text-sm text-[#00B4B4] hover:underline">Back to sign in</button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
