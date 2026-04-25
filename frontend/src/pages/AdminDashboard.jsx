import { motion } from 'framer-motion'
import { Users, Calendar, DollarSign, TrendingUp, UserPlus, FileText } from 'lucide-react'
import { dashboardStats, reportsData } from '../data/mockData'
import DashboardCard from '../components/DashboardCard'
import { fadeIn, staggerContainer } from '../utils/motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const AdminDashboard = () => {
  const stats = dashboardStats.admin

  const COLORS = ['#007FAF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Comprehensive overview of clinic operations and analytics</p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <DashboardCard
          icon={Users}
          title="Total Patients"
          value={stats.totalPatients}
          subtitle="Active registrations"
          color="primary"
          delay={0}
        />
        <DashboardCard
          icon={Calendar}
          title="Today's Appointments"
          value={stats.todayAppointments}
          subtitle="Scheduled for today"
          color="success"
          delay={0.1}
        />
        <DashboardCard
          icon={DollarSign}
          title="Pending Payments"
          value={stats.pendingPayments}
          subtitle="Outstanding invoices"
          color="warning"
          delay={0.2}
        />
        <DashboardCard
          icon={TrendingUp}
          title="Monthly Revenue"
          value={`$${(stats.monthlyRevenue / 1000).toFixed(1)}K`}
          subtitle="This month"
          color="blue"
          delay={0.3}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div {...fadeIn('right', 0.2)} className="card">
          <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
            Monthly Revenue Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportsData.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#007FAF" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeIn('left', 0.3)} className="card">
          <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
            Appointments by Type
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportsData.appointmentsByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${type}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {reportsData.appointmentsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div {...fadeIn('up', 0.4)}>
        <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/admin/patient-registration" className="card-hover text-center p-6">
            <UserPlus size={32} className="mx-auto mb-3 text-primary" />
            <h3 className="font-medium text-gray-900 mb-1">Register Patient</h3>
            <p className="text-sm text-gray-600">Add new patient to system</p>
          </a>
          <a href="/admin/appointments" className="card-hover text-center p-6">
            <Calendar size={32} className="mx-auto mb-3 text-primary" />
            <h3 className="font-medium text-gray-900 mb-1">Manage Appointments</h3>
            <p className="text-sm text-gray-600">View and schedule appointments</p>
          </a>
          <a href="/admin/reports" className="card-hover text-center p-6">
            <FileText size={32} className="mx-auto mb-3 text-primary" />
            <h3 className="font-medium text-gray-900 mb-1">Generate Reports</h3>
            <p className="text-sm text-gray-600">View analytics and insights</p>
          </a>
        </div>
      </motion.div>

      <motion.div {...fadeIn('up', 0.5)} className="mt-8">
        <div className="card">
          <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {[
              { action: 'New patient registered', user: 'Robert Johnson', time: '10 minutes ago' },
              { action: 'Appointment scheduled', user: 'Jane Smith', time: '25 minutes ago' },
              { action: 'Payment received', user: 'John Doe', time: '1 hour ago' },
              { action: 'Medical record updated', user: 'Dr. Sunita Agarwalla', time: '2 hours ago' }
            ].map((activity, index) => (
              <motion.div
                key={index}
                {...fadeIn('up', index * 0.05)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.user}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminDashboard