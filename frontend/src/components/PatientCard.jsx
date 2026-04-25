import { motion } from 'framer-motion'
import { User, Phone, Mail, Calendar } from 'lucide-react'
import { fadeIn } from '../utils/motion'

const PatientCard = ({ patient, delay = 0, onSelect }) => {
  return (
    <motion.div
      {...fadeIn('up', delay)}
      onClick={() => onSelect && onSelect(patient)}
      className={`card-hover ${onSelect ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <User size={28} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-gray-900 mb-1">
            {patient.name}
          </h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={14} />
              <span className="truncate">{patient.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} />
              <span>{patient.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={14} />
              <span>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`badge ${
            patient.status === 'Active' ? 'badge-success' : 'badge-error'
          }`}>
            {patient.status}
          </span>
          <span className="text-xs text-gray-500">
            {patient.gender}
          </span>
        </div>
      </div>

      {patient.dentalHistory && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Last Visit: {new Date(patient.dentalHistory.lastVisit).toLocaleDateString()}</span>
            <span className="font-medium text-primary">
              {patient.dentalHistory.currentIssues.length > 0 
                ? `${patient.dentalHistory.currentIssues.length} Active Issue(s)` 
                : 'No Active Issues'}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default PatientCard