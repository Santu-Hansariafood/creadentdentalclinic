import { useState } from "react";
import { motion } from "framer-motion";
import {
  Pill,
  Calendar,
  FileText,
  Download,
  Eye,
  Clock,
  Stethoscope,
} from "lucide-react";
import { formatDate } from "../utils/dateUtils";
import { fadeIn } from "../utils/motion";
import toast from "react-hot-toast";
import generatePrescriptionPDF from "./PrescriptionPDF";
import PrescriptionPreview from "./PrescriptionPreview";

const PrescriptionCard = ({ prescription, delay = 0 }) => {
  const [showPreview, setShowPreview] = useState(false);

  const rxId = prescription.id
    ? `RX-${String(prescription.id).slice(-8).toUpperCase()}`
    : "RX-NEW";

  const handleDownload = async () => {
    try {
      await generatePrescriptionPDF(prescription);
      toast.success("Prescription downloaded successfully!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error(
        err?.message
          ? `Failed to generate PDF: ${err.message}`
          : "Failed to generate prescription PDF",
      );
    }
  };

  return (
    <>
      <motion.div
        {...fadeIn("up", delay)}
        className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
      >
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-accent" />

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center border border-primary/10">
                <Pill size={22} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-bold text-gray-900">
                    {prescription.patientName}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      prescription.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    }`}
                  >
                    {prescription.status}
                  </span>
                </div>
                <p className="text-xs font-mono text-primary/70 mt-0.5">
                  {rxId}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                  {prescription.diagnosis}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <Calendar size={13} className="text-primary" />
              <span>{formatDate(prescription.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <Stethoscope size={13} className="text-primary" />
              <span>Dr. {prescription.doctorName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <Clock size={13} className="text-primary" />
              <span>
                {(prescription.medications || []).length} medication(s)
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {(prescription.medications || []).slice(0, 3).map((med, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {med.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {med.dosage} • {med.frequency} • {med.duration}
                  </p>
                  {med.instructions && (
                    <p className="text-xs text-gray-400 italic mt-1 truncate">
                      {med.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {(prescription.medications || []).length > 3 && (
              <p className="text-xs text-primary font-medium pl-1">
                +{(prescription.medications || []).length - 3} more
                medication(s)
              </p>
            )}
          </div>

          {prescription.notes && (
            <div className="mb-4 p-3 bg-amber-50/60 rounded-lg border border-amber-100">
              <div className="flex items-start gap-2">
                <FileText
                  size={14}
                  className="text-amber-600 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-amber-800 line-clamp-2 italic">
                  {prescription.notes}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors"
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      </motion.div>

      {showPreview && (
        <PrescriptionPreview
          prescription={prescription}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
        />
      )}
    </>
  );
};

export default PrescriptionCard;
