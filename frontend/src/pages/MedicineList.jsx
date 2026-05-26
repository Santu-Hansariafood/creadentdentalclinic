import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Plus, Pill } from 'lucide-react'
import { fadeIn } from '../utils/motion'
import MedicineCard from '../components/MedicineCard'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@apollo/client'
import { GET_MEDICINES } from '../graphql/queries'

const MedicineList = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  const { loading, error, data } = useQuery(GET_MEDICINES)

  if (loading) return <div className="p-6 text-center">Loading inventory...</div>
  if (error) return <div className="p-6 text-center text-red-500">Error loading inventory: {error.message}</div>

  const medicines = data?.getMedicines || []
  const categories = ['All', ...new Set(medicines.map(m => m.category))]

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'All' || medicine.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
              Medicine Inventory
            </h1>
            <p className="text-gray-600">View and manage clinic medication stock</p>
          </div>
          {user.role === 'admin' && (
            <Link to="/admin/medicine-registration" className="btn-primary flex items-center gap-2 self-start md:self-center">
              <Plus size={20} />
              Add Medicine
            </Link>
          )}
          {user.role === 'doctor' && (
            <Link to="/doctor/medicine-registration" className="btn-primary flex items-center gap-2 self-start md:self-center">
              <Plus size={20} />
              Add Medicine
            </Link>
          )}
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search medicines by name or manufacturer..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <select
            className="input-field pl-10"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMedicines.map((medicine, index) => (
          <MedicineCard key={medicine.id} medicine={medicine} delay={index * 0.05} />
        ))}
      </div>

      {filteredMedicines.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Pill size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No medicines found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default MedicineList
