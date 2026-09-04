import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  IdCard,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { fadeIn } from "../utils/motion";
import {
  formatDate,
  isAppointmentPast,
  isAppointmentToday,
} from "../utils/dateUtils";

const AppointmentCard = ({
  appointment,
  delay = 0,
  onAction,
  showPatient = false,
}) => {
  const statusColors = {
    Scheduled: "border-primary bg-primary/5",
    Completed: "border-success bg-success/5",
    Cancelled: "border-gray-400 bg-gray-50",
    Pending: "border-warning bg-warning/5",
  };

  const statusBadges = {
    Scheduled: "badge-primary",
    Completed: "badge-success",
    Cancelled: "badge-error",
    Pending: "badge-warning",
  };

  const today = isAppointmentToday(appointment.date);
  const past = isAppointmentPast(appointment.date);
  const isDone = appointment.status === "Completed";
  const isCancelled = appointment.status === "Cancelled";
  const missed = past && !isDone && !isCancelled;

  return (
    <motion.div
      {...fadeIn("up", delay)}
      className={`appointment-card ${statusColors[appointment.status] || statusColors.Scheduled}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold text-gray-900">
              {appointment.type}
            </h3>
            {today && !isDone && !isCancelled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                <AlertTriangle size={10} />
                Today
              </span>
            )}
            {isDone && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={10} />
                Done
              </span>
            )}
            {missed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle size={10} />
                Not Done
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {appointment.reason || "No reason provided"}
          </p>
        </div>
        <span
          className={`badge ${statusBadges[appointment.status] || statusBadges.Scheduled}`}
        >
          {appointment.status || "Scheduled"}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar size={16} className="text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {formatDate(appointment.date, "dd/MM/yyyy")}
            </span>
            {today && (
              <span className="text-[11px] text-primary font-medium">
                {isDone ? "Completed earlier today" : "Scheduled for today"}
              </span>
            )}
            {past && !today && (
              <span
                className={`text-[11px] font-medium ${
                  isDone
                    ? "text-emerald-600"
                    : isCancelled
                      ? "text-gray-500"
                      : "text-red-600"
                }`}
              >
                {isDone
                  ? "Previous appointment — Done"
                  : isCancelled
                    ? "Previous appointment — Cancelled"
                    : "Previous appointment — Not Done"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock size={16} className="text-primary shrink-0" />
          <span>
            <span className="font-semibold">{appointment.time}</span>
            <span className="text-gray-500">
              {" "}
              • {appointment.duration || 30} min
            </span>
          </span>
        </div>

        {showPatient ? (
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <Stethoscope size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-gray-900">
                {appointment.doctorName}
              </span>
              <span className="text-gray-500 text-xs">Doctor</span>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <User size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-gray-900">
                {appointment.doctorName}
              </span>
              <span className="text-gray-500 text-xs">Doctor</span>
            </div>
          </div>
        )}

        {showPatient && appointment.patientName && (
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <IdCard size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-gray-900">
                {appointment.patientName}
              </span>
              <span className="text-gray-500 text-xs">Patient</span>
            </div>
          </div>
        )}
      </div>

      {appointment.notes && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Note:</span> {appointment.notes}
          </p>
        </div>
      )}

      {onAction && appointment.status === "Scheduled" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {today || past
            ? !isDone && (
                <button
                  onClick={() => onAction("complete", appointment)}
                  className="btn-success flex-1 text-sm py-2"
                >
                  Mark Done
                </button>
              )
            : null}
          <button
            onClick={() => onAction("reschedule", appointment)}
            className="btn-outline flex-1 text-sm py-2"
          >
            Reschedule
          </button>
          <button
            onClick={() => onAction("cancel", appointment)}
            className="btn-danger flex-1 text-sm py-2"
          >
            Cancel
          </button>
        </div>
      )}

      {onAction && missed && !isDone && !isCancelled && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onAction("complete", appointment)}
            className="btn-success flex-1 text-sm py-2"
          >
            Mark as Done
          </button>
          <button
            onClick={() => onAction("cancel", appointment)}
            className="btn-danger flex-1 text-sm py-2"
          >
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AppointmentCard;
