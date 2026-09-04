import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Save,
  Settings as SettingsIcon,
  Shield,
  Users,
  Bell,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fadeIn } from "../utils/motion";
import toast from "react-hot-toast";
import Preloader from "../components/Preloader";
import PageHeader from "../components/PageHeader";

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Profile updated successfully!");
      setLoading(false);
    }, 1000);
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Notification preferences saved!");
      setLoading(false);
    }, 1000);
  };

  if (user?.role !== "admin") {
    return (
      <Suspense fallback={<Preloader />}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeIn("down")} className="card text-center py-16">
            <Shield size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              Only administrators can access the settings page.
            </p>
          </motion.div>
        </div>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Preloader />}>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Settings"
          subtitle="Manage your account and clinic preferences"
        />
        <motion.div {...fadeIn("up", 0.1)} className="card">
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "profile"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <User size={18} />
                Profile
              </div>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "notifications"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell size={18} />
                Notifications
              </div>
            </button>
            <button
              onClick={() => setActiveTab("clinic")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "clinic"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <SettingsIcon size={18} />
                Clinic
              </div>
            </button>
          </div>

          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="input-field pl-10"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      className="input-field pl-10"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className="input-field pl-10"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={loading}
                >
                  <Save size={20} />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "notifications" && (
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Email Notifications
                    </p>
                    <p className="text-sm text-gray-600">
                      Receive emails about appointments and updates
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        email: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      SMS Notifications
                    </p>
                    <p className="text-sm text-gray-600">
                      Get text messages for reminders
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        sms: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Push Notifications
                    </p>
                    <p className="text-sm text-gray-600">
                      Browser push notifications
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        push: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={loading}
                >
                  <Save size={20} />
                  {loading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "clinic" && (
            <div className="space-y-6">
              <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <Shield className="text-primary mt-1" size={24} />
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2">
                      Clinic Settings
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Manage clinic preferences, working hours, and staff
                      settings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() =>
                    toast.info("Clinic hours feature coming soon!")
                  }
                  className="card hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <SettingsIcon size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Working Hours</p>
                      <p className="text-sm text-gray-600">
                        Set clinic operating hours
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    toast.info("Staff management feature coming soon!")
                  }
                  className="card hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Manage Staff</p>
                      <p className="text-sm text-gray-600">
                        View and edit staff members
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Suspense>
  );
};

export default Settings;
