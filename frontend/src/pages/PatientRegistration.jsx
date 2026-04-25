import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Calendar, MapPin, Heart, AlertCircle, FileText, Shield } from 'lucide-react'
import { fadeIn } from '../utils/motion'
import toast from 'react-hot-toast'

const PatientRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    bloodGroup: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    allergies: '',
    chronicConditions: '',
    medications: '',
    previousSurgeries: '',
    familyHistory: '',
    lastVisit: '',
    previousTreatments: '',
    currentIssues: '',
    insuranceProvider: '',
    policyNumber: '',
    expiryDate: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success('Patient registered successfully!')
    console.log('Patient data:', formData)
  }

  const steps = [
    { number: 1, title: 'Personal Information', icon: User },
    { number: 2, title: 'Emergency Contact', icon: Phone },
    { number: 3, title: 'Medical History', icon: Heart },
    { number: 4, title: 'Dental History', icon: FileText },
    { number: 5, title: 'Insurance Details', icon: Shield }
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          Patient Registration
        </h1>
        <p className="text-gray-600">Complete the form to register a new patient</p>
      </motion.div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    currentStep >= step.number
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <p className={`text-xs mt-2 text-center ${
                    currentStep >= step.number ? 'text-primary font-medium' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 transition-all ${
                    currentStep > step.number ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <motion.div {...fadeIn('up', 0.2)} className="card">
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                Emergency Contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship *
                  </label>
                  <input
                    type="text"
                    name="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Spouse, Parent, Sibling"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                Medical History
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Known Allergies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="input-field"
                  rows={2}
                  placeholder="List any known allergies (medications, food, etc.)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chronic Conditions
                </label>
                <textarea
                  name="chronicConditions"
                  value={formData.chronicConditions}
                  onChange={handleChange}
                  className="input-field"
                  rows={2}
                  placeholder="List any chronic health conditions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications
                </label>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  className="input-field"
                  rows={2}
                  placeholder="List current medications and dosages"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Surgeries
                </label>
                <textarea
                  name="previousSurgeries"
                  value={formData.previousSurgeries}
                  onChange={handleChange}
                  className="input-field"
                  rows={2}
                  placeholder="List any previous surgeries with dates"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Medical History
                </label>
                <textarea
                  name="familyHistory"
                  value={formData.familyHistory}
                  onChange={handleChange}
                  className="input-field"
                  rows={2}
                  placeholder="Relevant family medical history"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                Dental History
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Dental Visit
                </label>
                <input
                  type="date"
                  name="lastVisit"
                  value={formData.lastVisit}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Dental Treatments
                </label>
                <textarea
                  name="previousTreatments"
                  value={formData.previousTreatments}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describe any previous dental treatments (fillings, root canals, etc.)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Dental Issues
                </label>
                <textarea
                  name="currentIssues"
                  value={formData.currentIssues}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describe any current dental problems or concerns"
                />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                Insurance Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Delta Dental, Cigna"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    name="policyNumber"
                    value={formData.policyNumber}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg mt-4">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Insurance Verification
                    </p>
                    <p className="text-xs text-blue-700">
                      Please ensure all insurance information is accurate. We will verify coverage before your first appointment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="btn-outline"
              >
                Previous
              </button>
            )}
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary ml-auto"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary ml-auto"
              >
                Complete Registration
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default PatientRegistration