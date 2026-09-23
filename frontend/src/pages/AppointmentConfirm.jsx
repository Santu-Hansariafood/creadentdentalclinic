import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Stethoscope,
  User,
  CheckCircle2,
  RefreshCw,
  Phone,
  MapPin,
  ChevronLeft,
  AlertTriangle,
  Loader2,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import SEO from "../components/SEO";
import api from "../api/axios";

const formatDateDisplay = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const AppointmentConfirm = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState(null);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [completed, setCompleted] = useState(null);
  const [initialActionHandled, setInitialActionHandled] = useState(false);

  const fetchAppointmentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/appointments/public/${token}`);
      if (response.data?.success) {
        setAppointment(response.data.data);
        if (response.data.data?.patientResponse) {
          setCompleted({
            type: response.data.data.patientResponse,
            at: response.data.data.patientResponseAt,
          });
        }
      } else {
        setError(response.data?.error || "Failed to load appointment details.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to load appointment details. Please check your internet connection and try again.";
      setError(msg);
      console.error("[APPT-CONFIRM] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting("confirm");
    try {
      const response = await api.post(
        `/api/appointments/public/${token}/confirm`,
      );
      if (response.data?.success) {
        setCompleted({
          type: "confirmed",
          at: response.data.data?.patientResponseAt,
        });
        setAppointment((prev) =>
          prev
            ? {
                ...prev,
                patientResponse: "confirmed",
                patientResponseAt: response.data.data?.patientResponseAt,
              }
            : prev,
        );
        toast.success(response.data.message || "Appointment confirmed!");
      } else {
        toast.error(response.data?.error || "Failed to confirm appointment.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to confirm appointment. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(null);
    }
  };

  const handleRescheduleSubmit = async () => {
    setSubmitting("reschedule");
    try {
      const response = await api.post(
        `/api/appointments/public/${token}/reschedule`,
        { reason: rescheduleReason.trim() },
      );
      if (response.data?.success) {
        setCompleted({
          type: "reschedule_requested",
          at: response.data.data?.patientResponseAt,
        });
        setAppointment((prev) =>
          prev
            ? {
                ...prev,
                patientResponse: "reschedule_requested",
                patientResponseAt: response.data.data?.patientResponseAt,
                rescheduleReason: response.data.data?.rescheduleReason || "",
              }
            : prev,
        );
        setShowRescheduleForm(false);
        toast.success(
          response.data.message || "Reschedule request submitted successfully.",
        );
      } else {
        toast.error(
          response.data?.error || "Failed to submit reschedule request.",
        );
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to submit reschedule request. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(null);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Invalid appointment link. The token is missing.");
      setLoading(false);
      return;
    }
    fetchAppointmentDetails();
  }, [token]);

  useEffect(() => {
    if (initialActionHandled) return;
    if (loading) return;
    if (!appointment) return;
    if (completed) return;

    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const reason = params.get("reason") || "";

    if (!action) {
      setInitialActionHandled(true);
      return;
    }

    const normalized = String(action).trim().toLowerCase();
    if (normalized === "confirm" || normalized === "confirmed") {
      setInitialActionHandled(true);
      const timer = setTimeout(() => {
        handleConfirm();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (
      normalized === "reschedule" ||
      normalized === "reschedule_requested" ||
      normalized === "request_reschedule"
    ) {
      setInitialActionHandled(true);
      setShowRescheduleForm(true);
      if (reason) setRescheduleReason(reason);
    }
  }, [loading, appointment, completed, initialActionHandled]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-primary animate-spin" />
          <p className="text-gray-600 font-medium">Loading appointment details…</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <SEO
          title="Appointment Not Found | Creadent Dental Clinic"
          description="The appointment you are looking for could not be found."
        />
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle size={40} className="text-amber-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-3">
              Appointment Not Found
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                <ChevronLeft size={18} />
                Back to Home
              </Link>
              <a
                href="tel:+916292300343"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary text-primary font-medium hover:bg-primary/5 transition-colors"
              >
                <Phone size={18} />
                Call Clinic
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isFormatDate = (d) => {
    if (!d) return "";
    const dateObj = new Date(d);
    if (Number.isNaN(dateObj.getTime())) return String(d);
    return formatDateDisplay(d);
  };

  const displayDate = appointment?.dateFormatted || isFormatDate(appointment?.date) || "";
  const displayDuration = appointment?.duration || 30;
  const displayReason = appointment?.reason || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <SEO
        title={`Confirm Appointment | ${appointment?.patientName || "Creadent Dental Clinic"}`}
        description={`Confirm or reschedule your dental appointment with ${appointment?.doctorName || "Creadent Dental Clinic"}.`}
      />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Creadent Dental Clinic
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-teal-500 px-6 py-8 sm:px-8 sm:py-10 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-3">
                  <Calendar size={12} />
                  Appointment Details
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">
                  Hi {(appointment?.patientName || "").split(" ")[0] || "there"},
                </h1>
                <p className="text-white/90 text-sm sm:text-base max-w-md">
                  Please review your appointment details below and let us know if you can make it or need to reschedule.
                </p>
              </div>
              <div className="hidden sm:block shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Stethoscope size={32} />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-5">
            {completed && (
              <div
                className={`rounded-xl border p-4 flex items-start gap-3 ${
                  completed.type === "confirmed"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div
                  className={`shrink-0 p-2 rounded-full ${
                    completed.type === "confirmed"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {completed.type === "confirmed" ? (
                    <Check size={20} />
                  ) : (
                    <RefreshCw size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-semibold ${
                      completed.type === "confirmed"
                        ? "text-emerald-800"
                        : "text-amber-800"
                    }`}
                  >
                    {completed.type === "confirmed"
                      ? "Appointment Confirmed!"
                      : "Reschedule Request Submitted"}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      completed.type === "confirmed"
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {completed.type === "confirmed"
                      ? "Thank you for confirming. We look forward to seeing you at the clinic."
                      : "Thank you. Our team will contact you shortly to arrange a new appointment time that works for you."}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1.5">
                  <Calendar size={14} />
                  Date
                </div>
                <p className="font-semibold text-gray-900">
                  {displayDate}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1.5">
                  <Clock size={14} />
                  Time
                </div>
                <p className="font-semibold text-gray-900">
                  {appointment?.time || ""}
                  <span className="text-gray-500 font-normal ml-2 text-sm">
                    • {displayDuration} min
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1.5">
                  <Stethoscope size={14} />
                  Doctor
                </div>
                <p className="font-semibold text-gray-900">
                  {appointment?.doctorName || ""}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1.5">
                  <User size={14} />
                  Appointment Type
                </div>
                <p className="font-semibold text-gray-900">
                  {appointment?.type || ""}
                </p>
              </div>
            </div>

            {displayReason && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1.5">
                  <MessageSquare size={14} />
                  Reason for visit
                </div>
                <p className="text-gray-800">{displayReason}</p>
              </div>
            )}

            <div className="rounded-xl bg-teal-50 border border-teal-100 p-4">
              <h3 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
                <MapPin size={16} />
                Clinic Address
              </h3>
              <p className="text-sm text-teal-800 leading-relaxed">
                Creadent Multispeciality Dental Clinic
                <br />
                BD-85, Salt Lake Rd, BD Block, Sector 1,
                <br />
                Bidhannagar, Kolkata, West Bengal 700064
              </p>
            </div>

            {!completed && !showRescheduleForm && (
              <div className="pt-2 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleConfirm}
                    disabled={submitting !== null}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-emerald-600/20"
                  >
                    {submitting === "confirm" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    {submitting === "confirm" ? "Confirming…" : "Confirm Appointment"}
                  </button>

                  <button
                    onClick={() => setShowRescheduleForm(true)}
                    disabled={submitting !== null}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-amber-500/20"
                  >
                    <RefreshCw size={18} />
                    Request Reschedule
                  </button>
                </div>
                <p className="text-xs text-center text-gray-500 pt-1">
                  Please confirm your attendance so we can prepare for your visit.
                </p>
              </div>
            )}

            {!completed && showRescheduleForm && (
              <div className="pt-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 mb-4">
                  <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <RefreshCw size={18} />
                    Request Appointment Reschedule
                  </h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for rescheduling (optional)
                  </label>
                  <textarea
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Please let us know why you need to reschedule, or any preferred new dates/times…"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none resize-none transition-colors"
                  />
                  <div className="mt-2 flex justify-end">
                    <span className="text-xs text-gray-500">
                      {rescheduleReason.length}/500
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowRescheduleForm(false);
                      setRescheduleReason("");
                    }}
                    disabled={submitting !== null}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleRescheduleSubmit}
                    disabled={submitting !== null}
                    className="flex-[2] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-amber-500/20"
                  >
                    {submitting === "reschedule" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <RefreshCw size={18} />
                    )}
                    {submitting === "reschedule"
                      ? "Submitting…"
                      : "Submit Reschedule Request"}
                  </button>
                </div>
              </div>
            )}

            {completed && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="tel:+916292300343"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary text-primary font-medium hover:bg-primary/5 transition-colors"
                  >
                    <Phone size={16} />
                    Call Clinic (+91 62923 00343)
                  </a>
                  <Link
                    to="/"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
                  >
                    Visit Creadent Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Need help? Call us at{" "}
            <a
              href="tel:+916292300343"
              className="text-primary font-medium hover:underline"
            >
              +91 62923 00343
            </a>{" "}
            or email{" "}
            <a
              href="mailto:info@creadentdentalclinic.com"
              className="text-primary font-medium hover:underline"
            >
              info@creadentdentalclinic.com
            </a>
          </p>
          <p className="mt-2 opacity-75">
            © {new Date().getFullYear()} Creadent Multispeciality Dental Clinic. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirm;
