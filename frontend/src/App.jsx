import { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Preloader from "./components/Preloader";
import socketService from "./services/socket";
import toast from "react-hot-toast";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const OTPVerification = lazy(() => import("./pages/OTPVerification"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PatientRegistration = lazy(() => import("./pages/PatientRegistration"));
const Appointments = lazy(() => import("./pages/Appointments"));
const MedicalRecords = lazy(() => import("./pages/MedicalRecords"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const Chat = lazy(() => import("./pages/Chat"));
const Billing = lazy(() => import("./pages/Billing"));
const Reports = lazy(() => import("./pages/Reports"));
const PatientList = lazy(() => import("./pages/PatientList"));
const MedicineList = lazy(() => import("./pages/MedicineList"));
const MedicineRegistration = lazy(() => import("./pages/MedicineRegistration"));
const StaffRegistration = lazy(() => import("./pages/StaffRegistration"));
const PaymentLedger = lazy(() => import("./pages/PaymentLedger"));
const Settings = lazy(() => import("./pages/Settings"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const socket = socketService.connect();

      socketService.onNotification((notification) => {
        toast.success(notification.message, {
          duration: 5000,
          position: "top-right",
          icon: "🔔",
        });
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (initialLoad || authLoading) {
    return <Preloader />;
  }

  const getDashboardRoute = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "patient":
        return "/patient/dashboard";
      case "doctor":
        return "/doctor/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/login";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && (
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
      )}
      <div className="flex">
        {isAuthenticated && (
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        )}
        <main
          className={`flex-1 transition-all duration-300 ${isAuthenticated ? "lg:ml-64 mt-16" : ""}`}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route
                  path="/login"
                  element={
                    !isAuthenticated ? (
                      <Login />
                    ) : (
                      <Navigate to={getDashboardRoute()} />
                    )
                  }
                />
                <Route
                  path="/register"
                  element={
                    !isAuthenticated ? (
                      <Register />
                    ) : (
                      <Navigate to={getDashboardRoute()} />
                    )
                  }
                />
                <Route path="/verify-otp" element={<OTPVerification />} />

                <Route
                  path="/patient/dashboard"
                  element={
                    <ProtectedRoute role="patient">
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/appointments"
                  element={
                    <ProtectedRoute role="patient">
                      <Appointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/records"
                  element={
                    <ProtectedRoute role="patient">
                      <MedicalRecords />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/prescriptions"
                  element={
                    <ProtectedRoute role="patient">
                      <Prescriptions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/chat"
                  element={
                    <ProtectedRoute role="patient">
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/billing"
                  element={
                    <ProtectedRoute role="patient">
                      <Billing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/settings"
                  element={
                    <ProtectedRoute role="patient">
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/doctor/dashboard"
                  element={
                    <ProtectedRoute role="doctor">
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/appointments"
                  element={
                    <ProtectedRoute role="doctor">
                      <Appointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/patients"
                  element={
                    <ProtectedRoute role="doctor">
                      <PatientList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/records"
                  element={
                    <ProtectedRoute role="doctor">
                      <MedicalRecords />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/prescriptions"
                  element={
                    <ProtectedRoute role="doctor">
                      <Prescriptions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/medicines"
                  element={
                    <ProtectedRoute role="doctor">
                      <MedicineList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/medicine-registration"
                  element={
                    <ProtectedRoute role="doctor">
                      <MedicineRegistration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/payment-ledger"
                  element={
                    <ProtectedRoute role="doctor">
                      <PaymentLedger />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/chat"
                  element={
                    <ProtectedRoute role="doctor">
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/settings"
                  element={
                    <ProtectedRoute role="doctor">
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/patients"
                  element={
                    <ProtectedRoute role="admin">
                      <PatientList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/patient-registration"
                  element={
                    <ProtectedRoute role="admin">
                      <PatientRegistration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/staff-registration"
                  element={
                    <ProtectedRoute role="admin">
                      <StaffRegistration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/doctor-registration"
                  element={
                    <ProtectedRoute role="admin">
                      <StaffRegistration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/medicines"
                  element={
                    <ProtectedRoute role="admin">
                      <MedicineList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/medicine-registration"
                  element={
                    <ProtectedRoute role="admin">
                      <MedicineRegistration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/payment-ledger"
                  element={
                    <ProtectedRoute role="admin">
                      <PaymentLedger />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/appointments"
                  element={
                    <ProtectedRoute role="admin">
                      <Appointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/records"
                  element={
                    <ProtectedRoute role="admin">
                      <MedicalRecords />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/billing"
                  element={
                    <ProtectedRoute role="admin">
                      <Billing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute role="admin">
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute role="admin">
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/"
                  element={
                    <Navigate
                      to={isAuthenticated ? getDashboardRoute() : "/login"}
                    />
                  }
                />
                <Route
                  path="*"
                  element={
                    <Navigate
                      to={isAuthenticated ? getDashboardRoute() : "/login"}
                    />
                  }
                />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
