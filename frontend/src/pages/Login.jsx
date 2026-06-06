import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fadeIn } from '../utils/motion'
import { useMutation } from '@apollo/client'
import { FORGOT_PASSWORD, RESET_PASSWORD } from '../graphql/mutations'
import toast from 'react-hot-toast'

const Login = () => {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('login') // 'login', 'forgot', 'reset'
  
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const [forgotPasswordMutation] = useMutation(FORGOT_PASSWORD)
  const [resetPasswordMutation] = useMutation(RESET_PASSWORD)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(phone, password)
    setLoading(false)
    
    if (result.success) {
      navigate('/')
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await forgotPasswordMutation({ variables: { phone } })
      if (data.forgotPassword) {
        toast.success('6-digit OTP sent to your WhatsApp!')
        setView('reset')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await resetPasswordMutation({ 
        variables: { phone, otp, newPassword } 
      })
      if (data.resetPassword) {
        toast.success('Password reset successfully!')
        setView('login')
        setPassword('')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 p-4">
      <motion.div
        {...fadeIn('up')}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-medical rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">DC</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
            {view === 'login' ? 'Welcome Back' : view === 'forgot' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-gray-600">
            {view === 'login' ? 'Sign in to access your creadent dental clinic account' : 
             view === 'forgot' ? 'Enter your registered mobile number to receive an OTP' : 
             'Enter the 6-digit OTP sent to your WhatsApp'}
          </p>
        </div>

        <div className="card">
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field pl-10"
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </motion.form>
            )}

            {view === 'forgot' && (
              <motion.form 
                key="forgot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleForgotSubmit} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field pl-10"
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Sending OTP...' : 'Send WhatsApp OTP'}
                </button>

                <button 
                  type="button"
                  onClick={() => setView('login')}
                  className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </button>
              </motion.form>
            )}

            {view === 'reset' && (
              <motion.form 
                key="reset"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleResetSubmit} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    6-Digit OTP
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="input-field pl-10 tracking-[0.5em] font-bold text-lg"
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field pl-10"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <button 
                  type="button"
                  onClick={() => setView('forgot')}
                  className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  <ArrowLeft size={16} />
                  Resend OTP
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-gray-600">
              <p><strong>Patient:</strong> +1234567890 / password123</p>
              <p><strong>Doctor:</strong> +1987654321 / password123</p>
              <p><strong>Admin:</strong> +1112223333 / password123</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
