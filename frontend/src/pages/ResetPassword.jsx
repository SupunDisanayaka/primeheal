import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/api'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      setError('Reset token is missing. Please use the link sent to your email or request a new one.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      const data = await resetPassword(token, password)
      setMessage(data.message || 'Password reset successfully. You can now sign in.')
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Unable to reset password. Please try again.')
    }
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-[42%] min-h-screen flex flex-col justify-center bg-white p-8 md:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-[400px] mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Choose a new password</h2>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">Enter a secure password to complete the reset.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="border border-gray-200 rounded-xl px-4 py-3">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full bg-transparent border-none p-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 mt-1"
              />
            </div>
            <div className="border border-gray-200 rounded-xl px-4 py-3">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-transparent border-none p-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 mt-1"
              />
            </div>
            <button type="submit" disabled={!token} className="w-full bg-[#00B4B4] hover:bg-[#009E9E] text-white font-semibold py-3.5 rounded-xl transition-all duration-150">Reset password</button>
          </form>

          {message && <p className="mt-4 text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-xl p-3">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}

          <button onClick={() => navigate('/login')} className="mt-6 text-sm text-[#00B4B4] hover:underline">Back to sign in</button>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
