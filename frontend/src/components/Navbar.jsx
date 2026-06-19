import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, User, LogOut, Menu, X, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@apollo/client'
import { GET_NOTIFICATIONS } from '../graphql/queries'

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const { data: notifData } = useQuery(GET_NOTIFICATIONS)
  const notifications = notifData?.getNotifications || []
  const unreadNotifications = notifications.filter(n => !n.read)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'patient':
        return '/patient/dashboard'
      case 'doctor':
        return '/doctor/dashboard'
      case 'admin':
        return '/admin/dashboard'
      default:
        return '/'
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to={getDashboardLink()} className="flex items-center gap-3">
              <img src="/logo/logo.png" alt="Creadent Dental Clinic Logo" className="w-10 h-10 object-contain shrink-0" />
              <span className="font-heading font-bold text-lg sm:text-xl text-primary truncate max-w-[150px] sm:max-w-none">
                creadent dental clinic
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to={`/${user?.role}/chat`}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MessageSquare size={20} className="text-gray-600" />
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell size={20} className="text-gray-600" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
                )}
              </button>

              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-[-80px] sm:right-0 mt-2 w-[280px] sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-heading font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {unreadNotifications.length > 0 ? (
                      unreadNotifications.map(notification => (
                        <div
                          key={notification.id}
                          className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <User size={18} className="text-primary" />
                </div>
                <span className="font-medium text-sm text-gray-700 hidden md:block">
                  {user?.name}
                </span>
              </button>

              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-heading font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      to={`/${user?.role}/settings`}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfile(false)}
                    >
                      <User size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut size={16} className="text-red-600" />
                      <span className="text-sm text-red-600">Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar