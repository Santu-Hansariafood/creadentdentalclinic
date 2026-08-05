import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Briefcase,
  Award,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { fadeIn } from "../utils/motion";
import toast from "react-hot-toast";
import { useMutation } from "@apollo/client";
import { REGISTER } from "../graphql/mutations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../utils/schemas";
import { formatName, toCamelCase } from "../utils/validation";
import Preloader from "../components/Preloader";

const DoctorRegistration = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "doctor",
      specialization: "",
      license: "",
    },
  });

  const [registerDoctor] = useMutation(REGISTER, {
    onCompleted: () => {
      toast.success("Doctor registered successfully!");
      reset();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const onSubmit = async (data) => {
    const { confirmPassword, ...registerData } = data;
    const camelCaseData = toCamelCase(registerData);
    await registerDoctor({
      variables: camelCaseData,
    });
  };

  return (
    <Suspense fallback={<Preloader/>}>
    <div className="max-w-4xl mx-auto">
      <motion.div {...fadeIn("down")} className="mb-6 sm:mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Doctor Registration
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Add a new doctor to the clinic system
        </p>
      </motion.div>

      <motion.div {...fadeIn("up", 0.2)} className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  {...register("name")}
                  className={`input-field pl-10 ${errors.name ? "border-red-500" : ""}`}
                  placeholder="Dr. John Doe"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="email"
                  {...register("email")}
                  className={`input-field pl-10 ${errors.email ? "border-red-500" : ""}`}
                  placeholder="doctor@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="tel"
                  {...register("phone")}
                  className={`input-field pl-10 ${errors.phone ? "border-red-500" : ""}`}
                  placeholder="1234567890"
                  maxLength={10}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization *
              </label>
              <div className="relative">
                <Briefcase
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  {...register("specialization")}
                  className={`input-field pl-10 ${errors.specialization ? "border-red-500" : ""}`}
                  placeholder="e.g. Orthodontist"
                />
              </div>
              {errors.specialization && (
                <p className="text-red-500 text-xs mt-1">{errors.specialization.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Number *
              </label>
              <div className="relative">
                <Award
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  {...register("license")}
                  className={`input-field pl-10 ${errors.license ? "border-red-500" : ""}`}
                  placeholder="e.g. LIC-123456"
                />
              </div>
              {errors.license && (
                <p className="text-red-500 text-xs mt-1">{errors.license.message}</p>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className={`input-field pl-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="btn-primary px-8 flex items-center gap-2"
              disabled={isSubmitting}
            >
              <ShieldCheck size={20} />
              {isSubmitting ? "Registering..." : "Register Doctor"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
    </Suspense>
  );
};

export default DoctorRegistration;
