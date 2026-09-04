import { Suspense, useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Pill,
  Search,
  Filter,
  Plus,
  Trash2,
  Download,
  Mail,
  Loader2,
  AlertTriangle,
  ChevronDown,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PrescriptionCard from "../components/PrescriptionCard";
import { fadeIn, staggerContainer } from "../utils/motion";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_PRESCRIPTIONS,
  GET_PATIENTS,
  GET_MEDICINES,
} from "../graphql/queries";
import {
  CREATE_PRESCRIPTION,
  SEND_PRESCRIPTION_EMAIL,
  SEND_PRESCRIPTION_WHATSAPP_LINK,
} from "../graphql/mutations";
import generatePrescriptionPDF from "../components/PrescriptionPDF";
import Preloader from "../components/Preloader";

const DOSAGE_OPTIONS = [
  "125mg",
  "250mg",
  "500mg",
  "750mg",
  "1000mg",
  "5ml",
  "10ml",
  "15ml",
  "1 tablet",
  "2 tablets",
  "1 capsule",
  "2 capsules",
  "1 puff",
  "2 puffs",
  "1 drop",
  "2 drops",
  "As directed",
];

const FREQUENCY_OPTIONS = [
  "Once daily (OD)",
  "Twice daily (BD)",
  "Thrice daily (TDS)",
  "Four times daily (QID)",
  "Every 4 hours (Q4H)",
  "Every 6 hours (Q6H)",
  "Every 8 hours (Q8H)",
  "Every 12 hours (Q12H)",
  "At bedtime (HS)",
  "Before food (AC)",
  "After food (PC)",
  "As needed (SOS)",
  "Weekly once",
  "Alternate day",
];

const DURATION_OPTIONS = [
  "1 day",
  "2 days",
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "3 weeks",
  "4 weeks",
  "1 month",
  "2 months",
  "3 months",
  "6 months",
  "As directed",
];

const INSTRUCTION_OPTIONS = [
  "Take after meals",
  "Take before meals",
  "Take with food",
  "Take on empty stomach",
  "Do not chew, swallow whole",
  "Chewable",
  "Dissolve in water before use",
  "For external use only",
  "Shake well before use",
  "Keep in cool place",
  "Avoid driving after use",
  "Do not exceed recommended dose",
];

const AutocompleteCombobox = ({
  options,
  value,
  onChange,
  placeholder,
  getOptionLabel,
  getOptionValue,
  className = "",
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption =
    options.find((o) => getOptionValue(o) === value) || null;

  const displayValue = selectedOption
    ? getOptionLabel(selectedOption)
    : searchTerm;

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((o) =>
      getOptionLabel(o).toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm, getOptionLabel]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={16}
        />
        <input
          type="text"
          className="input-field pl-10 pr-10"
          placeholder={placeholder}
          value={displayValue}
          required={required && !value}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSearchTerm("");
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform"
          size={16}
          style={{
            transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)`,
          }}
        />
      </div>

      {isOpen && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              No matches found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const optionValue = getOptionValue(option);
              const optionLabel = getOptionLabel(option);
              const isSelected = optionValue === value;
              return (
                <div
                  key={optionValue}
                  onClick={() => {
                    onChange(optionValue);
                    setSearchTerm("");
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-primary/5 ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  {optionLabel}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder,
  allowCustom = true,
  className = "",
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isCustomValue = value && !options.includes(value);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        className="input-field flex items-center justify-between cursor-pointer bg-white min-h-[42px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`text-sm ${value ? "text-gray-900" : "text-gray-400"}`}
        >
          {value || placeholder}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setCustomValue("");
            }}
            className="text-gray-400 hover:text-gray-600 mr-1"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown
          className="text-gray-400 transition-transform flex-shrink-0"
          size={16}
          style={{ transform: `rotate(${isOpen ? 180 : 0}deg)` }}
        />
      </div>

      {required && !value && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
      )}

      {isOpen && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {allowCustom && (
            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
              <input
                type="text"
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Or type custom value..."
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customValue.trim()) {
                    onChange(customValue.trim());
                    setCustomValue("");
                    setIsOpen(false);
                  }
                }}
              />
            </div>
          )}
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
                setCustomValue("");
              }}
              className={`px-3 py-2 text-sm cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-primary/5 ${
                value === opt
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-gray-700"
              }`}
            >
              {opt}
            </div>
          ))}
          {allowCustom && isCustomValue && (
            <div
              onClick={() => {
                onChange(value);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-sm cursor-pointer bg-amber-50 border-b border-gray-50 text-amber-700 font-medium hover:bg-amber-100"
            >
              Use custom: "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Prescriptions = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [medications, setMedications] = useState([
    {
      name: "",
      dosage: "",
      dosageForm: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [diagnoses, setDiagnoses] = useState([{ name: "", critical: false }]);
  const [notes, setNotes] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { loading, error, data } = useQuery(GET_PRESCRIPTIONS);
  const { data: patientsData } = useQuery(GET_PATIENTS, {
    variables: { limit: 100 },
  });
  const { data: medicinesData } = useQuery(GET_MEDICINES, {
    variables: { limit: 100 },
  });

  const [createPrescription] = useMutation(CREATE_PRESCRIPTION, {
    refetchQueries: [{ query: GET_PRESCRIPTIONS }],
  });
  const [sendPrescriptionEmail] = useMutation(SEND_PRESCRIPTION_EMAIL);
  const [sendPrescriptionWhatsAppLink] = useMutation(
    SEND_PRESCRIPTION_WHATSAPP_LINK,
  );
  const [sendingEmailAfterCreate, setSendingEmailAfterCreate] = useState(false);

  if (loading) return <Preloader />;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const prescriptions = data?.getPrescriptions || [];
  const patients = patientsData?.getPatients?.patients || [];
  const medicines = medicinesData?.getMedicines?.medicines || [];

  const addDiagnosis = () => {
    setDiagnoses([...diagnoses, { name: "", critical: false }]);
  };

  const removeDiagnosis = (index) => {
    if (diagnoses.length > 1) {
      setDiagnoses(diagnoses.filter((_, i) => i !== index));
    }
  };

  const handleDiagnosisChange = (index, field, value) => {
    const newDiagnoses = [...diagnoses];
    newDiagnoses[index][field] = value;
    setDiagnoses(newDiagnoses);
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        name: "",
        dosage: "",
        dosageForm: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const removeMedication = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...medications];
    newMedications[index][field] = value;
    setMedications(newMedications);
  };

  const handleMedicationSelect = (index, medicineId) => {
    const medicine = medicines.find((m) => m.id === medicineId);
    if (medicine) {
      const newMedications = [...medications];
      newMedications[index].name = medicine.name;
      newMedications[index].dosage = medicine.dosageStrength || "";
      newMedications[index].dosageForm = medicine.dosageForm || "";
      setMedications(newMedications);
    } else if (!medicineId) {
      const newMedications = [...medications];
      newMedications[index].name = "";
      newMedications[index].dosage = "";
      newMedications[index].dosageForm = "";
      setMedications(newMedications);
    }
  };

  const filteredPrescriptions = prescriptions.filter((pres) => {
    const matchesSearch =
      pres.patientName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      pres.medications.some((med) =>
        med.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
      );
    const matchesStatus =
      filterStatus === "All" || pres.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const downloadPrescription = async (prescription, patientOverride = null) => {
    try {
      const patient = patientOverride || prescription?.patient || null;
      const result = await generatePrescriptionPDF(prescription, patient, {
        save: false,
      });
      result.pdf.save(result.filename);
      toast.success("Prescription downloaded successfully!");
      return result;
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
      return null;
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    try {
      const selectedPatient = patients.find((p) => p.id === selectedPatientId);
      if (!selectedPatient) {
        toast.error("Please select a patient");
        return;
      }

      const validDiagnoses = diagnoses.filter((d) => d.name.trim());
      if (validDiagnoses.length === 0) {
        toast.error("Please add at least one diagnosis");
        return;
      }

      const diagnosisText = validDiagnoses.map((d) => d.name).join(", ");

      const result = await createPrescription({
        variables: {
          patientId: selectedPatientId,
          patientName: selectedPatient.name,
          doctorId: user.id,
          doctorName: user.name,
          diagnosis: diagnosisText,
          diagnoses: validDiagnoses,
          medications: medications.map(
            ({
              name,
              dosage,
              dosageForm,
              frequency,
              duration,
              instructions,
            }) => ({
              name,
              dosage,
              dosageForm,
              frequency,
              duration,
              instructions,
            }),
          ),
          notes,
        },
      });

      const newPrescription = result.data.createPrescription;
      toast.success("Prescription created successfully!");
      setShowCreateForm(false);
      setMedications([
        {
          name: "",
          dosage: "",
          dosageForm: "",
          frequency: "",
          duration: "",
          instructions: "",
        },
      ]);
      setSelectedPatientId("");
      setDiagnoses([{ name: "", critical: false }]);
      setNotes("");

      const generatedPdf = await downloadPrescription(
        {
          ...newPrescription,
          patient: selectedPatient,
          diagnoses: validDiagnoses,
        },
        selectedPatient,
      );

      if (generatedPdf?.dataUriString) {
        try {
          const whatsappResult = await sendPrescriptionWhatsAppLink({
            variables: {
              prescriptionId: newPrescription.id,
              pdfDataUri: generatedPdf.dataUriString,
              fileName: generatedPdf.filename,
            },
          });
          const response = whatsappResult.data?.sendPrescriptionWhatsAppLink;
          if (response?.success) {
            toast.success("Prescription link sent to the patient's WhatsApp");
          } else if (!response?.skipped) {
            toast.error(
              response?.message || "Prescription link could not be sent",
            );
          }
        } catch (whatsappError) {
          console.error("Prescription WhatsApp error:", whatsappError);
          toast.error(
            "Prescription saved, but WhatsApp link could not be sent",
          );
        }
      }

      if (selectedPatient?.email) {
        setSendingEmailAfterCreate(true);
        try {
          let pdfDataUri = "";
          try {
            const pdfResult = await generatePrescriptionPDF(
              {
                ...newPrescription,
                patient: selectedPatient,
                diagnoses: validDiagnoses,
              },
              selectedPatient,
              { save: false },
            );
            pdfDataUri = pdfResult?.dataUriString || "";
          } catch (pdfErr) {
            console.warn("Could not attach PDF:", pdfErr);
          }
          const emailRes = await sendPrescriptionEmail({
            variables: {
              prescriptionId: newPrescription.id,
              patientName: selectedPatient.name,
              patientEmail: selectedPatient.email,
              patientId: selectedPatient.patientId,
              doctorName: user.name,
              date: newPrescription.date,
              diagnosis: diagnosisText,
              diagnoses: validDiagnoses,
              notes,
              medications: medications.map(
                ({
                  name,
                  dosage,
                  dosageForm,
                  frequency,
                  duration,
                  instructions,
                }) => ({
                  name,
                  dosage,
                  dosageForm,
                  frequency,
                  duration,
                  instructions,
                }),
              ),
              pdfDataUri,
            },
          });
          const resp = emailRes.data?.sendPrescriptionEmail;
          if (resp?.success) {
            toast.success(
              resp.message ||
                `Prescription emailed to ${selectedPatient.email}`,
            );
          } else {
            toast.error(
              resp?.message ||
                "Prescription saved, but email could not be sent.",
            );
          }
        } catch (emailErr) {
          console.error("Email error:", emailErr);
          toast.error(
            "Prescription saved. Email send failed: " +
              (emailErr?.message || "Unknown error"),
          );
        } finally {
          setSendingEmailAfterCreate(false);
        }
      } else {
        toast(
          (t) => (
            <span className="text-sm">
              ⚠ Patient has no registered email. Prescription saved & downloaded
              but email was skipped.
              <button
                onClick={() => toast.dismiss(t.id)}
                className="ml-3 text-primary font-medium underline"
              >
                OK
              </button>
            </span>
          ),
          { duration: 6000 },
        );
      }
    } catch (err) {
      toast.error("Failed to create prescription: " + err.message);
    }
  };

  return (
    <Suspense fallback={<Preloader />}>
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div {...fadeIn("down")} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                Prescriptions
              </h1>
              <p className="text-gray-600">
                View and manage medication prescriptions
              </p>
            </div>
            {user.role === "doctor" && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                New Prescription
              </button>
            )}
          </div>
        </motion.div>

        {showCreateForm && (
          <motion.div
            {...fadeIn("up", 0.1)}
            className="card mb-8 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary to-accent px-6 py-4 -mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6 rounded-t-lg">
              <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                <Pill size={22} />
                Create New Prescription
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Fill in patient details and medications to generate a
                professional Rx
              </p>
            </div>
            <form onSubmit={handleCreatePrescription} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name *{" "}
                  <span className="text-gray-400 font-normal">
                    (type to search)
                  </span>
                </label>
                <AutocompleteCombobox
                  options={patients}
                  value={selectedPatientId}
                  onChange={setSelectedPatientId}
                  placeholder="Search by patient name, phone, or ID..."
                  getOptionLabel={(p) =>
                    `${p.name}${p.phone ? ` (${p.phone})` : ""}${p.patientId ? ` - ${p.patientId}` : ""}`
                  }
                  getOptionValue={(p) => p.id}
                  required
                />
              </div>

              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      Diagnosis / Clinical Findings *
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {diagnoses.filter((d) => d.name.trim()).length} added
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addDiagnosis}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Diagnosis
                  </button>
                </div>

                <div className="space-y-3">
                  {diagnoses.map((diag, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`flex gap-3 items-start p-3 rounded-xl border transition-all ${
                        diag.critical
                          ? "bg-red-50/50 border-red-200"
                          : "bg-gray-50/50 border-gray-200"
                      }`}
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          className={`input-field bg-white ${
                            diag.critical
                              ? "border-red-300 focus:border-red-500 focus:ring-red-200 text-red-700 font-bold"
                              : ""
                          }`}
                          placeholder={`Diagnosis ${index + 1} (e.g., Acute Periapical Abscess)`}
                          value={diag.name}
                          onChange={(e) =>
                            handleDiagnosisChange(index, "name", e.target.value)
                          }
                          required={index === 0}
                        />
                      </div>
                      <label
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg cursor-pointer border transition-all select-none flex-shrink-0 ${
                          diag.critical
                            ? "bg-red-100 border-red-300 text-red-700"
                            : "bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-red-600 cursor-pointer"
                          checked={diag.critical}
                          onChange={(e) =>
                            handleDiagnosisChange(
                              index,
                              "critical",
                              e.target.checked,
                            )
                          }
                        />
                        <AlertTriangle
                          size={14}
                          className={diag.critical ? "text-red-600" : ""}
                        />
                        <span className="text-xs font-medium whitespace-nowrap">
                          Critical
                        </span>
                      </label>
                      {diagnoses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDiagnosis(index)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      Medication List & Doses
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {medications.length} medicine
                      {medications.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Another Medication
                  </button>
                </div>

                <div className="space-y-6">
                  {medications.map((med, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 relative shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-gray-800 text-sm">
                            Medicine {index + 1}
                          </h4>
                        </div>
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Medication Name *{" "}
                            <span className="text-gray-400 font-normal">
                              (type to search)
                            </span>
                          </label>
                          <AutocompleteCombobox
                            options={medicines}
                            value={
                              medicines.find((m) => m.name === med.name)?.id ||
                              ""
                            }
                            onChange={(val) =>
                              handleMedicationSelect(index, val)
                            }
                            placeholder="Search medicine from inventory..."
                            getOptionLabel={(m) =>
                              `${m.name}${m.dosageForm ? ` [${m.dosageForm}]` : ""}${m.dosageStrength ? ` - ${m.dosageStrength}` : ""}${m.category ? ` (${m.category})` : ""}`
                            }
                            getOptionValue={(m) => m.id}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dosage Form
                          </label>
                          <div className="input-field bg-gray-50/80 text-gray-600 flex items-center text-sm min-h-[42px]">
                            {med.dosageForm || (
                              <span className="text-gray-400 italic">
                                Auto-filled when medicine selected
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dose / Strength *
                          </label>
                          <CustomSelect
                            options={DOSAGE_OPTIONS}
                            value={med.dosage}
                            onChange={(val) =>
                              handleMedicationChange(index, "dosage", val)
                            }
                            placeholder="e.g., 500mg (or type custom)"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frequency *
                          </label>
                          <CustomSelect
                            options={FREQUENCY_OPTIONS}
                            value={med.frequency}
                            onChange={(val) =>
                              handleMedicationChange(index, "frequency", val)
                            }
                            placeholder="e.g., Thrice daily (or type custom)"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration *
                          </label>
                          <CustomSelect
                            options={DURATION_OPTIONS}
                            value={med.duration}
                            onChange={(val) =>
                              handleMedicationChange(index, "duration", val)
                            }
                            placeholder="e.g., 7 days (or type custom)"
                            required
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instructions *
                          </label>
                          <CustomSelect
                            options={INSTRUCTION_OPTIONS}
                            value={med.instructions}
                            onChange={(val) =>
                              handleMedicationChange(index, "instructions", val)
                            }
                            placeholder="e.g., Take after meals (or type custom)"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes / Advice for Patient
                </label>
                <textarea
                  className="input-field min-h-[90px]"
                  rows={3}
                  placeholder="e.g., Maintain good oral hygiene, avoid hard foods for 3 days, rinse with warm salt water..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 flex-wrap pt-2">
                <button
                  type="submit"
                  disabled={sendingEmailAfterCreate}
                  className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sendingEmailAfterCreate ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Sending Email to Patient...
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      Generate, Download & Email Prescription
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-outline"
                  disabled={sendingEmailAfterCreate}
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500 -mt-1">
                ✅ After generating, the prescription PDF is downloaded and
                automatically emailed to the patient's registered email address.
              </p>
            </form>
          </motion.div>
        )}

        <motion.div {...fadeIn("up", 0.2)} className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search prescriptions by patient or medicine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredPrescriptions.length > 0 ? (
            filteredPrescriptions.map((pres, index) => (
              <PrescriptionCard
                key={pres.id}
                prescription={pres}
                delay={index * 0.05}
              />
            ))
          ) : (
            <motion.div
              {...fadeIn("up")}
              className="col-span-2 card text-center py-12"
            >
              <Pill size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                No prescriptions found
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== "All"
                  ? "Try adjusting your search or filter"
                  : "No prescriptions available"}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Suspense>
  );
};

export default Prescriptions;
