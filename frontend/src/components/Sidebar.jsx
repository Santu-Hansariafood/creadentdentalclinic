import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Pill,
  MessageSquare,
  CreditCard,
  Users,
  UserPlus,
  BarChart3,
  Settings
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()

  const patientLinks = [
    { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patient/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/patient/records', icon: FileText, label: 'Medical Records' },
    { to: '/patient/prescriptions', icon: Pill, label: 'Prescriptions' },
    { to: '/patient/chat', icon: MessageSquare, label: 'Messages' },
    { to: '/patient/billing', icon: CreditCard, label: 'Billing' },
    { to: '/patient/settings', icon: Settings, label: 'Settings' }
  ]

  const doctorLinks = [
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/doctor/patients', icon: Users, label: 'Patients' },
    { to: '/doctor/records', icon: FileText, label: 'Medical Records' },
    { to: '/doctor/prescriptions', icon: Pill, label: 'Prescriptions' },
    { to: '/doctor/chat', icon: MessageSquare, label: 'Messages' },
    { to: '/doctor/settings', icon: Settings, label: 'Settings' }
  ]

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/patients', icon: Users, label: 'Patients' },
    { to: '/admin/patient-registration', icon: UserPlus, label: 'Register Patient' },
    { to: '/admin/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/admin/records', icon: FileText, label: 'Medical Records' },
    { to: '/admin/billing', icon: CreditCard, label: 'Billing' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' }
  ]

  const getLinks = () => {
    switch (user?.role) {
      case 'patient':
        return patientLinks
      case 'doctor':
        return doctorLinks
      case 'admin':
        return adminLinks
      default:
        return []
    }
  }

  const links = getLinks()

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {links.map((link, index) => {
          const Icon = link.icon
          const isActive = location.pathname === link.to

          return (
            <Link
              key={link.to}
              to={link.to}
              className="relative"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{link.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar