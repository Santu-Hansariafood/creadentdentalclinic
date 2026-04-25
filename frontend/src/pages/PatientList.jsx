import { motion } from 'framer-motion'
import { fadeIn } from '../utils/motion'
import PatientCard from '../components/PatientCard'
import { patients } from '../data/mockData'

const PatientList = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          Patient List
        </h1>
        <p className="text-gray-600">View and manage patient records.</p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients && patients.map((patient, index) => (
          <PatientCard key={patient.id} patient={patient} delay={index * 0.1} />
        ))}
      </div>
      
      {(!patients || patients.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">No patients found.</p>
        </div>
      )}
    </div>
  )
}

export default PatientList
