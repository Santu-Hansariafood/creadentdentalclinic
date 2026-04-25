import { motion } from 'framer-motion'
import { Pill, Calendar, User, FileText } from 'lucide-react'
import { fadeIn } from '../utils/motion'

const PrescriptionCard = ({ prescription, delay = 0 }) => {
  return (
    <motion.div
      {...fadeIn('up', delay)}
      className="card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Pill size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-gray-900">
              Prescription #{prescription.id}
            </h3>
            <p className="text-sm text-gray-600">{prescription.diagnosis}</p>
          </div>
        </div>
        <span className={`badge ${
          prescription.status === 'Active' ? 'badge-success' : 'badge-info'
        }`}>
          {prescription.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>Prescribed: {new Date(prescription.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={16} />
          <span>Dr. {prescription.doctorName}</span>
        </div>
      </div>

      <div className="space-y-3">
        {prescription.medications.map((med, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900">{med.name}</p>
                <p className="text-sm text-gray-600">{med.dosage}</p>
              </div>
              <span className="text-xs text-gray-500">Qty: {med.quantity}</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Frequency:</span> {med.frequency}</p>
              <p><span className="font-medium">Duration:</span> {med.duration}</p>
              <p className="text-gray-500 italic">{med.instructions}</p>
            </div>
          </div>
        ))}
      </div>

      {prescription.notes && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-900 mb-1">Doctor's Notes</p>
              <p className="text-xs text-blue-700">{prescription.notes}</p>
            </div>
          </div>
        </div>
      )}

      {prescription.refillsRemaining > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Refills Remaining:</span> {prescription.refillsRemaining}
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default PrescriptionCard