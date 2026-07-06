import { useState, useEffect, useRef } from "react";
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
import { REGISTER, UPDATE_USER } from "../graphql/mutations";
import {
  formatName,
  toCamelCase,
} from "../utils/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../utils/schemas";

const StaffRegistration = ({ initialStaff, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const phoneInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const specializationInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: initialStaff ? {
      name: initialStaff.name,
      email: initialStaff.email,
      phone: initialStaff.phone,
      password: "",
      confirmPassword: "",
      role: initialStaff.role,
      specialization: initialStaff.specialization || "",
      license: initialStaff.license || "",
    } : {
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
  const { ref: nameFieldRef, ...nameField } = register("name");
  const { ref: phoneFieldRef, ...phoneField } = register("phone");
  const { ref: specializationFieldRef, ...specializationField } =
    register("specialization");

  // Format phone as user types

  useEffect(() => {
    if (watchPhone) {
      const formatted = watchPhone.replace(/\D/g, "").slice(0, 10);
      if (formatted !== watchPhone) {
        const cursorPosition = phoneInputRef.current?.selectionStart;
        setValue("phone", formatted, { shouldValidate: false });
        if (cursorPosition !== null && phoneInputRef.current) {
          phoneInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }
    }
  }, [watchPhone, setValue]);

  const [registerStaff] = useMutation(REGISTER, {
    onCompleted: () => {
      toast.success("Staff registered successfully!");
      reset();
      if (onClose) onClose();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const [updateStaff] = useMutation(UPDATE_USER, {
    onCompleted: () => {
      toast.success("Staff updated successfully!");
      if (onClose) onClose();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const onSubmit = async (data) => {
    const { confirmPassword, ...submitData } = data;
    const formattedData = {
      ...submitData,
      name: formatName(submitData.name),
      specialization: submitData.specialization
        ? formatName(submitData.specialization)
        : undefined,
    };

    const finalData = toCamelCase(formattedData);
    if (finalData.role !== "doctor") {
      delete finalData.specialization;
      delete finalData.license;
    }
    
    if (!finalData.password) {
      delete finalData.password;
    }

    if (initialStaff) {
      await updateStaff({ variables: { id: initialStaff.id, ...finalData } });
    } else {
      await registerStaff({ variables: finalData });
    }
  };

  const FormContent = () => (
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
              {...nameField}
              ref={(element) => {
                nameFieldRef(element);
                nameInputRef.current = element;
              }}
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
              {...phoneField}
              ref={(element) => {
                phoneFieldRef(element);
                phoneInputRef.current = element;
              }}
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
                  {...specializationField}
                  ref={(element) => {
                    specializationFieldRef(element);
                    specializationInputRef.current = element;
                  }}
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
            Password {!initialStaff && "*"}
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", { required: !initialStaff })}
              className={`input-field pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
              placeholder={initialStaff ? "Leave blank to keep current" : "••••••••"}
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
            Confirm Password {!initialStaff && "*"}
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type={showPassword ? "text" : "password"}
              {...register("confirmPassword", { 
                required: !initialStaff,
                validate: (value, formValues) => !initialStaff || value === formValues.password || value === ""
              })}
              className={`input-field pl-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
              placeholder={initialStaff ? "Leave blank to keep current" : "••••••••"}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-6"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-primary px-8 flex items-center gap-2"
          disabled={isSubmitting}
        >
          <UserPlus size={20} />
          {isSubmitting ? (initialStaff ? "Saving..." : "Registering...") : (initialStaff ? "Save Changes" : "Register Staff")}
        </button>
      </div>
    </form>
  );

  // Modal view if editing
  if (initialStaff) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-gray-900">Edit Staff</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <FormContent />
          </div>
        </div>
      </div>
    );
  }

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
        <FormContent />
      </motion.div>
    </div>
  );
};

export default StaffRegistration;
