import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    const dashboardRoutes = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard'
    }
    return <Navigate to={dashboardRoutes[user.role]} replace />
  }

  return children
}

export default ProtectedRoute