import { motion } from "framer-motion";
import { User, Phone, Mail, Calendar, Edit3, Trash2, IdCard } from "lucide-react";
import { fadeIn } from "../utils/motion";

const PatientCard = ({ patient, delay = 0, onSelect, onEdit, onDelete }) => {
  return (
    <motion.div
      {...fadeIn("up", delay)}
      className="card-hover"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <User size={28} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading font-semibold text-gray-900 mb-1">
                {patient.name}
              </h3>
              {patient.patientId && (
                <div className="flex items-center gap-1 text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-md w-fit mb-2">
                  <IdCard size={12} />
                  <span className="font-mono font-medium">{patient.patientId}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(patient);
                  }}
                  className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
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
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={14} />
              <span className="truncate">{patient.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} />
              <span>{patient.phone}</span>
            </div>
            {patient.dateOfBirth && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} />
                <span>
                  DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`badge ${
              patient.status === "Active" ? "badge-success" : "badge-error"
            }`}
          >
            {patient.status}
          </span>
          <span className="text-xs text-gray-500">{patient.gender}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PatientCard;
