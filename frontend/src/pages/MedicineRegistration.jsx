import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pill, Tag, Factory, DollarSign, Package, Calendar, FileText } from 'lucide-react'
import { fadeIn } from '../utils/motion'
import toast from 'react-hot-toast'
import { useMutation } from '@apollo/client'
import { REGISTER_MEDICINE } from '../graphql/mutations'
import { GET_MEDICINES } from '../graphql/queries'

const MedicineRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    dosage: '',
    price: '',
    stock: '',
    expiryDate: '',
    description: ''
  })

  const [registerMedicine, { loading }] = useMutation(REGISTER_MEDICINE, {
    refetchQueries: [{ query: GET_MEDICINES }],
    onCompleted: () => {
      toast.success('Medicine registered successfully!')
      setFormData({
        name: '',
        category: '',
        manufacturer: '',
        dosage: '',
        price: '',
        stock: '',
        expiryDate: '',
        description: ''
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
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer *
              </label>
              <div className="relative">
                <Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="e.g. Pfizer"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage/Strength *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="e.g. 500mg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Unit *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-field"
              placeholder="Enter medicine description and usage instructions..."
            ></textarea>
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
