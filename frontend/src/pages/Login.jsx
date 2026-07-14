import React, { useState, useEffect, useContext } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser, loginWithGoogle } from '../services/api'

const Login = () => {
  const { setToken } = useContext(AppContext)
  const navigate = useNavigate()

  const [state, setState] = useState('Login') // 'Login' or 'Sign Up'

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nic, setNic] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [address, setAddress] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [allergies, setAllergies] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Slideshow state
  const loginImages = [assets.login1, assets.login2, assets.login3, assets.login4]
  const captions = [
    "Your health is our priority. Connect with expert doctors seamlessly.",
    "Book your appointments with trusted healthcare providers in just a few clicks.",
    "Simplifying healthcare access for you and your family.",
    "Your health is our priority. Connect with expert doctors seamlessly."
  ]
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % loginImages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [loginImages.length])

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!clientId) {
      alert('Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in the frontend environment.')
      return
    }

    if (!window.google?.accounts?.oauth2?.initTokenClient) {
      alert('Google sign-in is still loading. Please try again in a moment.')
      return
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (response) => {
        try {
          if (!response.access_token) {
            throw new Error('No Google access token returned')
          }

          const data = await loginWithGoogle(response.access_token)

          if (data.success) {
            localStorage.setItem('token', data.token)
            setToken(data.token)
            navigate('/')
          } else {
            alert(data.message || 'Google sign-in failed')
          }
        } catch (error) {
          console.error('Google login failed:', error)
          alert(error.response?.data?.message || 'Google sign-in failed')
        }
      }
    })

    tokenClient.requestAccessToken({ prompt: 'consent' })
  }



  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      if (state === 'Login') {
        const data = await loginUser(email, password)
        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          navigate('/')
        }
      } else {
        // Client-side validations
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert('Please enter a valid email address.');
          return;
        }

        const phoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;
        if (phone && !phoneRegex.test(phone)) {
          alert('Please enter a valid Sri Lankan mobile number (e.g. 0771234567).');
          return;
        }

        const nicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
        if (nic && !nicRegex.test(nic)) {
          alert('Please enter a valid Sri Lankan NIC number (e.g. 199912345678 or 991234567v).');
          return;
        }

        const isStrong = (pass) => {
          if (pass.length < 8) return false;
          const hasUpper = /[A-Z]/.test(pass);
          const hasLower = /[a-z]/.test(pass);
          const hasNumber = /[0-9]/.test(pass);
          const hasSpecial = /[^A-Za-z0-9]/.test(pass);
          return hasUpper && hasLower && hasNumber && hasSpecial;
        };

        if (!isStrong(password)) {
          alert('Password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
          return;
        }

        const data = await registerUser({
          name,
          email,
          phone,
          nic,
          password,
          dateOfBirth: dob || null,
          address: address || null,
          emergencyContact: emergencyContact || null,
          allergies: allergies || null
        })

        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          navigate('/')
        }
      }
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || 'Authentication failed')
    }
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col md:flex-row overflow-hidden transition-all duration-300">

      {/* Left side: Slideshow and Branding Overlay */}
      <div className="relative hidden md:block md:w-[58%] h-screen min-h-screen overflow-hidden bg-slate-900">
        {loginImages.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Login Visual ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
          />
        ))}

        {/* Soft dark gradient overlay for text readability at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Branding Logo Overlay - Top Left */}
        <div className="absolute top-12 left-12 flex items-center gap-3 text-white select-none">
          <img className='w-40' src={assets.logo} alt="Prime Heal Logo" />
        </div>

        {/* Dynamic Caption - Bottom */}
        <div className="absolute bottom-16 left-16 right-16 text-white min-h-[5.5rem]">
          <h3 className="text-3xl font-bold leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] transition-all duration-500">
            {captions[currentImageIndex]}
          </h3>
        </div>
      </div>

      {/* Right side: Authentication Form */}
      <div className="w-full md:w-[42%] min-h-screen flex flex-col justify-center bg-white p-8 md:p-12 lg:p-16 overflow-y-auto">
        <form onSubmit={onSubmitHandler} className="w-full max-w-[400px] mx-auto flex flex-col justify-center py-6">
          <div>
            {/* Title & Subtitle */}
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              {state === 'Login' ? 'Sign In' : 'Sign Up'}
            </h2>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed font-normal">
              {state === 'Login'
                ? 'Please sign in to access your appointments and consult expert doctors.'
                : 'Create an account to start booking appointments with trusted healthcare providers.'}
            </p>

            {/* Inputs Container */}
            <div className="mt-8 flex flex-col gap-4">

              {/* Full Name (Sign Up only) */}
              {state === 'Sign Up' && (
                <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              {/* Mobile / Email */}
              <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {state === 'Login' ? 'Mobile number / email ID' : 'Email Address'}
                </label>
                <input
                  type={state === 'Login' ? 'text' : 'email'}
                  required
                  placeholder={state === 'Login' ? 'Enter mobile number or email' : 'Enter email address'}
                  className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Mobile Number (Sign Up only) */}
              {state === 'Sign Up' && (
                <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0771234567"
                    className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}

              {/* NIC Number (Sign Up only) */}
              {state === 'Sign Up' && (
                <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    NIC Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 199912345678 or 991234567v"
                    className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                  />
                </div>
              )}

              {/* Password */}
              <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200 flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Toggle Password Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none ml-2"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Date of Birth (Sign Up only, Optional) */}
              {state === 'Sign Up' && (
                <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              )}

              {/* Address (Sign Up only, Optional) */}
              {state === 'Sign Up' && (
                <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="Enter address"
                    className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}

              {/* Emergency Contact (Sign Up only, Optional) */}
              {state === 'Sign Up' && (
                <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    placeholder="Enter emergency contact number"
                    className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                  />
                </div>
              )}

              {/* Allergies (Sign Up only, Optional) */}
              {state === 'Sign Up' && (
                <div className="relative border border-gray-200/80 rounded-xl px-4 py-2 focus-within:border-[#00B4B4] focus-within:ring-2 focus-within:ring-[#00B4B4]/10 transition-all duration-200">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Allergies
                  </label>
                  <input
                    type="text"
                    placeholder="Enter any allergies (e.g. penicillin)"
                    className="w-full border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0 mt-0.5"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Forgot Password */}
            {state === 'Login' && (
              <button type="button" onClick={() => navigate('/forgot-password')} className="block text-right text-xs text-gray-400 hover:text-[#00B4B4] mt-2 transition-colors duration-150">
                Forgot password?
              </button>
            )}
          </div>

          <div>
            {/* Primary Action Button */}
            <button
              type="submit"
              className="w-full bg-[#00B4B4] hover:bg-[#009E9E] active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl mt-8 transition-all duration-150 shadow-md shadow-[#00B4B4]/10"
            >
              {state === 'Login' ? 'Sign In now' : 'Sign Up now'}
            </button>

            {/* Social Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full border border-gray-200 hover:bg-gray-50 active:scale-[0.98] text-gray-600 font-semibold py-3.5 rounded-xl mt-3 flex items-center justify-center gap-3 transition-all duration-150 text-sm"
            >
              <img src={assets.google_logo} alt="Google Logo" className="w-5 h-5" />
              {state === 'Login' ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            {/* Alternative Action Toggle */}
            <p className="text-center text-sm text-gray-500 mt-8">
              {state === 'Login' ? "Don't have an account?" : "Already have an account?"}
              <span
                onClick={() => setState(state === 'Login' ? 'Sign Up' : 'Login')}
                className="text-[#00B4B4] font-bold cursor-pointer hover:underline ml-1"
              >
                {state === 'Login' ? 'Sign up' : 'Sign in'}
              </span>
            </p>
          </div>
        </form>
      </div>

    </div>
  )
}

export default Login
