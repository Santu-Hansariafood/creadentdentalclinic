import { useEffect, useState } from "react";
import {
  X,
  Calendar,
  User,
  Stethoscope,
  Clipboard,
  Pill,
  Heart,
  Phone,
  Mail,
  MapPin,
  FileText,
  Download,
  Trash2,
  AlertTriangle,
  Eye,
  Shield,
  Loader2,
} from "lucide-react";
import api from "../api/axios";

const fileTypeIcon = (type, name) => {
  const n = (name || "").toLowerCase();
  const t = (type || "").toLowerCase();
  if (t.startsWith("image") || /\.(avif|bmp|gif|heic|heif|ico|jpe?g|jp2|jpf|jpm|jpx|png|svg|tif?f|webp)$/.test(n)) return "🖼️";
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

const getAttachmentUrl = (att) => {
  if (!att) return "";
  if (att.url && /^https:\/\/spacebyte\.in\//i.test(att.url)) {
    const token = localStorage.getItem("token");
    return `/api/storage/proxy?url=${encodeURIComponent(att.url)}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
  }
  if (att.url) return att.url;
  if (att.storageKey) return `/files/${encodeURIComponent(att.storageKey)}`;
  return "";
};

const MedicalRecordViewer = ({ record, onClose, onEdit, onDelete }) => {
  const patient = record?.patient || null;
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  useEffect(() => {
    if (!record) return;
    if (record?.attachments?.length) {
      const initialAttachments = record.attachments.map((a) => ({ ...a, url: getAttachmentUrl(a) }));
      setAttachments(initialAttachments);
      setSelectedAttachment(initialAttachments[0] || null);
    } else {
      setAttachments([]);
      setSelectedAttachment(null);
    }
    if (record?.id) {
      setLoadingAttachments(true);
      setAttachmentsError("");
      (async () => {
        const candidates = [
          `/api/storage/record-attachments/${encodeURIComponent(record.id)}`,
          `/storage/record-attachments/${encodeURIComponent(record.id)}`,
          `/graphql/storage/record-attachments/${encodeURIComponent(record.id)}`,
        ];
        let data = null;
        let lastErr = null;
        for (const p of candidates) {
          try {
            const res = await api.get(p, { timeout: 30000 });
            data = res.data;
            break;
          } catch (e) {
            lastErr = e;
            const status = e?.response?.status;
            if (status !== 404) break;
          }
        }
        if (data && Array.isArray(data.attachments)) {
          const withUrls = data.attachments.map((a) => ({ ...a, url: getAttachmentUrl(a) }));
          setAttachments(withUrls);
          setSelectedAttachment(withUrls[0] || null);
        } else if (lastErr) {
          const reason =
            lastErr?.response?.data?.error ||
            lastErr?.response?.data?.message ||
            lastErr?.message ||
            "Could not refresh attachment URLs";
          setAttachmentsError(reason);
        }
        setLoadingAttachments(false);
      })();
    }
  }, [record]);

  if (!record) return null;

  const openAttachment = (att) => {
    const url = getAttachmentUrl(att);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const isImage = (att) => {
    if (!att) return false;
    if (att.type && att.type.startsWith("image")) return true;
    return /\.(avif|bmp|gif|heic|heif|ico|jpe?g|jp2|jpf|jpm|jpx|png|svg|tif?f|webp)$/i.test(
      att.originalName || att.name || "",
    );
  };

  const isPdf = (att) =>
    Boolean(att?.type?.toLowerCase().includes("pdf")) ||
    /\.pdf$/i.test(att?.originalName || att?.name || "");

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-primary to-accent px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText size={22} className="text-white" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                Medical Record
                <span className="text-sm bg-white/20 rounded px-2 py-0.5">
                  {record.visitType || "General"}
                </span>
              </h2>
              <p className="text-white/80 text-sm flex items-center gap-2 mt-0.5">
                <Calendar size={13} />
                {record.date ? new Date(record.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"}
                {patient?.patientId && (
                  <span className="ml-2 inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded text-xs">
                    <Shield size={11} /> Patient ID: {patient.patientId}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit?.(record)}
              className="bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1.5"
            >
              <Clipboard size={15} />
              Edit
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm("Delete this medical record? This cannot be undone.")) {
                    onDelete(record);
                  }
                }}
                className="bg-red-500/90 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1.5"
              >
                <Trash2 size={15} />
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-white/15 hover:bg-white/25 text-white w-9 h-9 rounded-lg flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {patient && (
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <User size={16} className="text-primary" />
                <h3 className="font-semibold text-gray-900">Patient Information</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Full Name</p>
                  <p className="font-medium text-gray-900">{patient.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Gender / Age</p>
                  <p className="font-medium text-gray-900">
                    {patient.gender || "—"}
                    {patient.dateOfBirth && (
                      <span className="ml-2 text-gray-600 normal-case">
                        ({Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Blood Group</p>
                  <p className="font-medium text-gray-900">{patient.bloodGroup || "—"}</p>
                </div>
                <div className="flex items-start gap-1.5">
                  <Phone size={13} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Phone</p>
                    <p className="font-medium text-gray-900">{patient.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <Mail size={13} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Email</p>
                    <p className="font-medium text-gray-900 break-all">{patient.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 md:col-span-1">
                  <MapPin size={13} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Address</p>
                    <p className="font-medium text-gray-900">{patient.address || "—"}</p>
                  </div>
                </div>
              </div>

              {patient.medicalHistory && (patient.medicalHistory.allergies?.length || patient.medicalHistory.chronicConditions?.length || patient.medicalHistory.medications?.length) && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {patient.medicalHistory.allergies?.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-red-700 font-semibold mb-1">
                        <AlertTriangle size={12} /> Allergies
                      </div>
                      <ul className="space-y-0.5 text-gray-700">
                        {patient.medicalHistory.allergies.map((a, i) => <li key={i}>• {a}</li>)}
                      </ul>
                    </div>
                  )}
                  {patient.medicalHistory.chronicConditions?.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                      <div className="text-amber-700 font-semibold mb-1">Chronic Conditions</div>
                      <ul className="space-y-0.5 text-gray-700">
                        {patient.medicalHistory.chronicConditions.map((a, i) => <li key={i}>• {a}</li>)}
                      </ul>
                    </div>
                  )}
                  {patient.medicalHistory.medications?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <div className="text-blue-700 font-semibold mb-1 flex items-center gap-1">
                        <Pill size={12} /> Current Medications
                      </div>
                      <ul className="space-y-0.5 text-gray-700">
                        {patient.medicalHistory.medications.map((a, i) => <li key={i}>• {a}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Stethoscope size={16} className="text-primary" />
                Doctor & Consultation
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Doctor</p>
                  <p className="font-medium text-gray-900">Dr. {record.doctorName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Visit Type</p>
                  <span className="inline-block bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium">
                    {record.visitType || "—"}
                  </span>
                </div>
                {record.followUpDate && (
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Follow-up Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(record.followUpDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Heart size={16} className="text-primary" />
                Vital Signs (Observed)
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["BP (mmHg)", record.vitalSigns?.bloodPressure],
                  ["Heart Rate (bpm)", record.vitalSigns?.heartRate],
                  ["Temp (°F)", record.vitalSigns?.temperature],
                  ["Height (cm)", record.vitalSigns?.height],
                  ["Weight (kg)", record.vitalSigns?.weight],
                  ["Blood Group", patient?.bloodGroup],
                ].map(([label, val], i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-gray-500 text-[11px] mb-0.5">{label}</p>
                    <p className="font-semibold text-gray-900">{val || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Diagnosis</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {record.diagnosis || <span className="text-gray-400 italic">— No diagnosis noted —</span>}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Treatment Plan</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {record.treatment || <span className="text-gray-400 italic">— No treatment noted —</span>}
              </p>
            </div>
          </div>

          {(record.notes) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Clinical Notes</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {record.notes}
              </p>
            </div>
          )}

          {record.prescriptions?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Pill size={16} className="text-primary" /> Prescriptions
              </h3>
              <ul className="space-y-1.5 text-sm">
                {record.prescriptions.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">•</span>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                Uploaded Documents & Reports
                <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                  {attachments.length} file{attachments.length === 1 ? "" : "s"}
                </span>
                {loadingAttachments && (
                  <span className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-0.5 flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" /> Refreshing
                  </span>
                )}
              </h3>
              {attachmentsError && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle size={12} /> {attachmentsError}
                </p>
              )}
            </div>
            {attachments.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-8 bg-gray-50 rounded-lg">
                No documents uploaded for this record yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attachments.map((att, idx) => {
                  const url = getAttachmentUrl(att);
                  const img = isImage(att);
                  return (
                    <div
                      key={att.storageKey || att.url || idx}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:border-primary/40 transition-colors"
                    >
                      {img && url ? (
                        <button
                          type="button"
                          onClick={() => setSelectedAttachment(att)}
                          className="block h-44 bg-gray-50 overflow-hidden"
                        >
                          <img
                            src={url}
                            alt={att.originalName || att.name || "Image"}
                            className="w-full h-full object-cover hover:scale-[1.02] transition-transform"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement.innerHTML =
                                `<div class="w-full h-full flex items-center justify-center text-5xl">${fileTypeIcon(att.type, att.originalName || att.name)}</div>`;
                            }}
                          />
                        </button>
                      ) : (
                        <div className="h-24 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                          <span className="text-5xl">{fileTypeIcon(att.type, att.originalName || att.name)}</span>
                        </div>
                      )}
                      <div className="p-3 flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-sm font-semibold text-gray-900 truncate"
                            title={att.name || att.originalName}
                          >
                            {att.name || att.originalName || "Document"}
                          </p>
                          <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>{formatSize(att.size)}</span>
                            {att.uploadedAt && (
                              <>
                                <span>•</span>
                                <span>
                                  {new Date(att.uploadedAt).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </>
                            )}
                            {att.type && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[120px]" title={att.type}>
                                  {att.type.split("/").pop()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {url && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setSelectedAttachment(att)}
                              className={`text-primary hover:text-primary/80 p-1.5 hover:bg-primary/5 rounded ${selectedAttachment?.storageKey === att.storageKey ? "bg-primary/10" : ""}`}
                              title="View file"
                            >
                              <Eye size={16} />
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={att.name || att.originalName}
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded"
                              title="Download"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedAttachment && getAttachmentUrl(selectedAttachment) && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="px-3 py-2 border-b border-gray-200 bg-white flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedAttachment.name || selectedAttachment.originalName || "Selected file"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedAttachment(null)}
                    className="text-gray-500 hover:text-gray-800 p-1 rounded"
                    title="Close preview"
                  >
                    <X size={15} />
                  </button>
                </div>
                {isImage(selectedAttachment) ? (
                  <div className="p-3 flex justify-center max-h-[32rem] overflow-auto">
                    <img
                      src={getAttachmentUrl(selectedAttachment)}
                      alt={selectedAttachment.originalName || selectedAttachment.name || "Uploaded file"}
                      className="max-w-full max-h-[30rem] object-contain rounded"
                    />
                  </div>
                ) : isPdf(selectedAttachment) ? (
                  <iframe
                    src={getAttachmentUrl(selectedAttachment)}
                    title={selectedAttachment.originalName || "PDF preview"}
                    className="w-full h-[32rem] bg-white"
                  />
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-5xl mb-3">{fileTypeIcon(selectedAttachment.type, selectedAttachment.originalName || selectedAttachment.name)}</div>
                    <p className="text-sm text-gray-600 mb-3">This file type cannot be previewed here.</p>
                    <button
                      type="button"
                      onClick={() => openAttachment(selectedAttachment)}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Eye size={15} /> Open File
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordViewer;
