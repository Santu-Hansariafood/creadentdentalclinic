import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  IndianRupee,
  TrendingUp,
  UserPlus,
  FileText,
  Loader,
} from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import { fadeIn, staggerContainer } from "../utils/motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useQuery } from "@apollo/client";
import { GET_DASHBOARD_STATS, GET_REPORTS_DATA, GET_RECENT_ACTIVITIES } from "../graphql/queries";
import SEO from "../components/SEO";
import { Suspense } from "react";
import Preloader from "../components/Preloader";

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
};

const EmployeeDashboard = () => {
  const { data: statsData, loading: statsLoading } =
    useQuery(GET_DASHBOARD_STATS);
  const { data: reportsData, loading: reportsLoading } =
    useQuery(GET_REPORTS_DATA);
  const { data: activitiesData, loading: activitiesLoading } =
    useQuery(GET_RECENT_ACTIVITIES, { variables: { limit: 10 } });

  if (statsLoading || reportsLoading)
    return <div className="p-8 text-center">Loading dashboard...</div>;

  const stats = statsData?.getDashboardStats?.admin || {};
  const reports = reportsData?.getReportsData || {
    monthlyRevenue: [],
    appointmentsByType: [],
    patientDemographics: [],
    treatmentSuccess: [],
  };

  const COLORS = ["#007FAF", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <Suspense fallback={<Preloader />}>
      <SEO
        title="Employee Dashboard | Creadent Dental Clinic"
        description="Employee dashboard for Creadent Dental Clinic - manage patients, appointments, billing, and reports."
        noindex={true}
        nofollow={true}
        url="/employee/dashboard"
      />
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Employee Dashboard"
          subtitle="Comprehensive overview of clinic operations and analytics"
        />

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <DashboardCard
            icon={Users}
            title="Total Patients"
            value={stats.totalPatients || 0}
            subtitle="Active registrations"
            color="primary"
            delay={0}
          />
          <DashboardCard
            icon={Calendar}
            title="Today's Appointments"
            value={stats.todayAppointments || 0}
            subtitle="Scheduled for today"
            color="success"
            delay={0.1}
          />
          <DashboardCard
            icon={IndianRupee}
            title="Pending Payments"
            value={stats.pendingPayments || 0}
            subtitle="Outstanding invoices"
            color="warning"
            delay={0.2}
          />
          <DashboardCard
            icon={TrendingUp}
            title="Monthly Revenue"
            value={`$${((stats.monthlyRevenue || 0) / 1000).toFixed(1)}K`}
            subtitle="This month"
            color="blue"
            delay={0.3}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div {...fadeIn("right", 0.2)} className="card">
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
              Monthly Revenue Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reports.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#007FAF" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div {...fadeIn("left", 0.3)} className="card">
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
              Appointments by Type
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reports.appointmentsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reports.appointmentsByType.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <motion.div {...fadeIn("up", 0.4)}>
          <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/employee/patient-registration"
              className="card-hover text-center p-6"
            >
              <UserPlus size={32} className="mx-auto mb-3 text-primary" />
              <h3 className="font-medium text-gray-900 mb-1">
                Register Patient
              </h3>
              <p className="text-sm text-gray-600">Add new patient to system</p>
            </Link>
            <Link
              to="/employee/appointments"
              className="card-hover text-center p-6"
            >
              <Calendar size={32} className="mx-auto mb-3 text-primary" />
              <h3 className="font-medium text-gray-900 mb-1">
                Manage Appointments
              </h3>
              <p className="text-sm text-gray-600">
                View and schedule appointments
              </p>
            </Link>
            <Link to="/employee/reports" className="card-hover text-center p-6">
              <FileText size={32} className="mx-auto mb-3 text-primary" />
              <h3 className="font-medium text-gray-900 mb-1">
                Generate Reports
              </h3>
              <p className="text-sm text-gray-600">
                View analytics and insights
              </p>
            </Link>
          </div>
        </motion.div>
      </div>
    </Suspense>
  );
};

export default EmployeeDashboard;
