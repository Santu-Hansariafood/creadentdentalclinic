import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import OTPVerification from './pages/OTPVerification'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import PatientRegistration from './pages/PatientRegistration'
import Appointments from './pages/Appointments'
import MedicalRecords from './pages/MedicalRecords'
import Prescriptions from './pages/Prescriptions'
import Chat from './pages/Chat'
import Billing from './pages/Billing'
import Reports from './pages/Reports'
import PatientList from './pages/PatientList'
import MedicineList from './pages/MedicineList'
import MedicineRegistration from './pages/MedicineRegistration'
import DoctorRegistration from './pages/DoctorRegistration'
import PaymentLedger from './pages/PaymentLedger'
import Settings from './pages/Settings'

const App = () => {
  const { user, isAuthenticated } = useAuth()

  const getDashboardRoute = () => {
    if (!user) return '/login'
    switch (user.role) {
      case 'patient':
        return '/patient/dashboard'
      case 'doctor':
        return '/doctor/dashboard'
      case 'admin':
        return '/admin/dashboard'
      default:
        return '/login'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar />}
      <div className="flex">
        {isAuthenticated && <Sidebar />}
        <main className={`flex-1 ${isAuthenticated ? 'ml-64 mt-16' : ''}`}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={getDashboardRoute()} />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={getDashboardRoute()} />} />
            <Route path="/verify-otp" element={<OTPVerification />} />
            
            <Route path="/patient/dashboard" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
            <Route path="/patient/appointments" element={<ProtectedRoute role="patient"><Appointments /></ProtectedRoute>} />
            <Route path="/patient/records" element={<ProtectedRoute role="patient"><MedicalRecords /></ProtectedRoute>} />
            <Route path="/patient/prescriptions" element={<ProtectedRoute role="patient"><Prescriptions /></ProtectedRoute>} />
            <Route path="/patient/chat" element={<ProtectedRoute role="patient"><Chat /></ProtectedRoute>} />
            <Route path="/patient/billing" element={<ProtectedRoute role="patient"><Billing /></ProtectedRoute>} />
            <Route path="/patient/settings" element={<ProtectedRoute role="patient"><Settings /></ProtectedRoute>} />
            
            <Route path="/doctor/dashboard" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/doctor/appointments" element={<ProtectedRoute role="doctor"><Appointments /></ProtectedRoute>} />
            <Route path="/doctor/patients" element={<ProtectedRoute role="doctor"><PatientList /></ProtectedRoute>} />
            <Route path="/doctor/records" element={<ProtectedRoute role="doctor"><MedicalRecords /></ProtectedRoute>} />
            <Route path="/doctor/prescriptions" element={<ProtectedRoute role="doctor"><Prescriptions /></ProtectedRoute>} />
            <Route path="/doctor/medicines" element={<ProtectedRoute role="doctor"><MedicineList /></ProtectedRoute>} />
            <Route path="/doctor/medicine-registration" element={<ProtectedRoute role="doctor"><MedicineRegistration /></ProtectedRoute>} />
            <Route path="/doctor/payment-ledger" element={<ProtectedRoute role="doctor"><PaymentLedger /></ProtectedRoute>} />
            <Route path="/doctor/chat" element={<ProtectedRoute role="doctor"><Chat /></ProtectedRoute>} />
            <Route path="/doctor/settings" element={<ProtectedRoute role="doctor"><Settings /></ProtectedRoute>} />
            
            <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/patients" element={<ProtectedRoute role="admin"><PatientList /></ProtectedRoute>} />
            <Route path="/admin/patient-registration" element={<ProtectedRoute role="admin"><PatientRegistration /></ProtectedRoute>} />
            <Route path="/admin/doctor-registration" element={<ProtectedRoute role="admin"><DoctorRegistration /></ProtectedRoute>} />
            <Route path="/admin/medicines" element={<ProtectedRoute role="admin"><MedicineList /></ProtectedRoute>} />
            <Route path="/admin/medicine-registration" element={<ProtectedRoute role="admin"><MedicineRegistration /></ProtectedRoute>} />
            <Route path="/admin/payment-ledger" element={<ProtectedRoute role="admin"><PaymentLedger /></ProtectedRoute>} />
            <Route path="/admin/appointments" element={<ProtectedRoute role="admin"><Appointments /></ProtectedRoute>} />
            <Route path="/admin/records" element={<ProtectedRoute role="admin"><MedicalRecords /></ProtectedRoute>} />
            <Route path="/admin/billing" element={<ProtectedRoute role="admin"><Billing /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute role="admin"><Reports /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute role="admin"><Settings /></ProtectedRoute>} />
            
            <Route path="/" element={<Navigate to={isAuthenticated ? getDashboardRoute() : '/login'} />} />
            <Route path="*" element={<Navigate to={isAuthenticated ? getDashboardRoute() : '/login'} />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App