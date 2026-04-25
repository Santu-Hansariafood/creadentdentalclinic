import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Plus, Filter, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { appointments, doctors, appointmentSlots } from '../data/mockData'
import AppointmentCard from '../components/AppointmentCard'
import { fadeIn, staggerContainer } from '../utils/motion'
import toast from 'react-hot-toast'

const Appointments = () => {
  const { user } = useAuth()
  const [showBooking, setShowBooking] = useState(false)
  const [filterStatus, setFilterStatus] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [bookingData, setBookingData] = useState({
    doctorId: '',
    date: '',
    time: '',
    type: '',
    reason: ''
  })

  const userAppointments = appointments.filter(apt => {
    if (user.role === 'patient') return apt.patientId === user.id
    if (user.role === 'doctor') return apt.doctorId === user.id
    return true
  })

  const filteredAppointments = userAppointments.filter(apt => {
    const matchesStatus = filterStatus === 'All' || apt.status === filterStatus
    const matchesSearch = apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.type.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleBookingChange = (e) => {
    setBookingData({ ...bookingData, [e.target.name]: e.target.value })
  }

  const handleBooking = (e) => {
    e.preventDefault()
    toast.success('Appointment booked successfully!')
    setShowBooking(false)
    setBookingData({ doctorId: '', date: '', time: '', type: '', reason: '' })
  }

  const handleAppointmentAction = (action, appointment) => {
    if (action === 'reschedule') {
      toast.success('Rescheduling appointment...')
    } else if (action === 'cancel') {
      toast.success('Appointment cancelled')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
              Appointments
            </h1>
            <p className="text-gray-600">Manage your dental appointments</p>
          </div>
          {user.role !== 'doctor' && (
            <button
              onClick={() => setShowBooking(!showBooking)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Book Appointment
            </button>
          )}
        </div>
      </motion.div>

      {showBooking && (
        <motion.div {...fadeIn('up', 0.1)} className="card mb-8">
          <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
            Book New Appointment
          </h2>
          <form onSubmit={handleBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Doctor *
                </label>
                <select
                  name="doctorId"
                  value={bookingData.doctorId}
                  onChange={handleBookingChange}
                  className="input-field"
                  required
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type *
                </label>
                <select
                  name="type"
                  value={bookingData.type}
                  onChange={handleBookingChange}
                  className="input-field"
                  required
                >
                  <option value="">Select type</option>
                  <option value="Check-up">Check-up</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Treatment">Treatment</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={bookingData.date}
                  onChange={handleBookingChange}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slot *
                </label>
                <select
                  name="time"
                  value={bookingData.time}
                  onChange={handleBookingChange}
                  className="input-field"
                  required
                >
                  <option value="">Select time</option>
                  {appointmentSlots.filter(slot => slot.available).map(slot => (
                    <option key={slot.time} value={slot.time}>
                      {slot.time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit *
              </label>
              <textarea
                name="reason"
                value={bookingData.reason}
                onChange={handleBookingChange}
                className="input-field"
                rows={3}
                placeholder="Describe your dental concern or reason for visit"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                Book Appointment
              </button>
              <button
                type="button"
                onClick={() => setShowBooking(false)}
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
              placeholder="Search appointments..."
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
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
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
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((apt, index) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              delay={index * 0.05}
              onAction={handleAppointmentAction}
            />
          ))
        ) : (
          <motion.div {...fadeIn('up')} className="col-span-2 card text-center py-12">
            <CalendarIcon size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'All'
                ? 'Try adjusting your search or filter'
                : 'You don\'t have any appointments yet'}
            </p>
            {user.role !== 'doctor' && !showBooking && (
              <button
                onClick={() => setShowBooking(true)}
                className="btn-primary"
              >
                Book Your First Appointment
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default Appointments