import { AnimatePresence, motion } from 'framer-motion'
import { X, Download, Printer, Pill, Stethoscope, Calendar, Hash } from 'lucide-react'
import { formatDateTime } from '../utils/dateUtils'
import { CLINIC_INFO, BRAND } from '../utils/prescriptionConfig'

const PrescriptionPreview = ({ prescription, onClose, onDownload }) => {
  if (!prescription) return null

  const rxId = prescription.id
    ? `RX-${String(prescription.id).slice(-8).toUpperCase()}`
    : 'RX-NEW'

  const issueDateLabel = formatDateTime(prescription.date, 'dd MMM yyyy • hh:mm a')

  const handlePrint = () => {
    window.print()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print-modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col print:shadow-none print:rounded-none print:max-h-none print:max-w-none"
        >
          {/* Toolbar */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between print:hidden">
            <div>
              <h2 className="font-heading text-xl font-bold text-gray-900">Prescription Preview</h2>
              <p className="text-sm text-gray-500">Review before printing or downloading</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="btn-outline flex items-center gap-2 text-sm py-2 px-3"
              >
                <Printer size={16} />
                Print
              </button>
              <button
                onClick={onDownload}
                className="btn-primary flex items-center gap-2 text-sm py-2 px-3"
              >
                <Download size={16} />
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-1"
              >
                <X size={22} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Document */}
          <div className="overflow-y-auto p-6 print:p-0 print:overflow-visible">
            <div
              id="prescription-document"
              className="relative mx-auto bg-white border-2 rounded-xl overflow-hidden shadow-inner print:shadow-none print:border print:border-gray-300"
              style={{ borderColor: `${BRAND.primary}40` }}
            >
              {/* Watermark */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                aria-hidden
              >
                <span
                  className="text-[180px] font-bold opacity-[0.04] -rotate-[25deg] translate-y-8"
                  style={{ color: BRAND.primary }}
                >
                  Rx
                </span>
              </div>

              {/* Header */}
              <div
                className="relative px-8 py-6 text-white"
                style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%)` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/30">
                      <Pill size={28} className="text-white" />
                    </div>
                    <div>
                      <h1 className="font-heading text-2xl font-bold tracking-tight">{CLINIC_INFO.name}</h1>
                      <p className="text-white/80 text-sm mt-0.5">{CLINIC_INFO.tagline}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-white/90 hidden sm:block">
                    <p>{CLINIC_INFO.address}</p>
                    <p>{CLINIC_INFO.city}</p>
                    <p className="mt-1">{CLINIC_INFO.phone}</p>
                    <p>{CLINIC_INFO.email}</p>
                  </div>
                </div>
              </div>

              {/* Meta strip */}
              <div
                className="px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
                style={{ backgroundColor: BRAND.light }}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={15} style={{ color: BRAND.primary }} />
                  <span className="font-medium" style={{ color: BRAND.primary }}>Issued:</span>
                  <span className="text-gray-700">{issueDateLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash size={15} style={{ color: BRAND.primary }} />
                  <span className="font-mono font-semibold tracking-wide" style={{ color: BRAND.primary }}>
                    {rxId}
                  </span>
                </div>
              </div>

              {/* Patient & Doctor */}
              <div className="px-8 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: BRAND.primary }}>
                    Patient
                  </p>
                  <p className="font-heading font-bold text-lg text-gray-900">{prescription.patientName}</p>
                  <p className="text-sm text-gray-500 mt-1">Dental Patient</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope size={14} style={{ color: BRAND.primary }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND.primary }}>
                      Prescribing Doctor
                    </p>
                  </div>
                  <p className="font-heading font-bold text-gray-900">Dr. {prescription.doctorName}</p>
                  <p className="text-sm text-gray-500 mt-1">BDS, MDS — Dental Surgeon</p>
                </div>
              </div>

              {/* Diagnosis */}
              {prescription.diagnosis && (
                <div className="px-8 pb-4">
                  <div
                    className="rounded-xl px-4 py-3 border"
                    style={{ backgroundColor: `${BRAND.light}80`, borderColor: `${BRAND.primary}30` }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: BRAND.primary }}>
                      Diagnosis
                    </p>
                    <p className="text-gray-800 font-medium">{prescription.diagnosis}</p>
                  </div>
                </div>
              )}

              {/* Medications */}
              <div className="px-8 pb-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-serif font-bold leading-none" style={{ color: BRAND.primary }}>
                    ℞
                  </span>
                  <h3 className="font-heading font-semibold text-gray-900 uppercase tracking-wide text-sm">
                    Prescribed Medications
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: BRAND.primary }} className="text-white">
                        <th className="px-3 py-2.5 text-left font-semibold w-10">#</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Medicine</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Dose</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Frequency</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Duration</th>
                        <th className="px-3 py-2.5 text-left font-semibold hidden md:table-cell">Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(prescription.medications || []).map((med, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-3 py-3 font-bold" style={{ color: BRAND.primary }}>
                            {index + 1}
                          </td>
                          <td className="px-3 py-3 font-semibold text-gray-900">{med.name}</td>
                          <td className="px-3 py-3 text-gray-700">{med.dosage}</td>
                          <td className="px-3 py-3 text-gray-700">{med.frequency}</td>
                          <td className="px-3 py-3 text-gray-700">{med.duration}</td>
                          <td className="px-3 py-3 text-gray-600 italic hidden md:table-cell">{med.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile instructions */}
                <div className="md:hidden mt-3 space-y-2">
                  {(prescription.medications || []).map((med, index) =>
                    med.instructions ? (
                      <p key={index} className="text-xs text-gray-500 italic px-1">
                        <span className="font-semibold not-italic text-gray-700">{med.name}:</span> {med.instructions}
                      </p>
                    ) : null
                  )}
                </div>
              </div>

              {/* Notes */}
              {prescription.notes && (
                <div className="px-8 pb-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1">
                      Doctor&apos;s Notes
                    </p>
                    <p className="text-sm text-amber-900 italic">{prescription.notes}</p>
                  </div>
                </div>
              )}

              {/* Footer signature area */}
              <div className="px-8 py-5 border-t border-gray-100 flex flex-wrap items-end justify-between gap-6">
                <div
                  className="rounded-xl px-4 py-3 text-center min-w-[120px]"
                  style={{ backgroundColor: BRAND.light }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND.primary }}>
                    Valid For
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: BRAND.primary }}>
                    {CLINIC_INFO.validityDays}
                  </p>
                  <p className="text-xs text-gray-500">days from issue</p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b-2 border-gray-300 mb-2 mx-auto" />
                  <p className="text-xs text-gray-500">Authorized Signature</p>
                  <p className="font-semibold text-gray-900 mt-1">Dr. {prescription.doctorName}</p>
                </div>
              </div>

              {/* Bottom bar */}
              <div
                className="px-8 py-3 text-center text-xs text-white/90"
                style={{ backgroundColor: BRAND.primary }}
              >
                This is a computer-generated prescription. Please retain for your medical records.
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PrescriptionPreview
