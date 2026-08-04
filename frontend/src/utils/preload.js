import publicContent from "../data/publicPages.json";

const routeImports = {
  "/login": () => import("../pages/Login"),
  "/register": () => import("../pages/Register"),
  "/verify-otp": () => import("../pages/OTPVerification"),
  "/patient/dashboard": () => import("../pages/PatientDashboard"),
  "/doctor/dashboard": () => import("../pages/DoctorDashboard"),
  "/admin/dashboard": () => import("../pages/AdminDashboard"),
  "/employee/dashboard": () => import("../pages/EmployeeDashboard"),
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
  "/admin/patient-registration": () => import("../pages/PatientRegistration"),
  "/employee/patient-registration": () => import("../pages/PatientRegistration"),
  "/admin/patients": () => import("../pages/PatientList"),
  "/employee/patients": () => import("../pages/PatientList"),
  "/admin/appointments": () => import("../pages/Appointments"),
  "/employee/appointments": () => import("../pages/Appointments"),
  "/admin/records": () => import("../pages/MedicalRecords"),
  "/employee/records": () => import("../pages/MedicalRecords"),
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
};

publicContent.pages.forEach((page) => {
  routeImports[page.path] = () => import("../pages/PublicContentPage");
});

const preloadedRoutes = new Set();
const hintedAssets = new Set();

const scheduleIdleTask = (callback) => {
  if (typeof window === "undefined") {
    callback();
    return;
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1500 });
    return;
  }

  window.setTimeout(callback, 250);
};

const addHint = ({ href, rel, as, crossOrigin, fetchPriority }) => {
  if (typeof document === "undefined" || hintedAssets.has(`${rel}:${href}`)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;

  if (as) {
    link.as = as;
  }

  if (crossOrigin) {
    link.crossOrigin = crossOrigin;
  }

  if (fetchPriority) {
    link.setAttribute("fetchpriority", fetchPriority);
  }

  document.head.appendChild(link);
  hintedAssets.add(`${rel}:${href}`);
};

export const preloadRoute = (route) => {
  if (routeImports[route] && !preloadedRoutes.has(route)) {
    preloadedRoutes.add(route);
    routeImports[route]();
  }
};

export const prefetchRoute = (route) => {
  if (!routeImports[route] || preloadedRoutes.has(route)) {
    return;
  }

  scheduleIdleTask(() => preloadRoute(route));
};

export const prefetchRoutes = (routes = [], currentRoute = "") => {
  routes.forEach((route) => {
    if (route && route !== currentRoute) {
      prefetchRoute(route);
    }
  });
};

export const prefetchCriticalAssets = () => {
  addHint({ href: "/logo/logo.png", rel: "preload", as: "image", fetchpriority: "high" });
  addHint({ href: "/favicon/favicon.ico", rel: "prefetch", as: "image" });
};

export const preloadLikelyRoutes = (userRole, currentRoute) => {
  const routesByRole = {
    admin: ["/admin/dashboard", "/admin/patients", "/admin/appointments"],
    doctor: ["/doctor/dashboard", "/doctor/patients", "/doctor/appointments"],
    patient: ["/patient/dashboard", "/patient/appointments", "/patient/records"],
    employee: ["/employee/dashboard", "/employee/patients", "/employee/appointments"],
  };

  prefetchRoutes(routesByRole[userRole] || ["/login"], currentRoute);
};

export const preloadPublicRoutes = (currentRoute) => {
  const publicPaths = publicContent.pages.map((page) => page.path);
  prefetchRoutes(publicPaths, currentRoute);
};

export default preloadRoute;
