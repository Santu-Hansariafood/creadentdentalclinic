import { motion } from 'framer-motion'
import { fadeIn } from '../utils/motion'

const Reports = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-6 sm:mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Reports
        </h1>
        <p className="text-sm sm:text-base text-gray-600">View and manage clinical and financial reports.</p>
      </motion.div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Reports module is coming soon.</p>
      </div>
    </div>
  )
}

export default Reports
