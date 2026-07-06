
// Route to component map for preloading
const routeImports = {
  "/login": () => import("../pages/Login"),
  "/register": () => import("../pages/Register"),
  "/verify-otp": () => import("../pages/OTPVerification"),
  "/patient/dashboard": () => import("../pages/PatientDashboard"),
  "/doctor/dashboard": () => import("../pages/DoctorDashboard"),
  "/admin/dashboard": () => import("../pages/AdminDashboard"),
  "/employee/dashboard": () => import("../pages/EmployeeDashboard"),
  "/admin/patient-registration": () => import("../pages/PatientRegistration"),
  "/employee/patient-registration": () => import("../pages/PatientRegistration"),
  "/admin/patients": () => import("../pages/PatientList"),
  "/employee/patients": () => import("../pages/PatientList"),
  "/admin/appointments": () => import("../pages/Appointments"),
  "/employee/appointments": () => import("../pages/Appointments"),
  "/admin/records": () => import("../pages/MedicalRecords"),
  "/employee/records": () => import("../pages/MedicalRecords"),
  "/admin/prescriptions": () => import("../pages/Prescriptions"),
  "/admin/chat": () => import("../pages/Chat"),
  "/admin/billing": () => import("../pages/Billing"),
  "/employee/billing": () => import("../pages/Billing"),
  "/admin/reports": () => import("../pages/Reports"),
  "/employee/reports": () => import("../pages/Reports"),
  "/admin/medicines": () => import("../pages/MedicineList"),
  "/employee/medicines": () => import("../pages/MedicineList"),
  "/admin/medicine-registration": () => import("../pages/MedicineRegistration"),
  "/employee/medicine-registration": () => import("../pages/MedicineRegistration"),
  "/admin/staff-registration": () => import("../pages/StaffRegistration"),
  "/admin/doctor-registration": () => import("../pages/StaffRegistration"),
  "/admin/payment-ledger": () => import("../pages/PaymentLedger"),
  "/employee/payment-ledger": () => import("../pages/PaymentLedger"),
  "/admin/settings": () => import("../pages/Settings"),
  "/employee/settings": () => import("../pages/Settings"),
  "/patient/appointments": () => import("../pages/Appointments"),
  "/patient/records": () => import("../pages/MedicalRecords"),
  "/patient/prescriptions": () => import("../pages/Prescriptions"),
  "/patient/chat": () => import("../pages/Chat"),
  "/patient/billing": () => import("../pages/Billing"),
  "/patient/settings": () => import("../pages/Settings"),
  "/doctor/appointments": () => import("../pages/Appointments"),
  "/doctor/patients": () => import("../pages/PatientList"),
  "/doctor/records": () => import("../pages/MedicalRecords"),
  "/doctor/prescriptions": () => import("../pages/Prescriptions"),
  "/doctor/medicines": () => import("../pages/MedicineList"),
  "/doctor/medicine-registration": () => import("../pages/MedicineRegistration"),
  "/doctor/payment-ledger": () => import("../pages/PaymentLedger"),
  "/doctor/chat": () => import("../pages/Chat"),
  "/doctor/settings": () => import("../pages/Settings"),
};

// Track already preloaded routes to avoid duplicates
const preloadedRoutes = new Set();

export const preloadRoute = (route) => {
  if (routeImports[route] && !preloadedRoutes.has(route)) {
    preloadedRoutes.add(route);
    routeImports[route](); // Preload the component
    console.log(`Preloaded: ${route}`);
  }
};

// Preload next likely routes based on user role and current page
export const preloadLikelyRoutes = (userRole, currentRoute) => {
  const routesToPreload = [];
  
  switch (userRole) {
    case "admin":
      routesToPreload.push("/admin/dashboard", "/admin/patients", "/admin/appointments");
      break;
    case "doctor":
      routesToPreload.push("/doctor/dashboard", "/doctor/patients", "/doctor/appointments");
      break;
    case "patient":
      routesToPreload.push("/patient/dashboard", "/patient/appointments");
      break;
    case "employee":
      routesToPreload.push("/employee/dashboard", "/employee/patients", "/employee/appointments");
      break;
    default:
      routesToPreload.push("/login");
  }
  
  routesToPreload.forEach(route => {
    if (route !== currentRoute) {
      preloadRoute(route);
    }
  });
};

export default preloadRoute;
