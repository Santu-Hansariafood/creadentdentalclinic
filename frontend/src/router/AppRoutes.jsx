import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Preloader from "../components/Preloader";
import publicContent from "../data/publicPages.json";
import { GET_MY_PATIENT } from "../graphql/queries";

const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const OTPVerification = lazy(() => import("../pages/OTPVerification"));
const PublicContentPage = lazy(() => import("../pages/PublicContentPage"));
const PatientDashboard = lazy(() => import("../pages/PatientDashboard"));
const DoctorDashboard = lazy(() => import("../pages/DoctorDashboard"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const EmployeeDashboard = lazy(() => import("../pages/EmployeeDashboard"));
const PatientRegistration = lazy(() => import("../pages/PatientRegistration"));
const Appointments = lazy(() => import("../pages/Appointments"));
const MedicalRecords = lazy(() => import("../pages/MedicalRecords"));
const Prescriptions = lazy(() => import("../pages/Prescriptions"));
const Chat = lazy(() => import("../pages/Chat"));
const WhatsAppMessages = lazy(() => import("../pages/WhatsAppMessages"));
const Billing = lazy(() => import("../pages/Billing"));
const Reports = lazy(() => import("../pages/Reports"));
const PatientList = lazy(() => import("../pages/PatientList"));
const MedicineList = lazy(() => import("../pages/MedicineList"));
const MedicineRegistration = lazy(
  () => import("../pages/MedicineRegistration"),
);
const StaffRegistration = lazy(() => import("../pages/StaffRegistration"));
const StaffList = lazy(() => import("../pages/StaffList"));
const PaymentLedger = lazy(() => import("../pages/PaymentLedger"));
const Settings = lazy(() => import("../pages/Settings"));

const PatientRegistrationCheck = ({ children }) => {
  const { user, isDemoUser } = useAuth();
  const navigate = useNavigate();
  const isPatient = user?.role === "patient";
  const { data, loading } = useQuery(GET_MY_PATIENT, {
    skip: !isPatient || isDemoUser,
  });

  useEffect(() => {
    if (!isDemoUser && isPatient && !loading && !data?.getMyPatient) {
      navigate("/patient/complete-registration");
    }
  }, [data, isDemoUser, isPatient, loading, navigate]);

  if (isPatient && !isDemoUser && loading) return <Preloader />;
  return children;
};

const withPatientCheck = (element) => (
  <ProtectedRoute role="patient">
    <PatientRegistrationCheck>{element}</PatientRegistrationCheck>
  </ProtectedRoute>
);

const AppRoutes = ({ isAuthenticated, user }) => {
  const getDashboardRoute = () =>
    user?.role ? `/${user.role}/dashboard` : "/login";

  return (
    <Suspense fallback={<Preloader />}>
      <Routes>
        {publicContent.pages.map((page) => (
          <Route
            key={page.slug}
            path={page.path}
            element={<PublicContentPage pageSlug={page.slug} />}
          />
        ))}
        <Route
          path="/login"
          element={
            !isAuthenticated ? <Login /> : <Navigate to={getDashboardRoute()} />
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
          path="/patient/complete-registration"
          element={
            <ProtectedRoute role="patient">
              <PatientRegistration isSelfRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/dashboard"
          element={withPatientCheck(<PatientDashboard />)}
        />
        <Route
          path="/patient/appointments"
          element={withPatientCheck(<Appointments />)}
        />
        <Route
          path="/patient/records"
          element={withPatientCheck(<MedicalRecords />)}
        />
        <Route
          path="/patient/prescriptions"
          element={withPatientCheck(<Prescriptions />)}
        />
        <Route path="/patient/chat" element={withPatientCheck(<Chat />)} />
        <Route
          path="/patient/billing"
          element={withPatientCheck(<Billing />)}
        />
        <Route
          path="/patient/settings"
          element={withPatientCheck(<Settings />)}
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
          path="/doctor/whatsapp-messages"
          element={
            <ProtectedRoute role="doctor">
              <WhatsAppMessages />
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
          path="/admin/staff"
          element={
            <ProtectedRoute role="admin">
              <StaffList />
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
          path="/admin/whatsapp-messages"
          element={
            <ProtectedRoute role="admin">
              <WhatsAppMessages />
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
          path="/employee/dashboard"
          element={
            <ProtectedRoute role="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/patients"
          element={
            <ProtectedRoute role="employee">
              <PatientList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/patient-registration"
          element={
            <ProtectedRoute role="employee">
              <PatientRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/medicines"
          element={
            <ProtectedRoute role="employee">
              <MedicineList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/medicine-registration"
          element={
            <ProtectedRoute role="employee">
              <MedicineRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/payment-ledger"
          element={
            <ProtectedRoute role="employee">
              <PaymentLedger />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/appointments"
          element={
            <ProtectedRoute role="employee">
              <Appointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/records"
          element={
            <ProtectedRoute role="employee">
              <MedicalRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/billing"
          element={
            <ProtectedRoute role="employee">
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/whatsapp-messages"
          element={
            <ProtectedRoute role="employee">
              <WhatsAppMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/reports"
          element={
            <ProtectedRoute role="employee">
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/settings"
          element={
            <ProtectedRoute role="employee">
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? getDashboardRoute() : "/"} />
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
