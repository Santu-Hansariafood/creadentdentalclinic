import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fadeIn } from '../utils/motion'

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(60)
  const { verifyOTP, resendOTP, pendingUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!pendingUser) {
      navigate('/login')
      return
    }

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [pendingUser, navigate])

  const handleChange = (index, value) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpValue = otp.join('')
    if (otpValue.length !== 6) return

    setLoading(true)
    const result = verifyOTP(otpValue)
    setLoading(false)

    if (result.success) {
      navigate('/')
    }
  }

  const handleResend = () => {
    resendOTP()
    setTimer(60)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 p-4">
      <motion.div
        {...fadeIn('up')}
        className="w-full max-w-md"
      >
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back to login</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-medical rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="text-white" size={40} />
          </div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
            Verify Your Account
          </h1>
          <p className="text-gray-600">
            We've sent a verification code to
          </p>
          <p className="text-primary font-medium mt-1">
            {pendingUser?.email}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter 6-digit code
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="btn-primary w-full"
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            {timer > 0 ? (
              <p className="text-sm text-gray-600">
                Resend code in{' '}
                <span className="font-medium text-primary">{timer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-primary font-medium hover:underline"
              >
                Resend verification code
              </button>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900 text-center">
              <strong>Demo OTP:</strong> Use <span className="font-mono font-bold">123456</span> to verify
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default OTPVerification