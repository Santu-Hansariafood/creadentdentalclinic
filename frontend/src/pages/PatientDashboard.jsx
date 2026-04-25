import { motion } from 'framer-motion'
import { Calendar, FileText, Pill, CreditCard, MessageSquare, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { appointments, medicalRecords, prescriptions, invoices, dashboardStats } from '../data/mockData'
import DashboardCard from '../components/DashboardCard'
import AppointmentCard from '../components/AppointmentCard'
import { fadeIn, staggerContainer } from '../utils/motion'

const PatientDashboard = () => {
  const { user } = useAuth()
  const stats = dashboardStats.patient

  const userAppointments = appointments.filter(apt => apt.patientId === user.id)
  const upcomingAppointments = userAppointments.filter(apt => 
    apt.status === 'Scheduled' && new Date(apt.date) >= new Date()
  ).slice(0, 2)

  const recentRecords = medicalRecords.filter(rec => rec.patientId === user.id).slice(0, 2)
  const activePrescriptions = prescriptions.filter(pres => 
    pres.patientId === user.id && pres.status === 'Active'
  ).slice(0, 2)

  const pendingInvoices = invoices.filter(inv => 
    inv.patientId === user.id && inv.balance > 0
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600">Here's an overview of your dental health</p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <DashboardCard
          icon={Calendar}
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          subtitle="Next appointment soon"
          color="primary"
          delay={0}
        />
        <DashboardCard
          icon={Clock}
          title="Total Appointments"
          value={stats.totalAppointments}
          subtitle="All time"
          color="blue"
          delay={0.1}
        />
        <DashboardCard
          icon={CreditCard}
          title="Pending Bills"
          value={`$${pendingInvoices.reduce((sum, inv) => sum + inv.balance, 0).toFixed(0)}`}
          subtitle={`${stats.pendingBills} invoice(s)`}
          color="warning"
          delay={0.2}
        />
        <DashboardCard
          icon={MessageSquare}
          title="Unread Messages"
          value={stats.unreadMessages}
          subtitle="From your doctor"
          color="success"
          delay={0.3}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div {...fadeIn('right', 0.2)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold text-gray-900">
              Upcoming Appointments
            </h2>
            <a href="/patient/appointments" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt, index) => (
                <AppointmentCard key={apt.id} appointment={apt} delay={index * 0.1} />
              ))
            ) : (
              <div className="card text-center py-8">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No upcoming appointments</p>
                <a href="/patient/appointments" className="btn-primary mt-4 inline-block">
                  Book Appointment
                </a>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div {...fadeIn('left', 0.3)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold text-gray-900">
              Active Prescriptions
            </h2>
            <a href="/patient/prescriptions" className="text-sm text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {activePrescriptions.length > 0 ? (
              activePrescriptions.map((pres, index) => (
                <motion.div
                  key={pres.id}
                  {...fadeIn('up', index * 0.1)}
                  className="card"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Pill size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {pres.medications[0].name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {pres.medications[0].dosage} - {pres.medications[0].frequency}
                      </p>
                      <span className="badge badge-success">Active</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="card text-center py-8">
                <Pill size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No active prescriptions</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div {...fadeIn('up', 0.4)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-semibold text-gray-900">
            Recent Medical Records
          </h2>
          <a href="/patient/records" className="text-sm text-primary hover:underline">
            View all
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRecords.length > 0 ? (
            recentRecords.map((record, index) => (
              <motion.div
                key={record.id}
                {...fadeIn('up', index * 0.1)}
                className="card"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {record.visitType} - {record.diagnosis}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {record.notes}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="card text-center py-8 col-span-2">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No medical records available</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default PatientDashboard