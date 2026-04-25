import { createContext, useContext, useState, useEffect } from 'react'
import { users } from '../data/mockData'
import { stripeCustomers } from '../data/mockData'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [otpSent, setOtpSent] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password)
    if (foundUser) {
      if (!foundUser.verified) {
        setPendingUser(foundUser)
        setOtpSent(true)
        toast.success('OTP sent to your email')
        return { success: true, requiresOTP: true }
      }
      const stripeCustomer = stripeCustomers.find(c => c.userId === foundUser.id)
      const userWithStripe = { ...foundUser, stripeCustomerId: stripeCustomer?.stripeCustomerId }
      setUser(userWithStripe)
      setIsAuthenticated(true)
      localStorage.setItem('user', JSON.stringify(userWithStripe))
      toast.success(`Welcome back, ${userWithStripe.name}!`)
      return { success: true, requiresOTP: false }
    }
    toast.error('Invalid email or password')
    return { success: false }
  }

  const register = (userData) => {
    const existingUser = users.find(u => u.email === userData.email)
    if (existingUser) {
      toast.error('Email already registered')
      return { success: false }
    }
    const newUser = {
      id: users.length + 1,
      ...userData,
      verified: false
    }
    users.push(newUser)
    setPendingUser(newUser)
    setOtpSent(true)
    toast.success('Registration successful! Please verify your OTP')
    return { success: true }
  }

  const verifyOTP = (otp) => {
    if (otp === '123456' && pendingUser) {
      const verifiedUser = { ...pendingUser, verified: true }
      const userIndex = users.findIndex(u => u.id === pendingUser.id)
      if (userIndex !== -1) {
        users[userIndex] = verifiedUser
      }
      setUser(verifiedUser)
      setIsAuthenticated(true)
      localStorage.setItem('user', JSON.stringify(verifiedUser))
      setPendingUser(null)
      setOtpSent(false)
      toast.success('OTP verified successfully!')
      return { success: true }
    }
    toast.error('Invalid OTP')
    return { success: false }
  }

  const resendOTP = () => {
    if (pendingUser) {
      setOtpSent(true)
      toast.success('OTP resent successfully')
      return { success: true }
    }
    return { success: false }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
  }

  const canProcessPayments = () => {
    return user && ['patient', 'admin'].includes(user.role)
  }

  const canIssueRefunds = () => {
    return user && user.role === 'admin'
  }

  const getStripeCustomerId = () => {
    return user?.stripeCustomerId || null
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    otpSent,
    pendingUser,
    login,
    register,
    verifyOTP,
    resendOTP,
    logout,
    canProcessPayments,
    canIssueRefunds,
    getStripeCustomerId
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}