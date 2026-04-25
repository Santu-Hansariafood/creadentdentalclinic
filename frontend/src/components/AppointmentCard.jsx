import { motion } from 'framer-motion'
import { Calendar, Clock, User, MapPin } from 'lucide-react'
import { fadeIn } from '../utils/motion'

const AppointmentCard = ({ appointment, delay = 0, onAction }) => {
  const statusColors = {
    Scheduled: 'border-primary bg-primary/5',
    Completed: 'border-success bg-success/5',
    Cancelled: 'border-gray-400 bg-gray-50',
    Pending: 'border-warning bg-warning/5'
  }

  const statusBadges = {
    Scheduled: 'badge-primary',
    Completed: 'badge-success',
    Cancelled: 'badge-error',
    Pending: 'badge-warning'
  }

  return (
    <motion.div
      {...fadeIn('up', delay)}
      className={`appointment-card ${statusColors[appointment.status]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-gray-900 mb-1">
            {appointment.type}
          </h3>
          <p className="text-sm text-gray-600">{appointment.reason}</p>
        </div>
        <span className={`badge ${statusBadges[appointment.status]}`}>
          {appointment.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>{new Date(appointment.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>{appointment.time} ({appointment.duration} min)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={16} />
          <span>{appointment.doctorName}</span>
        </div>
      </div>

      {appointment.notes && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Note:</span> {appointment.notes}
          </p>
        </div>
      )}

      {onAction && appointment.status === 'Scheduled' && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onAction('reschedule', appointment)}
            className="btn-outline flex-1 text-sm py-2"
          >
            Reschedule
          </button>
          <button
            onClick={() => onAction('cancel', appointment)}
            className="btn-danger flex-1 text-sm py-2"
          >
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default AppointmentCard