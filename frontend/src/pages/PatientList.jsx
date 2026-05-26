import { motion } from 'framer-motion'
import { fadeIn } from '../utils/motion'
import PatientCard from '../components/PatientCard'
import { useQuery } from '@apollo/client'
import { GET_PATIENTS } from '../graphql/queries'
import Pagination from '../components/Pagination'
import { useState } from 'react'

const PatientList = () => {
  const [page, setPage] = useState(1)
  const limit = 10

  const { loading, error, data } = useQuery(GET_PATIENTS, {
    variables: { page, limit }
  })

  if (loading) return <div className="p-6 text-center">Loading patients...</div>
  if (error) return <div className="p-6 text-center text-red-500">Error: {error.message}</div>

  const { patients = [], totalPages = 1 } = data?.getPatients || {}

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          Patient List
        </h1>
        <p className="text-gray-600">View and manage patient records.</p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient, index) => (
          <PatientCard key={patient.id} patient={patient} delay={index * 0.1} />
        ))}
      </div>

      {patients.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center mt-6">
          <p className="text-gray-500">No patients found.</p>
        </div>
      )}

      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
      />
    </div>
  )
}

export default PatientList
