import { motion } from 'framer-motion'
import { fadeIn } from '../utils/motion'

const DashboardCard = ({ icon: Icon, title, value, subtitle, color = 'primary', delay = 0 }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    blue: 'bg-blue-100 text-blue-600'
  }

  return (
    <motion.div
      {...fadeIn('up', delay)}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  )
}

export default DashboardCard