import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pill, Search, Filter, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { prescriptions } from '../data/mockData'
import PrescriptionCard from '../components/PrescriptionCard'
import { fadeIn, staggerContainer } from '../utils/motion'
import toast from 'react-hot-toast'

const Prescriptions = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const userPrescriptions = prescriptions.filter(pres => {
    if (user.role === 'patient') return pres.patientId === user.id
    if (user.role === 'doctor') return pres.doctorId === user.id
    return true
  })

  const filteredPrescriptions = userPrescriptions.filter(pres => {
    const matchesSearch = pres.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pres.medications.some(med => med.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === 'All' || pres.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleCreatePrescription = (e) => {
    e.preventDefault()
    toast.success('Prescription created successfully!')
    setShowCreateForm(false)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
              Prescriptions
            </h1>
            <p className="text-gray-600">View and manage medication prescriptions</p>
          </div>
          {user.role === 'doctor' && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              New Prescription
            </button>
          )}
        </div>
      </motion.div>

      {showCreateForm && (
        <motion.div {...fadeIn('up', 0.1)} className="card mb-8">
          <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
            Create New Prescription
          </h2>
          <form onSubmit={handleCreatePrescription} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name *
                </label>
                <input type="text" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis *
                </label>
                <input type="text" className="input-field" required />
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Medication Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medication Name *
                    </label>
                    <input type="text" className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosage *
                    </label>
                    <input type="text" className="input-field" placeholder="e.g., 500mg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency *
                    </label>
                    <input type="text" className="input-field" placeholder="e.g., 3 times daily" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration *
                    </label>
                    <input type="text" className="input-field" placeholder="e.g., 7 days" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input type="number" className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions *
                  </label>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="Special instructions for taking this medication"
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea className="input-field" rows={3} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                Create Prescription
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <motion.div {...fadeIn('up', 0.2)} className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {filteredPrescriptions.length > 0 ? (
          filteredPrescriptions.map((pres, index) => (
            <PrescriptionCard key={pres.id} prescription={pres} delay={index * 0.05} />
          ))
        ) : (
          <motion.div {...fadeIn('up')} className="col-span-2 card text-center py-12">
            <Pill size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
              No prescriptions found
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'All'
                ? 'Try adjusting your search or filter'
                : 'No prescriptions available'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default Prescriptions