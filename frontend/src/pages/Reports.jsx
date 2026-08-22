import { Suspense, useState, useEffect, useMemo, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  IdCard,
  MapPin,
  Droplets,
  Shield,
  Stethoscope,
  Pill,
  CreditCard,
  IndianRupee,
  ChevronRight,
  ClipboardList,
  FileOutput,
  DollarSign,
  HeartPulse,
  Activity,
  Eye,
  Download,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  XCircle,
  Paperclip,
  ChevronLeft,
  List,
  FileSearch,
} from "lucide-react";
import { fadeIn } from "../utils/motion";
import { useQuery } from "@apollo/client";
import {
  GET_PATIENTS,
  GET_PATIENT,
  GET_MEDICAL_RECORDS,
  GET_PRESCRIPTIONS,
  GET_INVOICES,
  GET_APPOINTMENTS,
} from "../graphql/queries";
import Preloader from "../components/Preloader";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";

const FILE_API_ORIGIN = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL, window.location.origin).origin
  : window.location.hostname === "creadentsmiles.com" ||
      window.location.hostname === "www.creadentsmiles.com"
    ? "https://api.creadentsmiles.com"
    : "";

const resolveFileUrl = (url) => {
  if (!url || !FILE_API_ORIGIN || !String(url).startsWith("/files/"))
    return url;
  return `${FILE_API_ORIGIN}${url}`;
};

const fileTypeIcon = (type, name) => {
  const n = (name || "").toLowerCase();
  const t = (type || "").toLowerCase();
  if (
    t.startsWith("image") ||
    /\.(avif|bmp|gif|heic|heif|ico|jpe?g|jp2|jpf|jpm|jpx|png|svg|tif?f|webp)$/.test(
      n,
    )
  )
    return "🖼️";
  if (t.includes("pdf") || n.endsWith(".pdf")) return "📕";
  if (t.includes("word") || /\.(docx?|rtf)$/.test(n)) return "📘";
  if (t.includes("sheet") || /\.(xlsx?|csv|ods)$/.test(n)) return "📗";
  if (/\.(zip|rar|7z|tar|gz)$/.test(n)) return "🗜️";
  return "📄";
};

const formatSize = (bytes) => {
  if (!bytes) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

const calculateAge = (dob) => {
  if (!dob) return null;
  try {
    const d = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  } catch {
    return null;
  }
};

const SectionCard = ({ icon, title, children, accent = "primary" }) => {
  const Icon = icon;
  return (
    <motion.div
      {...fadeIn("up", 0.05)}
      className="card border-t-4"
      style={{
        borderTopColor:
          accent === "success"
            ? "#10b981"
            : accent === "warning"
              ? "#f59e0b"
              : accent === "error"
                ? "#ef4444"
                : "#007FAF",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            accent === "success"
              ? "bg-success/10 text-success"
              : accent === "warning"
                ? "bg-warning/10 text-warning"
                : accent === "error"
                  ? "bg-error/10 text-error"
                  : "bg-primary/10 text-primary"
          }`}
        >
          <Icon size={20} />
        </div>
        <h3 className="font-heading font-semibold text-gray-900 text-lg">
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
};

const EmptyState = ({ icon, message, hint }) => {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Icon size={24} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-600">{message}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
};

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const limit = 1000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { loading: patientsLoading, data: patientsData } = useQuery(
    GET_PATIENTS,
    {
      variables: { page: 1, limit, search: debouncedSearch },
    },
  );

  const { data: patientDetailData } = useQuery(GET_PATIENT, {
    variables: { id: selectedPatient?.id },
    skip: !selectedPatient?.id,
  });

  const { data: medicalRecordsData } = useQuery(GET_MEDICAL_RECORDS, {
    variables: { patientId: selectedPatient?.id },
    skip: !selectedPatient?.id,
    fetchPolicy: "network-only",
  });

  const { data: prescriptionsData } = useQuery(GET_PRESCRIPTIONS, {
    variables: { patientId: selectedPatient?.id },
    skip: !selectedPatient?.id,
  });

  const { data: invoicesData } = useQuery(GET_INVOICES, {
    variables: { patientId: selectedPatient?.id },
    skip: !selectedPatient?.id,
  });

  const { data: appointmentsData } = useQuery(GET_APPOINTMENTS, {
    variables: { patientId: selectedPatient?.id, limit: 50 },
    skip: !selectedPatient?.id,
  });

  const patient = patientDetailData?.getPatient || selectedPatient;
  const medicalRecords = medicalRecordsData?.getMedicalRecords || [];
  const prescriptions = prescriptionsData?.getPrescriptions || [];
  const invoices = invoicesData?.getInvoices || [];
  const appointments = appointmentsData?.getAppointments?.appointments || [];
  const patients = patientsData?.getPatients?.patients || [];
  const totalCount = patientsData?.getPatients?.totalCount || 0;

  const derived = useMemo(() => {
    const todayISO = new Date().toISOString().split("T")[0];

    const pastRecords = medicalRecords.filter((r) => r.date <= todayISO);
    const lastVisitRecord = pastRecords[0];
    const lastVisitDate = lastVisitRecord?.date;

    const allAttachments = medicalRecords.flatMap((r) =>
      (r.attachments || []).map((a) => ({
        ...a,
        recordId: r.id,
        recordDate: r.date,
        recordTitle: r.visitType || r.diagnosis || "Record",
      })),
    );

    const nextVisitFromFollowUp = medicalRecords
      .filter(
        (r) => r.followUpDate && new Date(r.followUpDate) >= new Date(todayISO),
      )
      .sort(
        (a, b) => new Date(a.followUpDate) - new Date(b.followUpDate),
      )[0]?.followUpDate;

    const upcomingAppointments = appointments
      .filter((a) => a.date >= todayISO && a.status !== "Cancelled")
      .sort((a, b) => {
        const da = new Date(`${a.date}T${a.time || "00:00"}`);
        const db = new Date(`${b.date}T${b.time || "00:00"}`);
        return da - db;
      });
    const nextAppointment = upcomingAppointments[0];
    const nextVisitDate = nextVisitFromFollowUp || nextAppointment?.date;
    const nextVisitLabel = nextVisitFromFollowUp
      ? "Follow-up scheduled"
      : nextAppointment
        ? `${nextAppointment.type} · Dr. ${nextAppointment.doctorName}`
        : null;

    const lastInvoice = invoices[0];
    const totalBilled = invoices.reduce((s, i) => s + (i.total || 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.amountPaid || 0), 0);
    const totalBalance = invoices.reduce((s, i) => s + (i.balance || 0), 0);

    const suggestions = medicalRecords
      .map((r) => ({
        date: r.date,
        text: r.notes,
        doctor: r.doctorName,
      }))
      .filter((s) => s.text && s.text.trim().length > 0);

    const prescriptionNotes = prescriptions
      .map((p) => ({
        date: p.date,
        text: p.notes,
        doctor: p.doctorName,
      }))
      .filter((s) => s.text && s.text.trim().length > 0);

    const allSuggestions = [...suggestions, ...prescriptionNotes].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    return {
      lastVisitDate,
      lastVisitRecord,
      allAttachments,
      nextVisitDate,
      nextVisitLabel,
      nextAppointment,
      lastInvoice,
      totalBilled,
      totalPaid,
      totalBalance,
      allSuggestions,
      upcomingAppointments,
    };
  }, [medicalRecords, prescriptions, invoices, appointments]);

  const loading = patientsLoading && !patientsData;

  if (loading) return <Preloader />;

  return (
    <Suspense fallback={<Preloader />}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <PageHeader
          title="Reports"
          subtitle={
            <>
              Patient reports & complete clinical history.
              {totalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  <Users size={12} />
                  {totalCount} total {totalCount === 1 ? "patient" : "patients"}
                  {debouncedSearch && <> • matching "{debouncedSearch}"</>}
                </span>
              )}
            </>
          }
        />

        <motion.div {...fadeIn("up", 0.03)} className="mb-6">
          <div className="card p-4 sm:p-5">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Find Patient
              </label>
              <div className="relative">
                <FileSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
                  size={20}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by name, phone, or patient ID…"
                  className="input-field pl-11 !py-3 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setDebouncedSearch("");
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {isDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                  {patientsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : patients.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      {debouncedSearch
                        ? `No patients match "${debouncedSearch}"`
                        : "No patients registered"}
                    </div>
                  ) : (
                    <>
                      {patients.map((p, idx) => (
                        <div
                          key={p.id}
                          className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-colors ${
                            selectedPatient?.id === p.id ? "bg-primary/10" : ""
                          }`}
                          onClick={() => {
                            setSelectedPatient(p);
                            setSelectedAttachment(null);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <User size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">
                              {p.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{p.patientId || ""}</span>
                              {p.phone && <span>• {p.phone}</span>}
                              {p.gender && <span>• {p.gender}</span>}
                              {p.dateOfBirth && (
                                <span>• {calculateAge(p.dateOfBirth)} yrs</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-gray-300 flex-shrink-0"
                          />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {selectedPatient.name}
                    </p>
                    {selectedPatient.patientId && (
                      <p className="text-xs text-primary font-mono">
                        {selectedPatient.patientId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="hidden sm:block text-xs text-gray-500">
                  {selectedPatient.phone}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSelectedAttachment(null);
                  }}
                  className="sm:ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X size={12} />
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="w-full">
          {!patient ? (
            <motion.div
              {...fadeIn("up", 0.1)}
              className="card text-center py-12 lg:py-20"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <ClipboardList size={36} className="text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                Select a Patient
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Use the search bar above to find a patient, then click a patient
                from the dropdown to view their complete clinical report
                including visit history, prescriptions, attachments, payment
                details, and upcoming appointments.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <motion.div
                {...fadeIn("up", 0.05)}
                className="card bg-gradient-to-br from-primary/5 via-white to-white overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <User size={30} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="font-heading text-xl sm:text-2xl font-bold text-gray-900 truncate">
                          {patient.name}
                        </h2>
                        <span
                          className={`badge ${
                            patient.status === "Active"
                              ? "badge-success"
                              : "badge-error"
                          }`}
                        >
                          {patient.status || "—"}
                        </span>
                      </div>
                      {patient.patientId && (
                        <div className="flex items-center gap-1.5 text-primary text-sm mb-3">
                          <IdCard size={14} />
                          <span className="font-mono font-semibold">
                            {patient.patientId}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <span>{patient.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <span className="truncate">
                            {patient.email || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <span>
                            {patient.dateOfBirth
                              ? `${formatDate(patient.dateOfBirth)} (${
                                  calculateAge(patient.dateOfBirth) || "—"
                                } yrs)`
                              : patient.age
                                ? `${patient.age} yrs`
                                : "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <span>{patient.gender || "—"}</span>
                        </div>
                        {patient.bloodGroup && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Droplets
                              size={14}
                              className="text-error flex-shrink-0"
                            />
                            <span className="font-medium">
                              {patient.bloodGroup}
                            </span>
                          </div>
                        )}
                        {patient.address && (
                          <div className="flex items-start gap-2 text-gray-600 sm:col-span-2">
                            <MapPin
                              size={14}
                              className="text-gray-400 flex-shrink-0 mt-0.5"
                            />
                            <span className="line-clamp-1">
                              {patient.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:w-64 md:border-l md:border-gray-100 md:pl-5">
                    <div className="p-3 rounded-xl bg-white border border-gray-100">
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1">
                        <Clock size={11} /> Last Visit
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(derived.lastVisitDate) || "No records yet"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-gray-100">
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1">
                        <ArrowRight size={11} /> Next Visit
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(derived.nextVisitDate) || "None scheduled"}
                      </p>
                      {derived.nextVisitLabel && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                          {derived.nextVisitLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional info blocks (vitals, allergies, etc.) */}
                {(patient.vitalSigns ||
                  patient.medicalHistory?.allergies?.length > 0 ||
                  patient.emergencyContact ||
                  patient.insurance) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                    {patient.vitalSigns &&
                      (patient.vitalSigns.bloodPressure ||
                        patient.vitalSigns.height ||
                        patient.vitalSigns.weight) && (
                        <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-success/80 mb-2">
                            <HeartPulse size={12} /> Baseline Vitals
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-gray-500">BP</p>
                              <p className="font-semibold text-gray-900">
                                {patient.vitalSigns.bloodPressure || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Height</p>
                              <p className="font-semibold text-gray-900">
                                {patient.vitalSigns.height || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Weight</p>
                              <p className="font-semibold text-gray-900">
                                {patient.vitalSigns.weight || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {patient.medicalHistory?.allergies?.length > 0 && (
                      <div className="p-3 rounded-lg bg-error/5 border border-error/20">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-error/80 mb-2">
                          <AlertCircle size={12} /> Known Allergies
                        </div>
                        <p className="text-xs text-gray-800">
                          {patient.medicalHistory.allergies.join(", ")}
                        </p>
                      </div>
                    )}

                    {patient.emergencyContact?.name && (
                      <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-warning/80 mb-2">
                          <Shield size={12} /> Emergency Contact
                        </div>
                        <p className="text-xs font-semibold text-gray-900">
                          {patient.emergencyContact.name}
                          {patient.emergencyContact.relationship && (
                            <span className="text-gray-500 font-normal">
                              {" "}
                              ({patient.emergencyContact.relationship})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-700 mt-0.5">
                          {patient.emergencyContact.phone}
                        </p>
                      </div>
                    )}

                    {patient.insurance?.provider && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 md:col-span-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary/80 mb-2">
                          <Shield size={12} /> Insurance
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-gray-500">Provider</p>
                            <p className="font-semibold text-gray-900">
                              {patient.insurance.provider}
                            </p>
                          </div>
                          {patient.insurance.policyNumber && (
                            <div>
                              <p className="text-gray-500">Policy #</p>
                              <p className="font-semibold text-gray-900 font-mono">
                                {patient.insurance.policyNumber}
                              </p>
                            </div>
                          )}
                          {patient.insurance.expiryDate && (
                            <div>
                              <p className="text-gray-500">Valid Until</p>
                              <p className="font-semibold text-gray-900">
                                {formatDate(patient.insurance.expiryDate)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(patient.medicalHistory?.chronicConditions?.length > 0 ||
                  patient.medicalHistory?.previousSurgeries?.length > 0 ||
                  patient.dentalHistory?.previousTreatments?.length > 0 ||
                  patient.dentalHistory?.currentIssues?.length > 0) && (
                  <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {patient.medicalHistory?.chronicConditions?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                          Chronic Conditions
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {patient.medicalHistory.chronicConditions.map(
                            (c, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded-md bg-amber-50 text-amber-800 border border-amber-100"
                              >
                                {c}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                    {patient.medicalHistory?.previousSurgeries?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                          Previous Surgeries
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {patient.medicalHistory.previousSurgeries.map(
                            (s, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded-md bg-purple-50 text-purple-800 border border-purple-100"
                              >
                                {s}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                    {patient.dentalHistory?.previousTreatments?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                          Previous Dental Treatments
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {patient.dentalHistory.previousTreatments.map(
                            (t, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded-md bg-teal-50 text-teal-800 border border-teal-100"
                              >
                                {t}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                    {patient.dentalHistory?.currentIssues?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                          Current Dental Issues
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {patient.dentalHistory.currentIssues.map((t, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded-md bg-error/5 text-error border border-error/10"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SectionCard
                  icon={Activity}
                  title="Visit History"
                  accent="primary"
                >
                  {medicalRecords.length === 0 ? (
                    <EmptyState
                      icon={Stethoscope}
                      message="No visit records yet"
                      hint="Create a medical record after the patient's visit"
                    />
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 -mr-1">
                      {medicalRecords.map((r, i) => (
                        <div
                          key={r.id}
                          className={`p-3 rounded-xl border ${
                            i === 0
                              ? "border-primary/30 bg-primary/5"
                              : "border-gray-100 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900">
                                  {r.visitType || "Consultation"}
                                </span>
                                {i === 0 && (
                                  <span className="badge badge-primary text-[10px]">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                                <Calendar size={10} />
                                {formatDate(r.date)}
                                <span className="text-gray-300">·</span>
                                <Stethoscope size={10} />
                                Dr. {r.doctorName}
                              </p>
                            </div>
                            {r.attachments?.length > 0 && (
                              <span className="text-[11px] text-primary bg-primary/5 rounded-full px-2 py-0.5 flex items-center gap-1 border border-primary/20">
                                <Paperclip size={10} />
                                {r.attachments.length}
                              </span>
                            )}
                          </div>
                          {r.diagnosis && (
                            <div className="text-xs mb-1.5">
                              <span className="text-gray-500 font-medium">
                                Diagnosis:{" "}
                              </span>
                              <span className="text-gray-800">
                                {r.diagnosis}
                              </span>
                            </div>
                          )}
                          {r.treatment && (
                            <div className="text-xs mb-1.5">
                              <span className="text-gray-500 font-medium">
                                Treatment:{" "}
                              </span>
                              <span className="text-gray-800">
                                {r.treatment}
                              </span>
                            </div>
                          )}
                          {r.vitalSigns &&
                            (r.vitalSigns.bloodPressure ||
                              r.vitalSigns.height ||
                              r.vitalSigns.weight ||
                              r.vitalSigns.heartRate) && (
                              <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
                                {r.vitalSigns.bloodPressure && (
                                  <span>BP: {r.vitalSigns.bloodPressure}</span>
                                )}
                                {r.vitalSigns.heartRate && (
                                  <span>HR: {r.vitalSigns.heartRate} bpm</span>
                                )}
                                {r.vitalSigns.height && (
                                  <span>Ht: {r.vitalSigns.height}</span>
                                )}
                                {r.vitalSigns.weight && (
                                  <span>Wt: {r.vitalSigns.weight}</span>
                                )}
                              </div>
                            )}
                          {r.followUpDate && (
                            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-success font-medium">
                              <ArrowRight size={11} />
                              Follow-up: {formatDate(r.followUpDate)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  icon={FileOutput}
                  title="Uploaded Reports & Attachments"
                  accent="warning"
                >
                  {derived.allAttachments.length === 0 ? (
                    <EmptyState
                      icon={FileOutput}
                      message="No reports or attachments uploaded"
                      hint="Attach X‑rays, scans, lab reports to medical records"
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 -mr-1">
                      {derived.allAttachments.map((att, i) => (
                        <div
                          key={`${att.storageKey}-${i}`}
                          className="p-3 rounded-xl border border-gray-100 bg-white hover:border-primary/30 transition-colors cursor-pointer group"
                          onClick={() => setSelectedAttachment(att)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl flex-shrink-0">
                              {fileTypeIcon(
                                att.type,
                                att.originalName || att.name,
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors"
                                title={att.originalName || att.name}
                              >
                                {att.originalName || att.name || "Document"}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                                <Calendar size={10} />
                                {formatDate(att.recordDate)}
                                <span className="text-gray-300">·</span>
                                {formatSize(att.size)}
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1 truncate">
                                {att.recordTitle}
                              </p>
                            </div>
                            <Eye
                              size={14}
                              className="text-gray-300 group-hover:text-primary flex-shrink-0 mt-0.5"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SectionCard icon={Pill} title="Prescriptions" accent="success">
                  {prescriptions.length === 0 ? (
                    <EmptyState
                      icon={Pill}
                      message="No prescriptions issued yet"
                      hint="Create a prescription from the patient's visit"
                    />
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 -mr-1">
                      {prescriptions.map((rx, i) => (
                        <div
                          key={rx.id}
                          className={`p-3 rounded-xl border ${
                            i === 0
                              ? "border-success/30 bg-success/5"
                              : "border-gray-100 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-gray-900">
                                  {rx.diagnoses?.length > 0
                                    ? rx.diagnoses.map((d) => d.name).join(", ")
                                    : rx.diagnosis || "Prescription"}
                                </p>
                                {i === 0 && (
                                  <span className="badge badge-success text-[10px]">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                                <Calendar size={10} />
                                {formatDate(rx.date)}
                                <span className="text-gray-300">·</span>
                                <Stethoscope size={10} />
                                Dr. {rx.doctorName}
                              </p>
                            </div>
                            <span className="badge badge-info text-[10px]">
                              {(rx.medications || []).length} med
                            </span>
                          </div>
                          {(rx.medications || []).length > 0 && (
                            <div className="space-y-1.5 mt-2 pt-2 border-t border-gray-100">
                              {rx.medications.map((med, j) => (
                                <div
                                  key={j}
                                  className="flex items-start gap-2 text-xs"
                                >
                                  <div className="w-1 h-1 rounded-full bg-success mt-1.5 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {med.name}
                                      {med.dosage && (
                                        <span className="text-gray-600 font-normal">
                                          {" "}
                                          — {med.dosage}
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-gray-500 mt-0.5">
                                      {[
                                        med.frequency,
                                        med.duration,
                                        med.instructions,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  icon={ClipboardList}
                  title="Suggestions & Clinical Notes"
                  accent="warning"
                >
                  {derived.allSuggestions.length === 0 ? (
                    <EmptyState
                      icon={ClipboardList}
                      message="No clinical suggestions or notes yet"
                      hint="Notes added to records and prescriptions appear here"
                    />
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 -mr-1">
                      {derived.allSuggestions.map((s, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl border border-gray-100 bg-white"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                              <Calendar size={10} />
                              {formatDate(s.date)}
                              <span className="text-gray-300">·</span>
                              <Stethoscope size={10} />
                              Dr. {s.doctor}
                            </p>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {s.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>

              <SectionCard
                icon={CreditCard}
                title="Billing & Payments"
                accent="primary"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1">
                      Total Billed
                    </p>
                    <p className="text-lg font-heading font-bold text-gray-900 flex items-center gap-1">
                      <IndianRupee size={16} className="text-gray-500" />
                      {derived.totalBilled.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-success/5 border border-success/20">
                    <p className="text-[11px] text-success/80 uppercase tracking-wide font-semibold mb-1">
                      Total Paid
                    </p>
                    <p className="text-lg font-heading font-bold text-success flex items-center gap-1">
                      <IndianRupee size={16} />
                      {derived.totalPaid.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
                    <p className="text-[11px] text-warning/80 uppercase tracking-wide font-semibold mb-1">
                      Balance Due
                    </p>
                    <p className="text-lg font-heading font-bold text-warning flex items-center gap-1">
                      <IndianRupee size={16} />
                      {derived.totalBalance.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-[11px] text-primary/80 uppercase tracking-wide font-semibold mb-1">
                      Total Invoices
                    </p>
                    <p className="text-lg font-heading font-bold text-primary">
                      {invoices.length}
                    </p>
                  </div>
                </div>

                {invoices.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    message="No invoices generated yet"
                    hint="Create an invoice from the billing module"
                  />
                ) : (
                  <div className="overflow-x-auto -mx-2">
                    <table className="text-sm min-w-full">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="!py-2.5 !px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                            Invoice
                          </th>
                          <th className="!py-2.5 !px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                            Date
                          </th>
                          <th className="!py-2.5 !px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap text-right">
                            Total
                          </th>
                          <th className="!py-2.5 !px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap text-right">
                            Paid
                          </th>
                          <th className="!py-2.5 !px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap text-right">
                            Balance
                          </th>
                          <th className="!py-2.5 !px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                            Status
                          </th>
                          <th className="!py-2.5 !px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                            Payment
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr
                            key={inv.id}
                            className="hover:bg-gray-50/50 align-middle"
                          >
                            <td className="!py-2.5 !px-3">
                              <div>
                                <p className="font-mono text-xs font-semibold text-gray-900">
                                  {inv.invoiceNumber}
                                </p>
                                {inv.notes && (
                                  <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                                    {inv.notes}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="!py-2.5 !px-3 text-xs text-gray-600 whitespace-nowrap">
                              {formatDate(inv.date)}
                            </td>
                            <td className="!py-2.5 !px-3 text-xs font-semibold text-gray-900 whitespace-nowrap text-right flex items-center justify-end gap-0.5">
                              <IndianRupee size={11} />
                              {(inv.total || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="!py-2.5 !px-3 text-xs font-semibold text-success whitespace-nowrap text-right flex items-center justify-end gap-0.5">
                              <IndianRupee size={11} />
                              {(inv.amountPaid || 0).toLocaleString("en-IN")}
                            </td>
                            <td
                              className={`!py-2.5 !px-3 text-xs font-semibold whitespace-nowrap text-right flex items-center justify-end gap-0.5 ${
                                (inv.balance || 0) > 0
                                  ? "text-warning"
                                  : "text-success"
                              }`}
                            >
                              <IndianRupee size={11} />
                              {(inv.balance || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="!py-2.5 !px-3 whitespace-nowrap">
                              <span
                                className={`badge ${
                                  inv.status === "Paid"
                                    ? "badge-success"
                                    : inv.status === "Partial"
                                      ? "badge-warning"
                                      : "badge-error"
                                }`}
                              >
                                {inv.status || "Unpaid"}
                              </span>
                            </td>
                            <td className="!py-2.5 !px-3 whitespace-nowrap">
                              {inv.paymentDate ? (
                                <div>
                                  <p className="text-xs text-gray-900 font-medium">
                                    {inv.paymentMethod || "—"}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    {formatDate(inv.paymentDate)}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[11px] text-gray-400 italic">
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>

              {derived.upcomingAppointments.length > 0 && (
                <SectionCard
                  icon={Calendar}
                  title="Upcoming Appointments"
                  accent="success"
                >
                  <div className="space-y-2">
                    {derived.upcomingAppointments.slice(0, 5).map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100"
                      >
                        <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-semibold uppercase leading-none">
                            {new Date(apt.date).toLocaleString("en-IN", {
                              month: "short",
                            })}
                          </span>
                          <span className="text-base font-bold leading-tight">
                            {new Date(apt.date).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {apt.type}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Clock size={11} />
                            {apt.time || "—"}
                            <span className="text-gray-300">·</span>
                            <Stethoscope size={11} />
                            Dr. {apt.doctorName}
                          </p>
                          {apt.reason && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {apt.reason}
                            </p>
                          )}
                        </div>
                        <span
                          className={`badge ${
                            apt.status === "Scheduled"
                              ? "badge-primary"
                              : apt.status === "Completed"
                                ? "badge-success"
                                : apt.status === "Cancelled"
                                  ? "badge-error"
                                  : "badge-warning"
                          }`}
                        >
                          {apt.status || "Scheduled"}
                        </span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          )}
        </div>

        {/* Attachment preview modal (unchanged) */}
        {selectedAttachment &&
          (resolveFileUrl(selectedAttachment.url) ||
            selectedAttachment.storageKey) && (
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedAttachment(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {selectedAttachment.originalName ||
                        selectedAttachment.name ||
                        "Document"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <Calendar size={11} />
                      {formatDate(selectedAttachment.recordDate)} —{" "}
                      {selectedAttachment.recordTitle}
                      <span className="text-gray-300">·</span>
                      {formatSize(selectedAttachment.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(resolveFileUrl(selectedAttachment.url) ||
                      (selectedAttachment.storageKey &&
                        resolveFileUrl(
                          `/files/${encodeURIComponent(selectedAttachment.storageKey)}`,
                        ))) && (
                      <a
                        href={
                          resolveFileUrl(selectedAttachment.url) ||
                          resolveFileUrl(
                            `/files/${encodeURIComponent(selectedAttachment.storageKey)}`,
                          )
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                        download
                      >
                        <Download size={14} /> Download
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedAttachment(null)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
                  {/\.(avif|bmp|gif|heic|heif|ico|jpe?g|jp2|jpf|jpm|jpx|png|svg|tif?f|webp)$/i.test(
                    selectedAttachment.originalName ||
                      selectedAttachment.name ||
                      "",
                  ) || (selectedAttachment.type || "").startsWith("image") ? (
                    <img
                      src={
                        resolveFileUrl(selectedAttachment.url) ||
                        resolveFileUrl(
                          `/files/${encodeURIComponent(selectedAttachment.storageKey)}`,
                        )
                      }
                      alt={selectedAttachment.name || "Image"}
                      className="max-w-full max-h-full object-contain p-4"
                    />
                  ) : /\.pdf$/i.test(
                      selectedAttachment.originalName ||
                        selectedAttachment.name ||
                        "",
                    ) || (selectedAttachment.type || "").includes("pdf") ? (
                    <iframe
                      src={
                        resolveFileUrl(selectedAttachment.url) ||
                        resolveFileUrl(
                          `/files/${encodeURIComponent(selectedAttachment.storageKey)}`,
                        )
                      }
                      title={selectedAttachment.name || "PDF Preview"}
                      className="w-full h-[calc(90vh-80px)] bg-white"
                    />
                  ) : (
                    <div className="p-10 text-center">
                      <div className="text-6xl mb-4">
                        {fileTypeIcon(
                          selectedAttachment.type,
                          selectedAttachment.originalName ||
                            selectedAttachment.name,
                        )}
                      </div>
                      <p className="text-gray-600 mb-4">
                        Preview not available for this file type
                      </p>
                      {(resolveFileUrl(selectedAttachment.url) ||
                        (selectedAttachment.storageKey &&
                          resolveFileUrl(
                            `/files/${encodeURIComponent(selectedAttachment.storageKey)}`,
                          ))) && (
                        <a
                          href={
                            resolveFileUrl(selectedAttachment.url) ||
                            resolveFileUrl(
                              `/files/${encodeURIComponent(selectedAttachment.storageKey)}`,
                            )
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary inline-flex items-center gap-2"
                          download
                        >
                          <Download size={16} /> Download File
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </Suspense>
  );
};

export default Reports;
