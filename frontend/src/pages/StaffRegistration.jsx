import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Briefcase,
  Award,
  ShieldCheck,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { fadeIn } from "../utils/motion";
import toast from "react-hot-toast";
import { useMutation } from "@apollo/client";
import { REGISTER } from "../graphql/mutations";
import {
  formatName,
  toCamelCase,
} from "../utils/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../utils/schemas";

const StaffRegistration = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  const watchName = watch("name");
  const watchPhone = watch("phone");
  const watchSpecialization = watch("specialization");
  const watchRole = watch("role");

  // Format name and phone as user types
  useEffect(() => {
    if (watchName) {
      const formatted = formatName(watchName);
      if (formatted !== watchName) {
        setValue("name", formatted);
      }
    }
  }, [watchName, setValue]);

  useEffect(() => {
    if (watchSpecialization) {
      const formatted = formatName(watchSpecialization);
      if (formatted !== watchSpecialization) {
        setValue("specialization", formatted);
      }
    }
  }, [watchSpecialization, setValue]);

  useEffect(() => {
    if (watchPhone) {
      const formatted = watchPhone.replace(/\D/g, "").slice(0, 10);
      if (formatted !== watchPhone) {
        setValue("phone", formatted);
      }
    }
  }, [watchPhone, setValue]);

  const [registerStaff] = useMutation(REGISTER, {
    onCompleted: () => {
      toast.success("Staff registered successfully!");
      reset();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const onSubmit = async (data) => {
    const { confirmPassword, ...registerData } = data;
    const formattedData = {
      ...registerData,
      name: formatName(registerData.name),
      specialization: registerData.specialization
        ? formatName(registerData.specialization)
        : undefined,
    };

    const finalData = toCamelCase(formattedData);
    if (finalData.role !== "doctor") {
      delete finalData.specialization;
      delete finalData.license;
    }

    await registerStaff({
      variables: finalData,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div {...fadeIn("down")} className="mb-6 sm:mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Staff Registration
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Add new staff members to the clinic system
        </p>
      </motion.div>

      <motion.div {...fadeIn("up", 0.2)} className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Staff Role
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: "doctor", label: "Doctor", icon: Award },
                { id: "admin", label: "Admin", icon: ShieldCheck },
                { id: "employee", label: "Employee", icon: UserPlus },
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setValue("role", role.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    watchRole === role.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 hover:border-primary/50 text-gray-600"
                  }`}
                >
                  <role.icon size={24} />
                  <span className="text-sm font-medium">{role.label}</span>
                </button>
              ))}
            </div>
          </div>

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
                  placeholder="John Doe"
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
                  placeholder="staff@clinic.com"
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
                  placeholder="+1 (555) 000-0000"
                  maxLength={10}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            {watchRole === "doctor" && (
              <>
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
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
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

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="btn-primary px-8 flex items-center gap-2"
              disabled={isSubmitting}
            >
              <UserPlus size={20} />
              {isSubmitting ? "Registering..." : "Register Staff"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default StaffRegistration;
