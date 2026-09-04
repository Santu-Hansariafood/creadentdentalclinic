import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import LoadingFallback from "./LoadingFallback";

const DashboardShell = ({
  children,
  isAuthenticated,
  onToggleSidebar,
  sidebarOpen,
}) => {
  const location = useLocation();
  const isPublicPage =
    !location.pathname.startsWith("/admin/") &&
    !location.pathname.startsWith("/doctor/") &&
    !location.pathname.startsWith("/employee/") &&
    !location.pathname.startsWith("/patient/");
  const showChrome = isAuthenticated && !isPublicPage;

  return (
    <div className="min-h-screen bg-gray-50">
      {showChrome && (
        <Navbar toggleSidebar={onToggleSidebar} isSidebarOpen={sidebarOpen} />
      )}
      <div className="flex">
        {showChrome && (
          <Sidebar isOpen={sidebarOpen} setIsOpen={onToggleSidebar} />
        )}
        <main
          className={`flex-1 transition-all duration-300 ${showChrome ? "lg:ml-64 mt-16" : ""}`}
        >
          <div className={isPublicPage ? "" : "p-4 sm:p-6 lg:p-8"}>
            {children || <LoadingFallback />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
