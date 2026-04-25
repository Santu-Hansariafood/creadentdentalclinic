import { motion } from 'framer-motion'
import { Calendar, Users, FileText, Clock, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { appointments, patients, dashboardStats } from '../data/mockData'
import DashboardCard from '../components/DashboardCard'
import AppointmentCard from '../components/AppointmentCard'
import PatientCard from '../components/PatientCard'
import { fadeIn, staggerContainer } from '../utils/motion'

const DoctorDashboard = () => {
  const { user } = useAuth()
  const stats = dashboardStats.doctor

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date)
    const today = new Date()
    return apt.doctorId === user.id && 
           apt.status === 'Scheduled' &&
           aptDate.toDateString() === today.toDateString()
  })

  const recentPatients = patients.slice(0, 3)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          Good morning, {user.name}!
        </h1>
        <p className="text-gray-600">Here's your schedule and patient overview for today</p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <DashboardCard
          icon={Calendar}
          title="Today's Appointments"
          value={stats.todayAppointments}
          subtitle={`${todayAppointments.length} scheduled`}
          color="primary"
          delay={0}
        />
        <DashboardCard
          icon={Users}
          title="Total Patients"
          value={stats.totalPatients}
          subtitle="Active patients"
          color="success"
          delay={0.1}
        />
        <DashboardCard
          icon={FileText}
          title="Pending Reports"
          value={stats.pendingReports}
          subtitle="Require attention"
          color="warning"
          delay={0.2}
        />
        <DashboardCard
          icon={TrendingUp}
          title="This Month"
          value="92%"
          subtitle="Patient satisfaction"
          color="blue"
          delay={0.3}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div {...fadeIn('right', 0.2)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold text-gray-900">
              Today's Schedule
            </h2>
            <a href="/doctor/appointments" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt, index) => (
                <AppointmentCard key={apt.id} appointment={apt} delay={index * 0.1} />
              ))
            ) : (
              <div className="card text-center py-8">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No appointments scheduled for today</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div {...fadeIn('left', 0.3)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold text-gray-900">
              Recent Patients
            </h2>
            <a href="/doctor/patients" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {recentPatients.map((patient, index) => (
              <PatientCard key={patient.id} patient={patient} delay={index * 0.1} />
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div {...fadeIn('up', 0.4)}>
        <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/doctor/appointments" className="card-hover text-center p-6">
            <Calendar size={32} className="mx-auto mb-3 text-primary" />
            <h3 className="font-medium text-gray-900 mb-1">Schedule Appointment</h3>
            <p className="text-sm text-gray-600">Book new patient appointment</p>
          </a>
          <a href="/doctor/records" className="card-hover text-center p-6">
            <FileText size={32} className="mx-auto mb-3 text-primary" />
            <h3 className="font-medium text-gray-900 mb-1">Medical Records</h3>
            <p className="text-sm text-gray-600">View and update records</p>
          </a>
          <a href="/doctor/prescriptions" className="card-hover text-center p-6">
            <Clock size={32} className="mx-auto mb-3 text-primary" />
            <h3 className="font-medium text-gray-900 mb-1">Prescriptions</h3>
            <p className="text-sm text-gray-600">Create new prescription</p>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default DoctorDashboard