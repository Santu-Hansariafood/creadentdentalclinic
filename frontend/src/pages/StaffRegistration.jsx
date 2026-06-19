import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Lock, Briefcase, Award, ShieldCheck, UserPlus } from 'lucide-react'
import { fadeIn } from '../utils/motion'
import toast from 'react-hot-toast'
import { useMutation } from '@apollo/client'
import { REGISTER } from '../graphql/mutations'

const StaffRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialization: '',
    license: '',
    role: 'doctor' // Default to doctor
  })

  const [registerStaff, { loading }] = useMutation(REGISTER, {
    onCompleted: () => {
      toast.success('Staff registered successfully!')
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        specialization: '',
        license: '',
        role: 'doctor'
      })
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const { confirmPassword, ...registerData } = formData
    // Only send specialization and license if role is doctor
    const finalData = { ...registerData }
    if (finalData.role !== 'doctor') {
      delete finalData.specialization
      delete finalData.license
    }
    
    await registerStaff({
      variables: finalData
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-6 sm:mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Staff Registration
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Add new staff members to the clinic system</p>
      </motion.div>

      <motion.div {...fadeIn('up', 0.2)} className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Staff Role
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'doctor', label: 'Doctor', icon: Award },
                { id: 'admin', label: 'Admin', icon: ShieldCheck },
                { id: 'employee', label: 'Employee', icon: UserPlus }
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: role.id })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    formData.role === role.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-primary/50 text-gray-600'
                  }`}
                >
                  <role.icon size={24} />
                  <span className="text-sm font-medium">{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="staff@clinic.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>
            </div>

            {/* Doctor-specific fields */}
            {formData.role === 'doctor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="e.g. Orthodontist"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number *
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="license"
                      value={formData.license}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="e.g. LIC-123456"
                      required
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="btn-primary px-8 flex items-center gap-2"
              disabled={loading}
            >
              <UserPlus size={20} />
              {loading ? 'Registering...' : 'Register Staff'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default StaffRegistration
