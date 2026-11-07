import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, User, LogOut, Menu, X, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@apollo/client";
import { GET_NOTIFICATIONS } from "../graphql/queries";

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { data: notifData } = useQuery(GET_NOTIFICATIONS, {
    pollInterval: 15000,
  });

  const notifications = notifData?.getNotifications || [];
  const unreadNotifications = notifications.filter((n) => !n.read);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case "patient":
        return "/patient/dashboard";
      case "doctor":
        return "/doctor/dashboard";
      case "admin":
        return "/admin/dashboard";
      case "employee":
        return "/employee/dashboard";
      default:
        return "/";
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 shadow-sm">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="lg:hidden mr-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to={getDashboardLink()} className="flex items-center">
              <img
                src="/logo/logo.png"
                alt="Creadent Dental Clinic"
                className="
                  h-12
                  sm:h-14
                  w-auto
                  max-w-[190px]
                  object-contain
                  block
                "
              />
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              to={`/${user?.role}/chat`}
              className="
                relative
                p-2.5
                rounded-lg
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors
              "
              aria-label="Messages"
            >
              <MessageSquare size={20} className="text-gray-600 dark:text-gray-400" />
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="
                  relative
                  p-2.5
                  rounded-lg
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-colors
                "
                aria-label="Notifications"
              >
                <Bell size={20} className="text-gray-600 dark:text-gray-400" />

                {unreadNotifications.length > 0 && (
                  <span
                    className="
                      absolute
                      top-1
                      right-1
                      w-2
                      h-2
                      bg-danger
                      rounded-full
                    "
                  />
                )}
              </button>

              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="
                    absolute
                    right-[-80px]
                    sm:right-0
                    mt-2
                    w-[280px]
                    sm:w-80
                    bg-white dark:bg-gray-800
                    rounded-lg
                    shadow-lg
                    border
                    border-gray-200 dark:border-gray-700
                    overflow-hidden
                  "
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-heading font-semibold text-gray-900 dark:text-gray-100">
                      Notifications
                    </h3>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto">
                    {unreadNotifications.length > 0 ? (
                      unreadNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            setShowNotifications(false);
                            navigate(
                              `/${user?.role}/appointment-requests${
                                notification.appointmentId
                                  ? `?appointment=${notification.appointmentId}`
                                  : ""
                              }`,
                            );
                          }}
                          className="
                            block
                            w-full
                            text-left
                            p-4
                            border-b
                            border-gray-100 dark:border-gray-800
                            hover:bg-gray-50 dark:hover:bg-gray-900
                            transition-colors
                          "
                        >
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>

                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>

                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />

                        <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="
                  flex
                  items-center
                  gap-2
                  p-1
                  sm:p-2
                  rounded-lg
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-colors
                "
              >
                <div
                  className="
                    w-8
                    h-8
                    bg-primary/10
                    rounded-full
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  <User size={18} className="text-primary" />
                </div>

                <span
                  className="
                    font-medium
                    text-sm
                    text-gray-700 dark:text-gray-300
                    hidden
                    md:block
                  "
                >
                  {user?.name}
                </span>
              </button>

              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="
                    absolute
                    right-0
                    mt-2
                    w-56
                    bg-white dark:bg-gray-800
                    rounded-lg
                    shadow-lg
                    border
                    border-gray-200 dark:border-gray-700
                    overflow-hidden
                  "
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-heading font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user?.name}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user?.role}
                    </p>
                  </div>

                  <div className="p-2">
                    <Link
                      to={`/${user?.role}/settings`}
                      className="
                        flex
                        items-center
                        gap-3
                        px-4
                        py-2
                        rounded-lg
                        hover:bg-gray-50 dark:hover:bg-gray-900
                        transition-colors
                      "
                      onClick={() => setShowProfile(false)}
                    >
                      <User size={16} className="text-gray-600 dark:text-gray-400" />

                      <span className="text-sm text-gray-700 dark:text-gray-300">Settings</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-4
                        py-2
                        rounded-lg
                        hover:bg-red-50 dark:hover:bg-red-950
                        transition-colors
                        text-left
                      "
                    >
                      <LogOut size={16} className="text-red-600 dark:text-red-400" />

                      <span className="text-sm text-red-600 dark:text-red-400">Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
