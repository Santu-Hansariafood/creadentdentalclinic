import { motion } from "framer-motion";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Edit3,
  Trash2,
  IdCard,
} from "lucide-react";
import { fadeIn } from "../utils/motion";

const PatientCard = ({ patient, delay = 0, onSelect, onEdit, onDelete }) => {
  return (
    <motion.div {...fadeIn("up", delay)} className="card-hover">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <User size={26} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
                {patient.name}
              </h3>
              {patient.patientId && (
                <div className="flex items-center gap-1 text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-md w-fit max-w-full mb-2">
                  <IdCard size={12} className="flex-shrink-0" />
                  <span className="font-mono font-medium truncate">
                    {patient.patientId}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(patient);
                  }}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Edit3 size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(patient);
                  }}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail size={14} className="flex-shrink-0" />
              <span className="truncate min-w-0">{patient.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Phone size={14} className="flex-shrink-0" />
              <span className="truncate min-w-0">{patient.phone}</span>
            </div>
            {patient.dateOfBirth && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar size={14} className="flex-shrink-0" />
                <span className="truncate min-w-0">
                  DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`badge ${
                patient.status === "Active" ? "badge-success" : "badge-error"
              }`}
            >
              {patient.status}
            </span>
            {patient.gender && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {patient.gender}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PatientCard;
