import { Suspense, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Eye,
  Calendar,
  User,
  Edit3,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  Stethoscope,
  Heart,
  Paperclip,
  AlertCircle,
  AlertTriangle,
  Shield,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fadeIn, staggerContainer } from "../utils/motion";
import toast from "react-hot-toast";
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import { GET_MEDICAL_RECORDS, GET_PATIENTS } from "../graphql/queries";
import {
  CREATE_MEDICAL_RECORD,
  UPDATE_MEDICAL_RECORD,
  DELETE_MEDICAL_RECORD,
} from "../graphql/mutations";
import Preloader from "../components/Preloader";
import MedicalRecordViewer from "../components/MedicalRecordViewer";
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

const isImageFile = (f) => {
  if (f.type && f.type.startsWith("image")) return true;
  return /\.(avif|bmp|gif|heic|heif|ico|jpe?g|jp2|jpf|jpm|jpx|png|svg|tif?f|webp)$/i.test(
    f.name || f.originalName || "",
  );
};

const isPdfFile = (f) =>
  Boolean(f?.type?.toLowerCase().includes("pdf")) ||
  /\.pdf$/i.test(f?.name || f?.originalName || "");

const getPreviewUrl = (f) => {
  const url = f.previewUrl || f.url;
  if (url && /^https:\/\/spacebyte\.in\//i.test(url)) {
    const token = localStorage.getItem("token");
    return `/api/storage/proxy?url=${encodeURIComponent(url)}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
  }
  if (url) return url;
  return f.storageKey ? `/files/${encodeURIComponent(f.storageKey)}` : "";
};

const CustomCombobox = ({
  options,
  value,
  onChange,
  placeholder,
  getOptionLabel,
  getOptionValue,
  className = "",
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => getOptionValue(o) === value) || null;
  const display = selected ? getOptionLabel(selected) : search;

  const filtered = useMemo(() => {
    if (!search) return options;
    return options.filter((o) =>
      getOptionLabel(o).toLowerCase().includes(search.toLowerCase()),
    );
  }, [options, search, getOptionLabel]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          className={`input-field pl-10 pr-10 ${disabled ? "bg-gray-50 text-gray-500" : ""}`}
          placeholder={placeholder}
          value={display}
          disabled={disabled}
          required={required && !value}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        />
        {value && !disabled && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              setSearch("");
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform"
          style={{ transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)` }}
        />
      </div>
      {isOpen && !disabled && (
        <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              No matching patients
            </div>
          ) : (
            filtered.map((o) => {
              const ov = getOptionValue(o);
              const ol = getOptionLabel(o);
              const selected = ov === value;
              return (
                <div
                  key={ov}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(ov);
                    setSearch("");
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-primary/5 ${
                    selected ? "bg-primary/10 text-primary font-semibold" : "text-gray-700"
                  }`}
                >
                  {ol}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const RecordForm = ({
  mode,
  record,
  patientOptions,
  onCancel,
  onSubmit,
  onUpload,
  canEditPatient = true,
}) => {
  const isEdit = mode === "edit";
  const initialPatient = record?.patientId || "";
  const initialAttachments =
    record?.attachments?.map((a) => ({
      ...a,
      status: "saved",
      previewUrl: a.url || (a.storageKey ? `/files/${encodeURIComponent(a.storageKey)}` : ""),
    })) || [];

  const [patientId, setPatientId] = useState(initialPatient);
  const [visitType, setVisitType] = useState(record?.visitType || "Check-up");
  const [date, setDate] = useState(
    record?.date
      ? new Date(record.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );
  const [diagnosis, setDiagnosis] = useState(record?.diagnosis || "");
  const [treatment, setTreatment] = useState(record?.treatment || "");
  const [notes, setNotes] = useState(record?.notes || "");
  const [followUpDate, setFollowUpDate] = useState(
    record?.followUpDate
      ? new Date(record.followUpDate).toISOString().split("T")[0]
      : "",
  );
  const [bp, setBp] = useState(record?.vitalSigns?.bloodPressure || "");
  const [hr, setHr] = useState(record?.vitalSigns?.heartRate || "");
  const [temp, setTemp] = useState(record?.vitalSigns?.temperature || "");
  const [height, setHeight] = useState(record?.vitalSigns?.height || "");
  const [weight, setWeight] = useState(record?.vitalSigns?.weight || "");
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const fileInputRef = useState(null)[0];

  const selectedPatient = patientOptions.find((p) => p.id === patientId) || null;
  const uploadable = attachments.filter((a) => a.status !== "saved");

  const buildVitalSigns = () => {
    const obj = {};
    if (bp) obj.bloodPressure = bp;
    if (hr !== "") obj.heartRate = Number(hr);
    if (temp !== "") obj.temperature = String(temp);
    if (height) obj.height = String(height);
    if (weight) obj.weight = String(weight);
    return obj;
  };

  const preparePayloadAttachments = (source = attachments) => {
    const saved = source.filter((a) => Boolean(a.storageKey) || Boolean(a.url));
    const skipped = source.length - saved.length;
    if (skipped > 0) {
      toast(
        (t) => (
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-800">
              <b>{skipped} file{skipped === 1 ? "" : "s"}</b> could not be uploaded and were
              skipped. The record will be created without them. You can edit the record
              after save and retry uploads.
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="ml-1 text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        ),
        { icon: null, duration: 8000 },
      );
    }
    return saved.map((a) => ({
      storageKey: a.storageKey || "",
      name: a.name,
      originalName: a.originalName || a.name,
      size: a.size ? Number(a.size) : undefined,
      type: a.type || "",
      url: a.url || null,
    }));
  };

  const addLocalFiles = (files) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    const withMeta = arr.map((f) => {
      const isImg = isImageFile(f);
      let previewUrl = "";
      if ((isImg || isPdfFile(f)) && typeof URL !== "undefined") {
        try { previewUrl = URL.createObjectURL(f); } catch {}
      }
      return {
        originalName: f.name,
        name: f.name,
        size: f.size,
        type: f.type,
        file: f,
        status: "pending",
        previewUrl,
      };
    });
    setAttachments((prev) => [...prev, ...withMeta]);
    if (!selectedPreview) {
      const firstPreviewable = withMeta.find((file) => isImageFile(file) || isPdfFile(file));
      if (firstPreviewable) setSelectedPreview(firstPreviewable);
    }
  };

  const handleFileChange = (e) => {
    addLocalFiles(e.target.files);
    e.target.value = "";
  };

  const removeAttachment = (idx) => {
    const att = attachments[idx];
    if (att?.previewUrl && att?.file) {
      try { URL.revokeObjectURL(att.previewUrl); } catch {}
    }
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const uploadPending = async () => {
    if (uploadable.length === 0) return attachments;
    if (!patientId) {
      toast.error("Please select a patient before uploading documents");
      return attachments;
    }

    // Validate file objects BEFORE sending — bail out early with clear error
    const withFiles = uploadable.filter((a) => a.file instanceof File || a.file instanceof Blob);
    if (withFiles.length === 0) {
      const diagnostics = uploadable.map((a, i) => ({
        i,
        hasFile: Boolean(a.file),
        fileType: a.file ? Object.prototype.toString.call(a.file) : "—",
        fileName: a.file?.name || a.name || a.originalName,
        status: a.status,
      }));
      console.error("[UPLOAD] No valid File/Blob objects found:", diagnostics);
      toast.error(
        "File objects lost — please re-add the files to the record and try uploading again",
        { duration: 6000 },
      );
      return attachments;
    }

    setUploading(true);
    try {
      const form = new FormData();
      withFiles.forEach((a) => {
        console.log("[UPLOAD] Appending file:", {
          name: a.file.name,
          size: a.file.size,
          type: a.file.type,
        });
        form.append("files", a.file, a.file.name || a.originalName || a.name || "file");
      });
      form.append("patientId", patientId);
      form.append("recordId", isEdit ? record.id : "pending-new");
      if (selectedPatient?.name) {
        form.append("patientName", selectedPatient.name);
      }

      // Debug: enumerate everything in FormData so we can confirm payload in console
      if (typeof form.entries === "function") {
        const dump = [];
        for (const [k, v] of form.entries()) {
          dump.push({
            key: k,
            type: typeof v,
            isFile: v instanceof File,
            name: v?.name,
            size: v?.size,
            value: typeof v === "string" ? v : `[File ${v?.name || ""}]`,
          });
        }
        console.log("[UPLOAD] FormData contents:", dump);
      }

      // Try multiple endpoint paths in order (handles different reverse-proxy configurations)
      const candidatePaths = [
        "/api/storage/upload",
        "/storage/upload",
        "/graphql/storage/upload",
      ];
      let data = null;
      let lastErr = null;
      for (const urlPath of candidatePaths) {
        try {
          const res = await api.post(urlPath, form, { timeout: 180000 });
          data = res.data || {};
          console.log("[UPLOAD] success on path:", urlPath, data);
          break;
        } catch (e) {
          const status = e?.response?.status;
          lastErr = e;
          console.warn("[UPLOAD] path failed:", urlPath, "status:", status, "msg:", e?.message);
          // 404 → try next path; anything else → rethrow (e.g. 401, 413, 500)
          if (status !== 404) {
            throw e;
          }
        }
      }
      if (!data) {
        throw lastErr || new Error("Upload endpoint not available");
      }

      const uploaded = data.attachments || [];
      const remainingUploads = [...uploaded];
      const newAttachments = [...attachments].map((a) => {
        if (a.status === "pending") {
          const uploadIndex = remainingUploads.findIndex(
            (up) => up.originalName === (a.file?.name || a.originalName || a.name),
          );
          const up = uploadIndex >= 0 ? remainingUploads.splice(uploadIndex, 1)[0] : null;
          if (!up) return a;
          if (a?.previewUrl && a?.file) {
            try { URL.revokeObjectURL(a.previewUrl); } catch {}
          }
          return {
            ...up,
            status: "saved",
            previewUrl: up.url || (up.storageKey ? `/files/${encodeURIComponent(up.storageKey)}` : ""),
          };
        }
        return a;
      });
      if (Array.isArray(data.failed) && data.failed.length > 0) {
        const failedNames = data.failed.map((item) => item.name).filter(Boolean).join(", ");
        toast.error(
          `${data.failed.length} file${data.failed.length === 1 ? "" : "s"} could not be uploaded${failedNames ? `: ${failedNames}` : ""}`,
          { duration: 8000 },
        );
      }
      if (selectedPreview) {
        const previewName = selectedPreview.file?.name || selectedPreview.originalName || selectedPreview.name;
        const replacement = newAttachments.find(
          (attachment) => attachment.originalName === previewName,
        );
        if (replacement) setSelectedPreview(replacement);
      }
      setAttachments(newAttachments);
      return newAttachments;
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Upload failed";
      toast.error("Failed to upload documents: " + msg, { duration: 6000 });
      return attachments;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) {
      toast.error("Please select a patient");
      return;
    }
    const uploadedAttachments = await uploadPending();
    const vitalSigns = buildVitalSigns();
    onSubmit({
      mode,
      patientId,
      visitType,
      date,
      diagnosis,
      treatment,
      notes,
      followUpDate,
      vitalSigns,
      attachments: preparePayloadAttachments(uploadedAttachments),
      record,
      selectedPatient,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient Name * <span className="text-gray-400 font-normal">(type to search)</span>
          </label>
          <CustomCombobox
            options={patientOptions}
            value={patientId}
            onChange={setPatientId}
            placeholder="Search by patient name, phone, or ID..."
            getOptionLabel={(p) =>
              `${p.name}${p.phone ? ` (${p.phone})` : ""}${p.patientId ? ` - ${p.patientId}` : ""}${p.bloodGroup ? ` · ${p.bloodGroup}` : ""}`
            }
            getOptionValue={(p) => p.id}
            required
            disabled={!canEditPatient}
          />
        </div>

        {selectedPatient && (
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-br from-primary/5 to-white border border-primary/20 rounded-xl">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-primary" />
              <div>
                <p className="text-[11px] text-gray-500">Patient ID</p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedPatient.patientId || "—"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Gender / Age</p>
              <p className="text-sm font-semibold text-gray-900">
                {selectedPatient.gender || "—"}
                {selectedPatient.dateOfBirth && (
                  <span className="ml-2 text-gray-600 normal-case font-normal">
                    (
                    {Math.floor(
                      (Date.now() - new Date(selectedPatient.dateOfBirth).getTime()) /
                        (365.25 * 24 * 60 * 60 * 1000),
                    )}{" "}
                    yrs)
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Blood Group</p>
              <p className="text-sm font-semibold text-gray-900">
                {selectedPatient.bloodGroup || "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Contact</p>
              <p className="text-sm font-semibold text-gray-900 break-all">
                {selectedPatient.phone || selectedPatient.email || "—"}
              </p>
            </div>
            {selectedPatient?.medicalHistory?.allergies?.length > 0 && (
              <div className="md:col-span-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wide">Known Allergies</p>
                  <p className="text-sm text-gray-700">
                    {selectedPatient.medicalHistory.allergies.join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visit Type *
          </label>
          <select
            value={visitType}
            onChange={(e) => setVisitType(e.target.value)}
            className="input-field"
            required
          >
            <option value="Check-up">Check-up / Routine</option>
            <option value="Treatment">Treatment</option>
            <option value="Consultation">Consultation</option>
            <option value="Follow-up">Follow-up Visit</option>
            <option value="Emergency">Emergency</option>
            <option value="Surgery">Surgery / Procedure</option>
            <option value="Imaging">Imaging / X-Ray</option>
            <option value="Lab">Lab / Diagnostic</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Visit *
          </label>
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Stethoscope size={14} className="text-primary" /> Diagnosis / Findings *
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., Chronic generalized periodontitis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <FileText size={14} className="text-primary" /> Treatment / Plan *
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., Scaling & root planing"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Heart size={16} className="text-primary" /> Vital Signs
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              BP (mmHg)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="120/80"
              value={bp}
              onChange={(e) => setBp(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Height (cm)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Weight (kg)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Heart Rate
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="72"
              value={hr}
              onChange={(e) => setHr(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Temp (°F)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="98.6"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Clinical Notes
        </label>
        <textarea
          className="input-field min-h-[90px]"
          rows={3}
          placeholder="Detailed notes, observations, patient response..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Follow-up Date
          </label>
          <input
            type="date"
            className="input-field"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Paperclip size={16} className="text-primary" />
            Documents / Reports / X-Rays
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {attachments.length} file{attachments.length === 1 ? "" : "s"}
            </span>
            {uploadable.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle size={11} /> {uploadable.length} pending upload
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={uploadPending}
            disabled={uploadable.length === 0 || uploading}
            className="text-sm px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Upload Pending
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            addLocalFiles(e.dataTransfer.files);
          }}
          onClick={() => {
            const input = document.getElementById("mr-files-input");
            input?.click();
          }}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 bg-gray-50/50 hover:border-primary/60 hover:bg-primary/5"
          }`}
        >
          <Upload size={28} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">
            Click to choose files or drag & drop here
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Upload X-rays, reports, prescriptions, lab results, images, PDFs, etc.
            (Multiple files allowed)
          </p>
          <input
            id="mr-files-input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
        </div>

        {attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attachments.map((att, idx) => {
              const img = isImageFile(att);
              const previewUrl = getPreviewUrl(att);
              return (
                <div
                  key={att.previewUrl || att.storageKey || idx}
                  className="relative border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-primary/40 transition-colors"
                >
                  <div className="h-28 bg-gray-100 relative overflow-hidden">
                    {img && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={att.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {fileTypeIcon(att.type, att.originalName || att.name)}
                      </div>
                    )}
                    {att.status === "pending" && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
                          <Upload size={12} /> Pending Upload
                        </span>
                      </div>
                    )}
                    {att.status === "saved" && (
                      <div className="absolute top-2 left-2 bg-green-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <Check size={10} /> SAVED
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg flex items-center justify-center shadow"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate" title={att.name || att.originalName}>
                      {att.name || att.originalName || "Document"}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500">
                      <span>{formatSize(att.size)}</span>
                      {previewUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPreview(att);
                          }}
                          className="text-primary hover:underline flex items-center gap-0.5"
                        >
                          <Eye size={11} />
                          Preview
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {selectedPreview && getPreviewUrl(selectedPreview) && (
          <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <div className="px-3 py-2 border-b border-gray-200 bg-white flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {selectedPreview.name || selectedPreview.originalName || "Preview"}
              </p>
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="text-gray-500 hover:text-gray-800 p-1 rounded"
                title="Close preview"
              >
                <X size={15} />
              </button>
            </div>
            {isImageFile(selectedPreview) ? (
              <div className="p-3 flex justify-center max-h-[32rem] overflow-auto">
                <img
                  src={getPreviewUrl(selectedPreview)}
                  alt={selectedPreview.name || selectedPreview.originalName || "Image preview"}
                  className="max-w-full max-h-[30rem] object-contain rounded"
                />
              </div>
            ) : isPdfFile(selectedPreview) ? (
              <iframe
                src={getPreviewUrl(selectedPreview)}
                title={selectedPreview.name || "PDF preview"}
                className="w-full h-[32rem] bg-white"
              />
            ) : null}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="btn-outline disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploading}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isEdit ? (
            <Edit3 size={18} />
          ) : (
            <Plus size={18} />
          )}
          {isEdit
            ? (uploading ? "Uploading..." : "Update Medical Record")
            : (uploading ? "Uploading..." : "Create Medical Record")}
        </button>
      </div>
    </form>
  );
};

const MedicalRecords = () => {
  const { user } = useAuth();
  const client = useApolloClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewerRecord, setViewerRecord] = useState(null);

  const { loading, error, data } = useQuery(GET_MEDICAL_RECORDS, {
    fetchPolicy: "network-only",
  });
  const { data: patientsData } = useQuery(GET_PATIENTS, {
    variables: { limit: 200 },
  });

  const [createMedicalRecord] = useMutation(CREATE_MEDICAL_RECORD, {
    refetchQueries: [{ query: GET_MEDICAL_RECORDS }],
  });
  const [updateMedicalRecord] = useMutation(UPDATE_MEDICAL_RECORD, {
    refetchQueries: [{ query: GET_MEDICAL_RECORDS }],
  });
  const [deleteMedicalRecord] = useMutation(DELETE_MEDICAL_RECORD, {
    refetchQueries: [{ query: GET_MEDICAL_RECORDS }],
  });

  const canWrite = user.role === "admin" || user.role === "doctor";

  if (loading) return <Preloader />;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const medicalRecords = data?.getMedicalRecords || [];
  const patients = patientsData?.getPatients?.patients || [];

  const filteredRecords = medicalRecords.filter((rec) => {
    const matchesSearch =
      rec.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.diagnosis || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (rec.treatment || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (rec.patient?.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.patient?.patientId || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || rec.visitType === filterType;
    return matchesSearch && matchesType;
  });

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setShowCreateForm(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setShowCreateForm(true);
  };

  const handleDeleteRecord = async (record) => {
    try {
      await deleteMedicalRecord({ variables: { id: record.id } });
      toast.success("Medical record deleted");
      if (viewerRecord?.id === record.id) setViewerRecord(null);
    } catch (e) {
      toast.error("Delete failed: " + e.message);
    }
  };

  const handleSubmitForm = async ({
    mode,
    patientId,
    visitType,
    date,
    diagnosis,
    treatment,
    notes,
    followUpDate,
    vitalSigns,
    attachments,
    selectedPatient,
    record,
  }) => {
    try {
      if (mode === "create") {
        await createMedicalRecord({
          variables: {
            patientId,
            patientName: selectedPatient?.name || "Unknown",
            doctorId: user.id,
            doctorName: user.name,
            date,
            visitType,
            diagnosis,
            treatment,
            prescriptions: [],
            notes,
            followUpDate: followUpDate || null,
            vitalSigns,
            attachments,
          },
        });
        toast.success("Medical record created successfully!");
      } else {
        await updateMedicalRecord({
          variables: {
            id: record.id,
            visitType,
            diagnosis,
            treatment,
            prescriptions: record.prescriptions || [],
            notes,
            followUpDate: followUpDate || null,
            vitalSigns,
            attachments,
          },
        });
        toast.success("Medical record updated successfully!");
      }
      setShowCreateForm(false);
      setEditingRecord(null);
    } catch (e) {
      const reason =
        e?.graphQLErrors?.map((x) => x.message).join("; ") ||
        e?.networkError?.result?.errors?.map((x) => x.message).join("; ") ||
        e?.message ||
        "unknown error";
      toast.error(
        (mode === "create" ? "Failed to create record" : "Failed to update record") +
          ": " + reason,
        { duration: 6000 },
      );
    }
  };

  const handleDownloadRecord = (record) => {
    setViewerRecord(record);
    toast.success("Opening record details");
  };

  return (
    <Suspense fallback={<Preloader />}>
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div {...fadeIn("down")} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                Medical Records
              </h1>
              <p className="text-gray-600">
                View, create and manage patient medical records & documents
              </p>
            </div>
            {canWrite && (
              <button
                onClick={handleOpenCreate}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                New Record
              </button>
            )}
          </div>
        </motion.div>

        {showCreateForm && (
          <motion.div {...fadeIn("up", 0.1)} className="card mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent px-6 py-4 -mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6 rounded-t-lg flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                  <FileText size={22} />
                  {editingRecord ? "Update Medical Record" : "Create New Medical Record"}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Fill the details and attach all reports, X-rays, or documents
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingRecord(null);
                }}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg p-2"
              >
                <X size={20} />
              </button>
            </div>

            <RecordForm
              mode={editingRecord ? "edit" : "create"}
              record={editingRecord}
              patientOptions={patients}
              canEditPatient={!editingRecord}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingRecord(null);
              }}
              onSubmit={handleSubmitForm}
            />
          </motion.div>
        )}

        <motion.div {...fadeIn("up", 0.2)} className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by patient, phone, ID, diagnosis, or treatment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
              >
                <option value="All">All Visit Types</option>
                <option value="Check-up">Check-up</option>
                <option value="Treatment">Treatment</option>
                <option value="Consultation">Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Emergency">Emergency</option>
                <option value="Surgery">Surgery / Procedure</option>
                <option value="Imaging">Imaging / X-Ray</option>
                <option value="Lab">Lab / Diagnostic</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, index) => (
              <motion.div
                key={record.id}
                {...fadeIn("up", index * 0.05)}
                className={`card card-hover relative overflow-hidden ${
                  selectedRecord?.id === record.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedRecord(record)}
              >
                {record.attachments?.length > 0 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[11px] font-medium">
                    <Paperclip size={11} /> {record.attachments.length} docs
                  </div>
                )}

                <div className="flex items-start justify-between mb-4 pr-12">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <FileText size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-gray-900 leading-tight">
                        {record.visitType || "Medical Record"}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <User size={13} className="text-gray-400" />
                        <p className="text-sm text-gray-700 font-medium">
                          {record.patientName}
                        </p>
                      </div>
                      {record.patient?.patientId && (
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Shield size={10} /> ID: {record.patient.patientId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>
                      {new Date(record.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Stethoscope size={14} />
                    <span className="line-clamp-1">Dr. {record.doctorName}</span>
                  </div>
                </div>

                {record.diagnosis && (
                  <div className="p-3 bg-primary/5 rounded-lg mb-2">
                    <p className="text-[11px] font-semibold text-primary/80 uppercase tracking-wide mb-0.5">
                      Diagnosis
                    </p>
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {record.diagnosis}
                    </p>
                  </div>
                )}
                {record.treatment && (
                  <div className="p-3 bg-accent/5 rounded-lg mb-4">
                    <p className="text-[11px] font-semibold text-accent/80 uppercase tracking-wide mb-0.5">
                      Treatment
                    </p>
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {record.treatment}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewerRecord(record);
                    }}
                    className="btn-outline flex-1 !py-1.5 !px-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} /> View
                  </button>
                  {canWrite && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRecord(record);
                          setViewerRecord(null);
                        }}
                        className="btn-outline flex-1 !py-1.5 !px-2 text-xs flex items-center justify-center gap-1.5 !border-primary/30 !text-primary hover:!bg-primary/5"
                      >
                        <Edit3 size={14} /> Update
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadRecord(record);
                        }}
                        className="btn-outline !py-1.5 !px-2 text-xs flex items-center justify-center gap-1.5"
                        title="Download / Attachments"
                      >
                        <Download size={14} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div {...fadeIn("up")} className="col-span-full card text-center py-12">
              <FileText size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                No medical records found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== "All"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first medical record"}
              </p>
              {canWrite && (
                <button
                  onClick={handleOpenCreate}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={18} /> Create First Record
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {viewerRecord && (
          <MedicalRecordViewer
            record={viewerRecord}
            onClose={() => setViewerRecord(null)}
            onEdit={(rec) => {
              setViewerRecord(null);
              setShowCreateForm(true);
              setEditingRecord(rec);
            }}
            onDelete={canWrite ? handleDeleteRecord : undefined}
          />
        )}
      </div>
    </Suspense>
  );
};

export default MedicalRecords;
