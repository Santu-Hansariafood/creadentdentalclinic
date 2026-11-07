import { Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fadeIn } from "../utils/motion";
import { formatName, toCamelCase } from "../utils/validation";
import toast from "react-hot-toast";
import SEO from "../components/SEO";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../utils/schemas";
import Preloader from "../components/Preloader";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "patient",
    },
  });

  const onSubmit = async (data) => {
    const { confirmPassword, ...submitData } = data;
    const camelCaseData = toCamelCase({
      ...submitData,
      name: formatName(submitData.name),
    });

    const result = await registerUser(camelCaseData);

    if (result.success) {
      navigate("/");
    }
  };

  return (
    <Suspense fallback={<Preloader />}>
      <SEO
        title="Register at Creadent Dental Clinic | Patient Sign Up"
        description="Create an account at Creadent Dental Clinic to book appointments, access dental records, and receive personalized care."
        noindex
        nofollow
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white dark:via-gray-900 to-secondary/5 p-4">
        <motion.div {...fadeIn("up")} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <img
                src="/logo/logo.png"
                alt="Creadent Dental Clinic Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Join our creadent dental clinic management system
            </p>
          </div>

          <div className="card">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={20}
                  />
                  <input
                    type="text"
                    {...register("name")}
                    className={`input-field pl-10 ${errors.name ? "border-red-500" : ""}`}
                    placeholder="Enter Your Full Name"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address{" "}
                  <span className="text-gray-500 dark:text-gray-400 text-xs">(optional)</span>
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={20}
                  />
                  <input
                    type="email"
                    {...register("email")}
                    className={`input-field pl-10 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="Enter your Email ID"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={20}
                  />
                  <input
                    type="tel"
                    {...register("phone")}
                    className={`input-field pl-10 ${errors.phone ? "border-red-500" : ""}`}
                    placeholder="Enter Your Phone Number"
                    maxLength={10}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`input-field pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className={`input-field pl-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-300 dark:border-gray-600"
                  required
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  I agree to the{" "}
                  <Link to="#" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="#" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Suspense>
  );
};

export default Register;
