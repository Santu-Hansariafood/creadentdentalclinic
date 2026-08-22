import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Users, FileText, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import AppointmentCard from "../components/AppointmentCard";
import PatientCard from "../components/PatientCard";
import { fadeIn, staggerContainer } from "../utils/motion";
import { useQuery } from "@apollo/client";
import {
  GET_DASHBOARD_STATS,
  GET_APPOINTMENTS,
  GET_PATIENTS,
} from "../graphql/queries";
import SEO from "../components/SEO";
import { Suspense } from "react";
import Preloader from "../components/Preloader";

const DoctorDashboard = () => {
  const { user } = useAuth();

  const { data: statsData, loading: statsLoading } =
    useQuery(GET_DASHBOARD_STATS);
  const { data: aptsData, loading: aptsLoading } = useQuery(GET_APPOINTMENTS, {
    variables: { page: 1, limit: 5, status: "Scheduled" },
  });
  const { data: patientsData, loading: patientsLoading } = useQuery(
    GET_PATIENTS,
    {
      variables: { page: 1, limit: 3 },
    },
  );

  if (statsLoading || aptsLoading || patientsLoading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  const stats = statsData?.getDashboardStats?.doctor || {};
  const appointments = aptsData?.getAppointments?.appointments || [];
  const patients = patientsData?.getPatients?.patients || [];

  return (
    <Suspense fallback={<Preloader />}>
      <div className="max-w-7xl mx-auto">
        <SEO
          title="Doctor Dashboard | Creadent Dental Clinic"
          description="Manage your appointments, patients, medical records, and prescriptions."
          noindex={true}
          nofollow={true}
          url="/doctor/dashboard"
        />
        <PageHeader
          title={`Good morning, ${user.name}!`}
          subtitle="Here's your schedule and patient overview for today"
        />

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <DashboardCard
            icon={Calendar}
            title="Today's Appointments"
            value={stats.todayAppointments || 0}
            subtitle="Scheduled for today"
            color="primary"
            delay={0}
          />
          <DashboardCard
            icon={Users}
            title="Total Patients"
            value={stats.totalPatients || 0}
            subtitle="Active patients"
            color="success"
            delay={0.1}
          />
          <DashboardCard
            icon={FileText}
            title="Pending Reports"
            value={stats.pendingReports || 0}
            subtitle="Require attention"
            color="warning"
            delay={0.2}
          />
          <DashboardCard
            icon={TrendingUp}
            title="Unread Messages"
            value={stats.unreadMessages || 0}
            subtitle="New messages"
            color="blue"
            delay={0.3}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div {...fadeIn("right", 0.2)}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-semibold text-gray-900">
                Today's Schedule
              </h2>
              <Link
                to="/doctor/appointments"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {appointments.length > 0 ? (
                appointments.map((apt, index) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    delay={index * 0.1}
                  />
                ))
              ) : (
                <div className="card text-center py-8">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">
                    No appointments scheduled for today
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div {...fadeIn("left", 0.3)}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-semibold text-gray-900">
                Recent Patients
              </h2>
              <Link
                to="/doctor/patients"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {patients.map((patient, index) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div {...fadeIn("up", 0.4)}>
          <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/doctor/appointments"
              className="card-hover text-center p-6"
            >
              <Calendar size={32} className="mx-auto mb-3 text-primary" />
              <h3 className="font-medium text-gray-900 mb-1">
                Schedule Appointment
              </h3>
              <p className="text-sm text-gray-600">
                Book new patient appointment
              </p>
            </Link>
            <Link to="/doctor/records" className="card-hover text-center p-6">
              <FileText size={32} className="mx-auto mb-3 text-primary" />
              <h3 className="font-medium text-gray-900 mb-1">
                Medical Records
              </h3>
              <p className="text-sm text-gray-600">View and update records</p>
            </Link>
            <Link
              to="/doctor/prescriptions"
              className="card-hover text-center p-6"
            >
              <Clock size={32} className="mx-auto mb-3 text-primary" />
              <h3 className="font-medium text-gray-900 mb-1">Prescriptions</h3>
              <p className="text-sm text-gray-600">Create new prescription</p>
            </Link>
          </div>
        </motion.div>
      </div>
    </Suspense>
  );
};

export default DoctorDashboard;
