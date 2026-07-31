import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fadeIn } from "../utils/motion";
import { useMutation } from "@apollo/client";
import { FORGOT_PASSWORD, RESET_PASSWORD } from "../graphql/mutations";
import toast from "react-hot-toast";
import { preloadRoute } from "../utils/preload";
import SEO from "../components/SEO";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../utils/schemas";

const Login = () => {
  const [role, setRole] = useState("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState("login");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const [forgotPasswordMutation] = useMutation(FORGOT_PASSWORD);
  const [resetPasswordMutation] = useMutation(RESET_PASSWORD);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const watchPhone = watch("phone");

  useEffect(() => {
    preloadRoute("/register");
    preloadRoute("/patient/dashboard");
    preloadRoute("/doctor/dashboard");
    preloadRoute("/admin/dashboard");
  }, []);

  const onSubmit = async (data) => {
    console.log("🔍 Login form submission debug:");
    console.log("   Form data:", data);
    console.log("   Phone value type:", typeof data.phone);
    console.log("   Phone value:", data.phone);
    console.log("   Password value type:", typeof data.password);
    console.log("   Password value (length):", data.password?.length);
    console.log("   Form errors:", errors);
    
    const result = await login(data.phone, data.password);
    if (result.success) {
      navigate("/");
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const { data } = await forgotPasswordMutation({
        variables: { phone: watchPhone },
      });
      if (data.forgotPassword) {
        toast.success("6-digit OTP sent to your WhatsApp!");
        setView("reset");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetLoading(true);

    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match!");
      setResetLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      setResetLoading(false);
      return;
    }

    try {
      const { data } = await resetPasswordMutation({
        variables: { phone: watchPhone, otp, newPassword },
      });
      if (data.resetPassword) {
        toast.success("Password reset successfully!");
        setView("login");
        setValue("password", "");
        setNewPassword("");
        setConfirmNewPassword("");
        setOtp("");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Login to Creadent Dental Clinic | Book Appointment"
        description="Login to Creadent Dental Clinic to book appointments, view records, and manage your dental care."
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 p-4">
        <motion.div {...fadeIn("up")} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <img
                src="/logo/logo.png"
                alt="Creadent Dental Clinic Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
              {view === "login"
                ? "Welcome Back"
                : view === "forgot"
                  ? "Forgot Password"
                  : "Reset Password"}
            </h1>
            <p className="text-gray-600">
              {view === "login"
                ? "Sign in to access your Creadent Dental Clinic account"
                : view === "forgot"
                  ? "Enter your registered mobile number to receive an OTP"
                  : "Enter the 6-digit OTP sent to your WhatsApp"}
            </p>
          </div>

          <div className="card">
            <AnimatePresence mode="wait">
              {view === "login" && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                  noValidate
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "patient", label: "Patient" },
                        { id: "doctor", label: "Doctor" },
                        { id: "admin", label: "Admin" },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            role === r.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-gray-200 hover:border-primary/50 text-gray-600"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="tel"
                        {...register("phone")}
                        className={`input-field pl-10 ${errors.phone ? "border-red-500" : ""}`}
                        placeholder="Enter 10-digit mobile number"
                        maxLength={10}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        className={`input-field pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full"
                  >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </button>
                </motion.form>
              )}

              {view === "forgot" && (
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleForgotSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="tel"
                        {...register("phone")}
                        className={`input-field pl-10 ${errors.phone ? "border-red-500" : ""}`}
                        placeholder="Enter 10-digit mobile number"
                        maxLength={10}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <button type="submit" disabled={forgotLoading} className="btn-primary w-full">
                    {forgotLoading ? "Sending OTP..." : "Send OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-primary transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Back to Login
                  </button>
                </motion.form>
              )}

              {view === "reset" && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleResetSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      6-Digit OTP
                    </label>
                    <div className="relative">
                      <KeyRound
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                        className="input-field pl-10 tracking-[0.5em] font-bold text-lg"
                        placeholder="000000"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pl-10"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="input-field pl-10"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={resetLoading} className="btn-primary w-full">
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </button>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOtp("");
                        const fakeEvent = { preventDefault: () => {} };
                        handleForgotSubmit(fakeEvent);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Resend OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-primary transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Back to Login
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {view === "login" && (
              <>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="text-primary font-medium hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
