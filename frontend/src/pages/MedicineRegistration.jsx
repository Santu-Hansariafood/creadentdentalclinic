import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pill, Tag } from 'lucide-react'
import { fadeIn } from '../utils/motion'
import toast from 'react-hot-toast'
import { useMutation } from '@apollo/client'
import { REGISTER_MEDICINE } from '../graphql/mutations'
import { GET_MEDICINES } from '../graphql/queries'

const MedicineRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: ''
  })

  const [registerMedicine, { loading }] = useMutation(REGISTER_MEDICINE, {
    refetchQueries: [{ query: GET_MEDICINES }],
    onCompleted: () => {
      toast.success('Medicine registered successfully!')
      setFormData({
        name: '',
        category: ''
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
    await registerMedicine({
      variables: {
        ...formData
      }
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          Medicine Registration
        </h1>
        <p className="text-gray-600">Add new medicine to the clinic inventory</p>
      </motion.div>

      <motion.div {...fadeIn('up', 0.2)} className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medicine Name *
              </label>
              <div className="relative">
                <Pill className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="e.g. Amoxicillin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Analgesic">Analgesic</option>
                  <option value="Antiseptic">Antiseptic</option>
                  <option value="Anesthetic">Anesthetic</option>
                  <option value="Anti-inflammatory">Anti-inflammatory</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="btn-primary px-8" disabled={loading}>
              {loading ? 'Registering...' : 'Register Medicine'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default MedicineRegistration
