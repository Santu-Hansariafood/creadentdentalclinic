import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { lazy } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fadeIn, staggerContainer } from "../utils/motion";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_APPOINTMENTS,
  GET_USERS_BY_ROLE,
  GET_PATIENTS,
} from "../graphql/queries";
import { CREATE_APPOINTMENT, UPDATE_APPOINTMENT } from "../graphql/mutations";
import Preloader from "../components/Preloader";
import Pagination from "../components/Pagination";
const AppointmentCard = lazy(() => import("../components/AppointmentCard"));

import {
  isAppointmentPast,
  isAppointmentToday,
  isAppointmentUpcoming,
} from "../utils/dateUtils";

const appointmentSlots = [
  { time: "09:00 AM", available: true },
  { time: "09:30 AM", available: true },
  { time: "10:00 AM", available: true },
  { time: "10:30 AM", available: true },
  { time: "11:00 AM", available: true },
  { time: "11:30 AM", available: true },
  { time: "02:00 PM", available: true },
  { time: "02:30 PM", available: true },
  { time: "03:00 PM", available: true },
  { time: "03:30 PM", available: true },
  { time: "04:00 PM", available: true },
  { time: "04:30 PM", available: true },
  { time: "05:00 PM", available: true },
  { time: "05:30 PM", available: true },
  { time: "06:00 PM", available: true },
  { time: "6:30 PM", available: true },
  { time: "7:00 PM", available: true },
];

const GROUP_TABS = [
  { value: "all", label: "All Appointments" },
  { value: "upcoming", label: "Upcoming (Today + Future)" },
  { value: "previous", label: "Previous (Done / Not Done)" },
];

const Appointments = () => {
  const { user } = useAuth();
  const [showBooking, setShowBooking] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [groupTab, setGroupTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [bookingData, setBookingData] = useState({
    patientId: "",
    doctorId: "",
    date: "",
    time: "",
    type: "",
    reason: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, groupTab]);

  const {
    loading: loadingApts,
    error: errorApts,
    data: dataApts,
  } = useQuery(GET_APPOINTMENTS, {
    variables: { page, limit, search: debouncedSearch, status: filterStatus },
  });

  const handleStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const { data: dataDoctors } = useQuery(GET_USERS_BY_ROLE, {
    variables: { role: "doctor" },
    skip: user?.role === "patient",
  });
  const { data: dataPatients } = useQuery(GET_PATIENTS, {
    variables: { page: 1, limit: 100 },
    skip: user?.role === "patient",
  });

  const [createAppointment] = useMutation(CREATE_APPOINTMENT, {
    refetchQueries: [{ query: GET_APPOINTMENTS }],
  });

  const [updateAppointment] = useMutation(UPDATE_APPOINTMENT, {
    refetchQueries: [{ query: GET_APPOINTMENTS }],
  });

  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" });

  if (loadingApts && !dataApts) return <Preloader />;
  if (errorApts)
    return (
      <div className="p-6 text-center text-red-500">
        Error: {errorApts.message}
      </div>
    );

  const {
    appointments = [],
    totalPages = 1,
    totalCount = 0,
  } = dataApts?.getAppointments || {};
  const doctors = dataDoctors?.getUsersByRole || [];
  const patients = dataPatients?.getPatients?.patients || [];

  const upcomingAppointments = appointments.filter(
    (a) =>
      isAppointmentToday(a.date) ||
      isAppointmentUpcoming(a.date) ||
      (!isAppointmentPast(a.date) &&
        a.status !== "Completed" &&
        a.status !== "Cancelled"),
  );

  const previousAppointments = appointments.filter((a) =>
    isAppointmentPast(a.date),
  );

  const previousDone = previousAppointments.filter(
    (a) => a.status === "Completed",
  );
  const previousNotDone = previousAppointments.filter(
    (a) => a.status !== "Completed" && a.status !== "Cancelled",
  );
  const previousCancelled = previousAppointments.filter(
    (a) => a.status === "Cancelled",
  );

  let displayUpcoming = upcomingAppointments;
  let displayPreviousDone = previousDone;
  let displayPreviousNotDone = previousNotDone;
  let displayPreviousCancelled = previousCancelled;

  if (groupTab === "all") {
    displayUpcoming = upcomingAppointments;
    displayPreviousDone = previousDone;
    displayPreviousNotDone = previousNotDone;
    displayPreviousCancelled = previousCancelled;
  } else if (groupTab === "upcoming") {
    displayUpcoming = upcomingAppointments;
    displayPreviousDone = [];
    displayPreviousNotDone = [];
    displayPreviousCancelled = [];
  } else if (groupTab === "previous") {
    displayUpcoming = [];
  }

  const groupedDisplayCount =
    displayUpcoming.length +
    displayPreviousDone.length +
    displayPreviousNotDone.length +
    displayPreviousCancelled.length;

  const handleBookingChange = (e) => {
    setBookingData({ ...bookingData, [e.target.name]: e.target.value });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      const selectedDoctor = doctors.find((d) => d.id === bookingData.doctorId);
      const selectedPatient =
        user.role === "patient"
          ? { id: user.id, name: user.name }
          : patients.find((p) => p.id === bookingData.patientId);

      await createAppointment({
        variables: {
          patientId: selectedPatient?.id,
          patientName: selectedPatient?.name,
          doctorId: bookingData.doctorId,
          doctorName: selectedDoctor ? selectedDoctor.name : "Unknown",
          date: bookingData.date,
          time: bookingData.time,
          type: bookingData.type,
          reason: bookingData.reason,
        },
      });
      toast.success("Appointment booked successfully!");
      setShowBooking(false);
      setBookingData({
        patientId: "",
        doctorId: "",
        date: "",
        time: "",
        type: "",
        reason: "",
      });
    } catch (err) {
      toast.error("Failed to book appointment");
    }
  };

  const handleAppointmentAction = async (action, appointment) => {
    if (action === "reschedule") {
      setReschedulingAppointment(appointment);
      setRescheduleData({
        date: appointment.date.split("T")[0],
        time: appointment.time,
      });
    } else if (action === "cancel") {
      try {
        await updateAppointment({
          variables: {
            id: appointment.id,
            status: "Cancelled",
          },
        });
        toast.success("Appointment cancelled");
      } catch (err) {
        toast.error("Failed to cancel appointment");
      }
    } else if (action === "complete") {
      try {
        await updateAppointment({
          variables: {
            id: appointment.id,
            status: "Completed",
          },
        });
        toast.success("Appointment marked as Done!");
      } catch (err) {
        toast.error(`Failed to mark done: ${err.message}`);
      }
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await updateAppointment({
        variables: {
          id: reschedulingAppointment.id,
          date: rescheduleData.date,
          time: rescheduleData.time,
        },
      });
      toast.success("Appointment rescheduled successfully!");
      setReschedulingAppointment(null);
    } catch (err) {
      toast.error("Failed to reschedule appointment");
    }
  };

  return (
    <Suspense fallback={<Preloader />}>
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div {...fadeIn("down")} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                Appointments
              </h1>
              <p className="text-gray-600 flex items-center gap-2 flex-wrap">
                Manage your dental appointments
                {totalCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 ml-1 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <Clock size={12} /> {totalCount} total
                  </span>
                )}
              </p>
            </div>
            {user.role !== "doctor" && (
              <button
                onClick={() => setShowBooking(!showBooking)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                Book Appointment
              </button>
            )}
          </div>
        </motion.div>

        {reschedulingAppointment && (
          <motion.div
            {...fadeIn("up", 0.1)}
            className="card mb-8 bg-blue-50 border-blue-200"
          >
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
              Reschedule Appointment for {reschedulingAppointment.patientName}
            </h2>
            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={rescheduleData.date}
                    onChange={(e) =>
                      setRescheduleData({
                        ...rescheduleData,
                        date: e.target.value,
                      })
                    }
                    className="input-field"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Time Slot *
                  </label>
                  <select
                    name="time"
                    value={rescheduleData.time}
                    onChange={(e) =>
                      setRescheduleData({
                        ...rescheduleData,
                        time: e.target.value,
                      })
                    }
                    className="input-field"
                    required
                  >
                    <option value="">Select time</option>
                    {appointmentSlots.map((slot) => (
                      <option key={slot.time} value={slot.time}>
                        {slot.time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Confirm Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => setReschedulingAppointment(null)}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {showBooking && (
          <motion.div {...fadeIn("up", 0.1)} className="card mb-8">
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
              Book New Appointment
            </h2>
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.role === "admin" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Patient *
                    </label>
                    <select
                      name="patientId"
                      value={bookingData.patientId}
                      onChange={handleBookingChange}
                      className="input-field"
                      required
                    >
                      <option value="">Choose a patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name}
                          {patient.patientId ? ` (${patient.patientId})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor *
                  </label>
                  <select
                    name="doctorId"
                    value={bookingData.doctorId}
                    onChange={handleBookingChange}
                    className="input-field"
                    required
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                        {doctor.specialization
                          ? ` - ${doctor.specialization}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Type *
                  </label>
                  <select
                    name="type"
                    value={bookingData.type}
                    onChange={handleBookingChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Check-up">Check-up</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={bookingData.date}
                    onChange={handleBookingChange}
                    className="input-field"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slot *
                  </label>
                  <select
                    name="time"
                    value={bookingData.time}
                    onChange={handleBookingChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select time</option>
                    {appointmentSlots
                      .filter((slot) => slot.available)
                      .map((slot) => (
                        <option key={slot.time} value={slot.time}>
                          {slot.time}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit (Optional)
                </label>
                <textarea
                  name="reason"
                  value={bookingData.reason}
                  onChange={handleBookingChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describe your dental concern or reason for visit"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Book Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <motion.div {...fadeIn("up", 0.2)} className="card mb-6">
          <div className="flex flex-col gap-4">
            <div
              role="tablist"
              aria-label="Appointment groups"
              className="flex flex-wrap gap-2 border-b border-gray-200 pb-2"
            >
              {GROUP_TABS.map((tab) => {
                const active = groupTab === tab.value;
                return (
                  <button
                    role="tab"
                    aria-selected={active}
                    key={tab.value}
                    onClick={() => setGroupTab(tab.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by patient, doctor or type..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative w-full md:w-64">
                <Filter
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <select
                  className="input-field pl-10"
                  value={filterStatus}
                  onChange={handleStatusChange}
                >
                  <option value="All">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {displayUpcoming.length > 0 && groupTab !== "previous" && (
          <motion.section
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-primary" />
              <h2 className="font-heading text-xl font-bold text-gray-900">
                Upcoming Appointments
              </h2>
              <span className="ml-auto text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                {displayUpcoming.length}{" "}
                {displayUpcoming.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayUpcoming.map((apt, index) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  delay={index * 0.05}
                  onAction={handleAppointmentAction}
                  showPatient={user.role !== "patient"}
                />
              ))}
            </div>
          </motion.section>
        )}

        {displayPreviousDone.length > 0 && groupTab !== "upcoming" && (
          <motion.section
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <h2 className="font-heading text-xl font-bold text-gray-900">
                Previous — Done
              </h2>
              <span className="ml-auto text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {displayPreviousDone.length}{" "}
                {displayPreviousDone.length === 1 ? "visit" : "visits"} done
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayPreviousDone.map((apt, index) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  delay={index * 0.05}
                  showPatient={user.role !== "patient"}
                />
              ))}
            </div>
          </motion.section>
        )}

        {displayPreviousNotDone.length > 0 && groupTab !== "upcoming" && (
          <motion.section
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-red-600" />
              <h2 className="font-heading text-xl font-bold text-gray-900">
                Previous — Not Done
              </h2>
              <span className="ml-auto text-xs font-medium px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
                {displayPreviousNotDone.length} missed / not completed
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayPreviousNotDone.map((apt, index) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  delay={index * 0.05}
                  onAction={handleAppointmentAction}
                  showPatient={user.role !== "patient"}
                />
              ))}
            </div>
          </motion.section>
        )}

        {displayPreviousCancelled.length > 0 && groupTab !== "upcoming" && (
          <motion.section
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <XCircle size={20} className="text-gray-500" />
              <h2 className="font-heading text-xl font-bold text-gray-900">
                Previous — Cancelled
              </h2>
              <span className="ml-auto text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                {displayPreviousCancelled.length}{" "}
                {displayPreviousCancelled.length === 1
                  ? "appointment"
                  : "appointments"}{" "}
                cancelled
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayPreviousCancelled.map((apt, index) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  delay={index * 0.05}
                  showPatient={user.role !== "patient"}
                />
              ))}
            </div>
          </motion.section>
        )}

        {groupedDisplayCount === 0 && (
          <motion.div
            {...fadeIn("up")}
            className="col-span-2 card text-center py-12"
          >
            <CalendarIcon size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== "All" || groupTab !== "all"
                ? "Try adjusting your search, filter, or group tab"
                : "You don't have any appointments yet"}
            </p>
            {user.role !== "doctor" && !showBooking && (
              <button
                onClick={() => setShowBooking(true)}
                className="btn-primary"
              >
                Book Your First Appointment
              </button>
            )}
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-8 text-xs text-gray-500">
          <span>
            Showing page {page} of {totalPages} ({groupedDisplayCount} of{" "}
            {totalCount} appointments
            {groupTab !== "all" ? ` in ${groupTab} view` : ""})
          </span>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </Suspense>
  );
};

export default Appointments;
