import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Pill,
  MessageSquare,
  CreditCard,
  Users,
  UserPlus,
  Package,
  PlusCircle,
  Award,
  BarChart3,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { preloadRoute } from "../utils/preload";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  const patientLinks = [
    { to: "/patient/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/patient/appointments", icon: Calendar, label: "Appointments" },
    { to: "/patient/records", icon: FileText, label: "Medical Records" },
    { to: "/patient/prescriptions", icon: Pill, label: "Prescriptions" },
    { to: "/patient/chat", icon: MessageSquare, label: "Messages" },
    { to: "/patient/billing", icon: CreditCard, label: "Billing" },
    { to: "/patient/settings", icon: Settings, label: "Settings" },
  ];

  const doctorLinks = [
    { to: "/doctor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/doctor/appointments", icon: Calendar, label: "Appointments" },
    { to: "/doctor/patients", icon: Users, label: "Patients" },
    { to: "/doctor/records", icon: FileText, label: "Medical Records" },
    { to: "/doctor/prescriptions", icon: Pill, label: "Prescriptions" },
    { to: "/doctor/medicines", icon: Package, label: "Medicines" },
    {
      to: "/doctor/medicine-registration",
      icon: PlusCircle,
      label: "Register Medicine",
    },
    { to: "/doctor/payment-ledger", icon: FileText, label: "Payment Ledger" },
    { to: "/doctor/chat", icon: MessageSquare, label: "Messages" },
    { to: "/doctor/settings", icon: Settings, label: "Settings" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/patients", icon: Users, label: "Patients" },
    {
      to: "/admin/patient-registration",
      icon: UserPlus,
      label: "Register Patient",
    },
    { to: "/admin/staff-registration", icon: Award, label: "Register Staff" },
    { to: "/admin/medicines", icon: Package, label: "Medicines" },
    {
      to: "/admin/medicine-registration",
      icon: PlusCircle,
      label: "Register Medicine",
    },
    { to: "/admin/payment-ledger", icon: FileText, label: "Payment Ledger" },
    { to: "/admin/appointments", icon: Calendar, label: "Appointments" },
    { to: "/admin/records", icon: FileText, label: "Medical Records" },
    { to: "/admin/billing", icon: CreditCard, label: "Billing" },
    { to: "/admin/reports", icon: BarChart3, label: "Reports" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case "patient":
        return patientLinks;
      case "doctor":
        return doctorLinks;
      case "admin":
        return adminLinks;
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto z-40 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="p-4 space-y-1">
          {links.map((link, index) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className="relative"
                onClick={() => setIsOpen(false)}
                onMouseEnter={() => preloadRoute(link.to)}
                onFocus={() => preloadRoute(link.to)}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{link.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
