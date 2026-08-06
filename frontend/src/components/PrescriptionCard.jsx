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
  Mail,
  Loader2,
} from "lucide-react";
import { formatDate } from "../utils/dateUtils";
import { fadeIn } from "../utils/motion";
import toast from "react-hot-toast";
import generatePrescriptionPDF from "./PrescriptionPDF";
import PrescriptionPreview from "./PrescriptionPreview";
import { useMutation } from "@apollo/client";
import { SEND_PRESCRIPTION_EMAIL } from "../graphql/mutations";

const PrescriptionCard = ({ prescription, delay = 0 }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendEmail] = useMutation(SEND_PRESCRIPTION_EMAIL);

  const rxId = prescription.id
    ? `RX-${String(prescription.id).slice(-8).toUpperCase()}`
    : "RX-NEW";

  const patient = prescription.patient || null;

  const handleDownload = async () => {
    try {
      await generatePrescriptionPDF(prescription, patient);
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

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      let pdfDataUri = "";
      try {
        const result = await generatePrescriptionPDF(
          prescription,
          patient,
          { save: false },
        );
        pdfDataUri = result?.dataUriString || "";
      } catch (pdfErr) {
        console.warn("Could not attach PDF:", pdfErr);
      }

      const { data } = await sendEmail({
        variables: {
          prescriptionId: prescription.id,
          patientName: prescription.patientName,
          patientEmail: patient?.email || undefined,
          patientId: patient?.patientId || undefined,
          doctorName: prescription.doctorName,
          date: prescription.date,
          diagnosis: prescription.diagnosis,
          notes: prescription.notes,
          medications: prescription.medications || [],
          pdfDataUri,
        },
      });

      const resp = data?.sendPrescriptionEmail;
      if (resp?.success) {
        toast.success(resp.message || "Prescription email sent!");
      } else {
        toast.error(resp?.message || "Failed to send prescription email");
      }
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error(
        err?.message || "An error occurred while sending the prescription email",
      );
    } finally {
      setSendingEmail(false);
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
                  {patient?.patientId && (
                    <span className="ml-2 text-gray-400">
                      | {patient.patientId}
                    </span>
                  )}
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
            {patient?.email && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg ring-1 ring-emerald-100">
                <Mail size={13} />
                <span className="truncate max-w-[160px]">{patient.email}</span>
              </div>
            )}
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

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors"
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sendingEmail ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={16} />
                  Email to Patient
                </>
              )}
            </button>
          </div>
          {!patient?.email && (
            <p className="mt-2 text-[11px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded">
              ⚠ Patient email not registered. Please update patient profile to enable email.
            </p>
          )}
        </div>
      </motion.div>

      {showPreview && (
        <PrescriptionPreview
          prescription={prescription}
          patient={patient}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
          onSendEmail={handleSendEmail}
          sendingEmail={sendingEmail}
        />
      )}
    </>
  );
};

export default PrescriptionCard;
