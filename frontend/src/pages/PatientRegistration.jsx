import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  AlertCircle,
  FileText,
  Shield,
  X,
} from "lucide-react";
import { fadeIn } from "../utils/motion";
import toast from "react-hot-toast";
import { useMutation, useQuery, useLazyQuery } from "@apollo/client";
import { CREATE_PATIENT, UPDATE_PATIENT } from "../graphql/mutations";
import { GET_PATIENTS, GET_MY_PATIENT, CHECK_PATIENT_EXISTS } from "../graphql/queries";
import { formatName, toCamelCase } from "../utils/validation";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientRegistrationSchema } from "../utils/schemas";

const PatientRegistration = ({ initialPatient = null, onClose = null, isSelfRegistration = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: myPatientData } = useQuery(GET_MY_PATIENT, {
    skip: !isSelfRegistration || !user,
  });
  
  const [checkPatientExistsQuery] = useLazyQuery(CHECK_PATIENT_EXISTS);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(patientRegistrationSchema),
    mode: "onSubmit", // Only validate on form submit
    defaultValues: {
      id: null,
      name: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      password: "",
      confirmPassword: "",
      bloodGroup: "",
      status: "Active",
      emergencyContactName: "",
      emergencyContactRelation: "",
      emergencyContactPhone: "",
      allergies: "",
      chronicConditions: "",
      medications: "",
      previousSurgeries: "",
      familyHistory: "",
      bloodPressure: "",
      height: "",
      weight: "",
      lastVisit: "",
      previousTreatments: "",
      currentIssues: "",
      insuranceProvider: "",
      policyNumber: "",
      expiryDate: "",
    },
  });

  // Custom async validation for phone number
  const checkPhoneExists = async (phone) => {
    if (!phone || phone.length !== 10) {
      return; // Skip check if invalid format
    }

    // If we're editing, skip check if phone hasn't changed
    if (initialPatient?.phone === phone) {
      return;
    }
    if (isSelfRegistration && myPatientData?.getMyPatient?.phone === phone) {
      return;
    }

    try {
      const { data } = await checkPatientExistsQuery({
        variables: { phone },
        fetchPolicy: "network-only"
      });

      if (data?.checkPatientExists) {
        return "This phone number is already registered as a patient";
      }
    } catch (error) {
      console.error("Error checking phone number:", error);
    }
  };

  const watchName = watch("name");
  const watchPhone = watch("phone");
  const watchEmergencyContactName = watch("emergencyContactName");
  const watchEmergencyContactRelation = watch("emergencyContactRelation");
  const watchEmergencyContactPhone = watch("emergencyContactPhone");
  
  // Auto-generate default password (year + last 4 digits of phone)
  useEffect(() => {
    if (watchPhone && watchPhone.length === 10) {
      const currentYear = new Date().getFullYear().toString();
      const last4Digits = watchPhone.slice(-4);
      const defaultPassword = currentYear + last4Digits;
      setValue("password", defaultPassword);
      setValue("confirmPassword", defaultPassword);
    }
  }, [watchPhone, setValue]);

  // Populate form when initialPatient or user (for self-registration) changes
  useEffect(() => {
    const loadPatientData = (patientData, userData = null) => ({
      id: patientData?.id || null,
      name: patientData?.name || userData?.name || "",
      email: patientData?.email || userData?.email || "",
      phone: patientData?.phone || userData?.phone || "",
      dateOfBirth: patientData?.dateOfBirth || "",
      gender: patientData?.gender || "",
      address: patientData?.address || "",
      bloodGroup: patientData?.bloodGroup || "",
      status: patientData?.status || "Active",
      emergencyContactName: patientData?.emergencyContact?.name || "",
      emergencyContactRelation: patientData?.emergencyContact?.relationship || "",
      emergencyContactPhone: patientData?.emergencyContact?.phone || "",
      allergies: patientData?.medicalHistory?.allergies?.join(", ") || "",
      chronicConditions: patientData?.medicalHistory?.chronicConditions?.join(", ") || "",
      medications: patientData?.medicalHistory?.medications?.join(", ") || "",
      previousSurgeries: patientData?.medicalHistory?.previousSurgeries?.join(", ") || "",
      familyHistory: patientData?.medicalHistory?.familyHistory?.join(", ") || "",
      bloodPressure: patientData?.vitalSigns?.bloodPressure || "",
      height: patientData?.vitalSigns?.height || "",
      weight: patientData?.vitalSigns?.weight || "",
      lastVisit: patientData?.dentalHistory?.lastVisit || "",
      previousTreatments: patientData?.dentalHistory?.previousTreatments?.join(", ") || "",
      currentIssues: patientData?.dentalHistory?.currentIssues?.join(", ") || "",
      insuranceProvider: patientData?.insurance?.provider || "",
      policyNumber: patientData?.insurance?.policyNumber || "",
      expiryDate: patientData?.insurance?.expiryDate || "",
    });

    if (isSelfRegistration && user) {
      if (myPatientData?.getMyPatient) {
        reset(loadPatientData(myPatientData.getMyPatient, user));
      } else {
        reset(loadPatientData(null, user));
      }
    } else if (initialPatient) {
      reset(loadPatientData(initialPatient));
    }
  }, [initialPatient, reset, isSelfRegistration, user, myPatientData]);

  const [createPatient] = useMutation(CREATE_PATIENT, {
    refetchQueries: isSelfRegistration 
      ? [{ query: GET_MY_PATIENT }] 
      : [{ query: GET_PATIENTS }],
    onCompleted: () => {
      toast.success("Patient registered successfully!");
      if (isSelfRegistration) {
        navigate("/patient/dashboard");
      } else {
        if (onClose) onClose();
        setCurrentStep(1);
        reset();
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const [updatePatient] = useMutation(UPDATE_PATIENT, {
    refetchQueries: isSelfRegistration 
      ? [{ query: GET_MY_PATIENT }] 
      : [{ query: GET_PATIENTS }],
    onCompleted: () => {
      toast.success("Patient updated successfully!");
      if (isSelfRegistration) {
        navigate("/patient/dashboard");
      } else {
        if (onClose) onClose();
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });



  const handleNext = async () => {
    // Validate step 1 fields before proceeding
    if (currentStep === 1) {
      const isValid = await trigger(["name", "phone", "dateOfBirth", "gender", "address"]);
      if (!isValid) return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data) => {
    // Format the form data into the nested structure expected by GraphQL
    const formattedData = {
      name: formatName(data.name),
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      bloodGroup: data.bloodGroup,
      status: data.status,
      password: data.password,
      userId: isSelfRegistration && user ? user.id : undefined,
      emergencyContact: (data.emergencyContactName || data.emergencyContactRelation || data.emergencyContactPhone) ? {
        name: formatName(data.emergencyContactName),
        relationship: formatName(data.emergencyContactRelation),
        phone: data.emergencyContactPhone,
      } : undefined,
      medicalHistory: (data.allergies || data.chronicConditions || data.medications || data.previousSurgeries || data.familyHistory) ? {
        allergies: data.allergies ? data.allergies.split(",").map(s => s.trim()).filter(Boolean) : [],
        chronicConditions: data.chronicConditions ? data.chronicConditions.split(",").map(s => s.trim()).filter(Boolean) : [],
        medications: data.medications ? data.medications.split(",").map(s => s.trim()).filter(Boolean) : [],
        previousSurgeries: data.previousSurgeries ? data.previousSurgeries.split(",").map(s => s.trim()).filter(Boolean) : [],
        familyHistory: data.familyHistory ? data.familyHistory.split(",").map(s => s.trim()).filter(Boolean) : [],
      } : undefined,
      vitalSigns: (data.bloodPressure || data.height || data.weight) ? {
        bloodPressure: data.bloodPressure,
        height: data.height,
        weight: data.weight,
      } : undefined,
      dentalHistory: (data.lastVisit || data.previousTreatments || data.currentIssues) ? {
        lastVisit: data.lastVisit,
        previousTreatments: data.previousTreatments ? data.previousTreatments.split(",").map(s => s.trim()).filter(Boolean) : [],
        currentIssues: data.currentIssues ? data.currentIssues.split(",").map(s => s.trim()).filter(Boolean) : [],
      } : undefined,
      insurance: (data.insuranceProvider || data.policyNumber || data.expiryDate) ? {
        provider: data.insuranceProvider,
        policyNumber: data.policyNumber,
        expiryDate: data.expiryDate,
      } : undefined,
    };

    if (data.id) {
      await updatePatient({
        variables: {
          id: data.id,
          ...formattedData,
        },
      });
    } else {
      await createPatient({
        variables: formattedData,
      });
    }
  };

  const steps = [
    { number: 1, title: "Personal Information", icon: User },
    { number: 2, title: "Emergency Contact", icon: Phone },
    { number: 3, title: "Medical History", icon: Heart },
    { number: 4, title: "Dental History", icon: FileText },
    { number: 5, title: "Insurance Details", icon: Shield },
  ];

  return (
    <div className={onClose ? "" : "max-w-4xl mx-auto"}>
      {onClose ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div 
            {...fadeIn("up", 0.1)} 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-gray-900">
                  {initialPatient ? "Edit Patient" : "Patient Registration"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {initialPatient 
                    ? "Update patient information" 
                    : "Complete the form to register a new patient"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-8 overflow-x-auto pb-4 sm:pb-0">
                <div className="flex items-center justify-between min-w-[600px] sm:min-w-0">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.number} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                              currentStep >= step.number
                                ? "bg-primary text-white shadow-md scale-110 sm:scale-100"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <p
                            className={`text-[10px] sm:text-xs mt-2 text-center whitespace-nowrap ${
                              currentStep >= step.number
                                ? "text-primary font-medium"
                                : "text-gray-500"
                            }`}
                          >
                            {step.title}
                          </p>
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className={`h-1 flex-1 mx-1 sm:mx-2 transition-all ${
                              currentStep > step.number ? "bg-primary" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <motion.div {...fadeIn("up", 0.2)} className="card">
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                        Personal Information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            {...register("name")}
                            className={`input-field ${errors.name ? "border-red-500" : ""}`}
                          />
                          {errors.name && (
                            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            {...register("email")}
                            className={`input-field ${errors.email ? "border-red-500" : ""}`}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            {...register("phone", {
                              validate: {
                                asyncCheck: checkPhoneExists
                              }
                            })}
                            className={`input-field ${errors.phone ? "border-red-500" : ""}`}
                            maxLength={10}
                          />
                          {errors.phone && (
                            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date of Birth *
                          </label>
                          <input
                            type="date"
                            {...register("dateOfBirth")}
                            className={`input-field ${errors.dateOfBirth ? "border-red-500" : ""}`}
                          />
                          {errors.dateOfBirth && (
                            <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gender *
                          </label>
                          <select
                            {...register("gender")}
                            className={`input-field ${errors.gender ? "border-red-500" : ""}`}
                          >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                          {errors.gender && (
                            <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Blood Group
                          </label>
                          <select
                            {...register("bloodGroup")}
                            className="input-field"
                          >
                            <option value="">Select blood group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address *
                        </label>
                        <textarea
                          {...register("address")}
                          className={`input-field ${errors.address ? "border-red-500" : ""}`}
                          rows={3}
                        />
                        {errors.address && (
                          <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                        )}
                      </div>

                      {!isSelfRegistration && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
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
                                type="text"
                                {...register("password")}
                                className={`input-field pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                              />
                            </div>
                            {errors.password && (
                              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Default: Current year + last 4 digits of phone
                            </p>
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
                                type="text"
                                {...register("confirmPassword")}
                                className={`input-field pl-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                              />
                            </div>
                            {errors.confirmPassword && (
                              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                        Emergency Contact
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Name *
                          </label>
                          <input
                            type="text"
                            {...register("emergencyContactName")}
                            className={`input-field ${errors.emergencyContactName ? "border-red-500" : ""}`}
                          />
                          {errors.emergencyContactName && (
                            <p className="text-red-500 text-xs mt-1">{errors.emergencyContactName.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Relationship *
                          </label>
                          <input
                            type="text"
                            {...register("emergencyContactRelation")}
                            className={`input-field ${errors.emergencyContactRelation ? "border-red-500" : ""}`}
                            placeholder="e.g., Spouse, Parent, Sibling"
                          />
                          {errors.emergencyContactRelation && (
                            <p className="text-red-500 text-xs mt-1">{errors.emergencyContactRelation.message}</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Phone *
                          </label>
                          <input
                            type="tel"
                            {...register("emergencyContactPhone")}
                            className={`input-field ${errors.emergencyContactPhone ? "border-red-500" : ""}`}
                            maxLength={10}
                          />
                          {errors.emergencyContactPhone && (
                            <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                        Medical History
                      </h2>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Known Allergies
                        </label>
                        <textarea
                          {...register("allergies")}
                          className="input-field"
                          rows={2}
                          placeholder="List any known allergies (medications, food, etc.)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chronic Conditions
                        </label>
                        <textarea
                          {...register("chronicConditions")}
                          className="input-field"
                          rows={2}
                          placeholder="List any chronic health conditions"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Medications
                        </label>
                        <textarea
                          {...register("medications")}
                          className="input-field"
                          rows={2}
                          placeholder="List current medications and dosages"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Previous Surgeries
                        </label>
                        <textarea
                          {...register("previousSurgeries")}
                          className="input-field"
                          rows={2}
                          placeholder="List any previous surgeries with dates"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Family Medical History
                        </label>
                        <textarea
                          {...register("familyHistory")}
                          className="input-field"
                          rows={2}
                          placeholder="Relevant family medical history"
                        />
                      </div>
                      <div className="border-t border-gray-100 pt-4">
                        <h3 className="font-medium text-gray-900 mb-3">
                          Vital Signs (Baseline)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Blood Pressure
                            </label>
                            <input
                              type="text"
                              {...register("bloodPressure")}
                              className="input-field"
                              placeholder="e.g., 120/80"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Height (cm)
                            </label>
                            <input
                              type="text"
                              {...register("height")}
                              className="input-field"
                              placeholder="e.g., 175"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Weight (kg)
                            </label>
                            <input
                              type="text"
                              {...register("weight")}
                              className="input-field"
                              placeholder="e.g., 70"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                        Dental History
                      </h2>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Dental Visit
                        </label>
                        <input
                          type="date"
                          {...register("lastVisit")}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Previous Dental Treatments
                        </label>
                        <textarea
                          {...register("previousTreatments")}
                          className="input-field"
                          rows={3}
                          placeholder="Describe any previous dental treatments (fillings, root canals, etc.)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Dental Issues
                        </label>
                        <textarea
                          {...register("currentIssues")}
                          className="input-field"
                          rows={3}
                          placeholder="Describe any current dental problems or concerns"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-4">
                      <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                        Insurance Details
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Insurance Provider
                          </label>
                          <input
                            type="text"
                            {...register("insuranceProvider")}
                            className="input-field"
                            placeholder="e.g., Delta Dental, Cigna"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Policy Number
                          </label>
                          <input
                            type="text"
                            {...register("policyNumber")}
                            className="input-field"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Policy Expiry Date
                          </label>
                          <input
                            type="date"
                            {...register("expiryDate")}
                            className="input-field"
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg mt-4">
                        <div className="flex gap-3">
                          <AlertCircle
                            size={20}
                            className="text-blue-600 flex-shrink-0 mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              Insurance Verification
                            </p>
                            <p className="text-xs text-blue-700">
                              Please ensure all insurance information is accurate. We
                              will verify coverage before your first appointment.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePrevious}
                        className="btn-outline"
                      >
                        Previous
                      </button>
                    )}
                    {currentStep < 5 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="btn-primary ml-auto"
                      >
                        Next
                      </button>
                    ) : (
                      <button type="submit" className="btn-primary ml-auto" disabled={isSubmitting}>
                        Complete Registration
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          <motion.div {...fadeIn("down")} className="mb-6 sm:mb-8">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {initialPatient ? "Edit Patient" : "Patient Registration"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {initialPatient 
                ? "Update patient information" 
                : "Complete the form to register a new patient"}
            </p>
          </motion.div>

          <div className="mb-8 overflow-x-auto pb-4 sm:pb-0">
            <div className="flex items-center justify-between min-w-[600px] sm:min-w-0">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                          currentStep >= step.number
                            ? "bg-primary text-white shadow-md scale-110 sm:scale-100"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <p
                        className={`text-[10px] sm:text-xs mt-2 text-center whitespace-nowrap ${
                          currentStep >= step.number
                            ? "text-primary font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-1 sm:mx-2 transition-all ${
                          currentStep > step.number ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <motion.div {...fadeIn("up", 0.2)} className="card">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        {...register("name")}
                        className={`input-field ${errors.name ? "border-red-500" : ""}`}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        {...register("email")}
                        className={`input-field ${errors.email ? "border-red-500" : ""}`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        {...register("phone", {
                          validate: {
                            asyncCheck: checkPhoneExists
                          }
                        })}
                        className={`input-field ${errors.phone ? "border-red-500" : ""}`}
                        maxLength={10}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        {...register("dateOfBirth")}
                        className={`input-field ${errors.dateOfBirth ? "border-red-500" : ""}`}
                      />
                      {errors.dateOfBirth && (
                        <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender *
                      </label>
                      <select
                        {...register("gender")}
                        className={`input-field ${errors.gender ? "border-red-500" : ""}`}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && (
                        <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Group
                      </label>
                      <select
                        {...register("bloodGroup")}
                        className="input-field"
                      >
                        <option value="">Select blood group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      {...register("address")}
                      className={`input-field ${errors.address ? "border-red-500" : ""}`}
                      rows={3}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                    Emergency Contact
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        {...register("emergencyContactName")}
                        className={`input-field ${errors.emergencyContactName ? "border-red-500" : ""}`}
                      />
                      {errors.emergencyContactName && (
                        <p className="text-red-500 text-xs mt-1">{errors.emergencyContactName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship *
                      </label>
                      <input
                        type="text"
                        {...register("emergencyContactRelation")}
                        className={`input-field ${errors.emergencyContactRelation ? "border-red-500" : ""}`}
                        placeholder="e.g., Spouse, Parent, Sibling"
                      />
                      {errors.emergencyContactRelation && (
                        <p className="text-red-500 text-xs mt-1">{errors.emergencyContactRelation.message}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        {...register("emergencyContactPhone")}
                        className={`input-field ${errors.emergencyContactPhone ? "border-red-500" : ""}`}
                        maxLength={10}
                      />
                      {errors.emergencyContactPhone && (
                        <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                    Medical History
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Known Allergies
                    </label>
                    <textarea
                      {...register("allergies")}
                      className="input-field"
                      rows={2}
                      placeholder="List any known allergies (medications, food, etc.)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chronic Conditions
                    </label>
                    <textarea
                      {...register("chronicConditions")}
                      className="input-field"
                      rows={2}
                      placeholder="List any chronic health conditions"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Medications
                    </label>
                    <textarea
                      {...register("medications")}
                      className="input-field"
                      rows={2}
                      placeholder="List current medications and dosages"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Surgeries
                    </label>
                    <textarea
                      {...register("previousSurgeries")}
                      className="input-field"
                      rows={2}
                      placeholder="List any previous surgeries with dates"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Medical History
                    </label>
                    <textarea
                      {...register("familyHistory")}
                      className="input-field"
                      rows={2}
                      placeholder="Relevant family medical history"
                    />
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Vital Signs (Baseline)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Blood Pressure
                        </label>
                        <input
                          type="text"
                          {...register("bloodPressure")}
                          className="input-field"
                          placeholder="e.g., 120/80"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Height (cm)
                        </label>
                        <input
                          type="text"
                          {...register("height")}
                          className="input-field"
                          placeholder="e.g., 175"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Weight (kg)
                        </label>
                        <input
                          type="text"
                          {...register("weight")}
                          className="input-field"
                          placeholder="e.g., 70"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                    Dental History
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Dental Visit
                    </label>
                    <input
                      type="date"
                      {...register("lastVisit")}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Dental Treatments
                    </label>
                    <textarea
                      {...register("previousTreatments")}
                      className="input-field"
                      rows={3}
                      placeholder="Describe any previous dental treatments (fillings, root canals, etc.)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Dental Issues
                    </label>
                    <textarea
                      {...register("currentIssues")}
                      className="input-field"
                      rows={3}
                      placeholder="Describe any current dental problems or concerns"
                    />
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                    Insurance Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Provider
                      </label>
                      <input
                        type="text"
                        {...register("insuranceProvider")}
                        className="input-field"
                        placeholder="e.g., Delta Dental, Cigna"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Policy Number
                      </label>
                      <input
                        type="text"
                        {...register("policyNumber")}
                        className="input-field"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Policy Expiry Date
                      </label>
                      <input
                        type="date"
                        {...register("expiryDate")}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg mt-4">
                    <div className="flex gap-3">
                      <AlertCircle
                        size={20}
                        className="text-blue-600 flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Insurance Verification
                        </p>
                        <p className="text-xs text-blue-700">
                          Please ensure all insurance information is accurate. We
                          will verify coverage before your first appointment.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="btn-outline"
                  >
                    Previous
                  </button>
                )}
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-primary ml-auto"
                  >
                    Next
                  </button>
                ) : (
                  <button type="submit" className="btn-primary ml-auto" disabled={isSubmitting}>
                    Complete Registration
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default PatientRegistration;
