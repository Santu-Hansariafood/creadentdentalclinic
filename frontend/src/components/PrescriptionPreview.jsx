import { AnimatePresence, motion } from "framer-motion";
import { X, Download, Printer, Mail, Loader2 } from "lucide-react";
import PrescriptionDocument from "./PrescriptionDocument";

const PrescriptionPreview = ({
  prescription,
  patient,
  onClose,
  onDownload,
  onSendEmail,
  sendingEmail = false,
}) => {
  if (!prescription) return null;

  const handlePrint = () => window.print();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print-modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:rounded-none"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between print:hidden">
            <h2 className="font-heading text-lg font-semibold text-gray-900">
              Prescription
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrint}
                className="btn-outline flex items-center gap-2 text-sm py-1.5 px-3"
              >
                <Printer size={15} /> Print
              </button>
              {onSendEmail && (
                <button
                  onClick={onSendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={15} /> Email
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onDownload}
                className="btn-primary flex items-center gap-2 text-sm py-1.5 px-3"
              >
                <Download size={15} /> Download PDF
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-6 print:p-0">
            <PrescriptionDocument
              prescription={prescription}
              patient={patient}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrescriptionPreview;
