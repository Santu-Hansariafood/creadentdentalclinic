import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatDate } from "../utils/dateUtils";
import { CLINIC_INFO } from "../utils/prescriptionConfig";

const getRxId = (prescription) =>
  prescription.id
    ? `RX-${String(prescription.id).slice(-8).toUpperCase()}`
    : "RX-NEW";

const PrescriptionDocument = ({ prescription }) => {
  const [qrSrc, setQrSrc] = useState("");

  useEffect(() => {
    if (!prescription) return;
    const payload = [
      CLINIC_INFO.name,
      getRxId(prescription),
      prescription.patientName,
      prescription.doctorName,
      formatDate(prescription.date),
    ].join(" | ");

    QRCode.toDataURL(payload, {
      width: 120,
      margin: 0,
      color: { dark: "#000", light: "#fff" },
    })
      .then(setQrSrc)
      .catch(() => setQrSrc(""));
  }, [prescription]);

  if (!prescription) return null;

  const rxId = getRxId(prescription);

  return (
    <div
      id="prescription-document"
      className="mx-auto max-w-[210mm] bg-white text-black font-serif print:shadow-none"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <div className="flex items-start justify-between border-b border-black pb-4 mb-4">
        <div className="flex items-start gap-4">
          <img
            src="/logo/logo.png"
            alt="Clinic logo"
            className="w-16 h-16 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wide">
              {CLINIC_INFO.name}
            </h1>
            <p className="text-sm mt-1">
              {CLINIC_INFO.address}, {CLINIC_INFO.city}
            </p>
            <p className="text-sm">
              Tel: {CLINIC_INFO.phone} | {CLINIC_INFO.email}
            </p>
          </div>
        </div>
        {qrSrc && (
          <img
            src={qrSrc}
            alt="Prescription QR code"
            className="w-16 h-16 border border-gray-300"
          />
        )}
      </div>

      <div className="text-sm space-y-2 border-b border-black pb-4 mb-4">
        <div className="flex justify-between gap-4">
          <p>
            <span className="font-bold">Date:</span>{" "}
            {formatDate(prescription.date)}
          </p>
          <p>
            <span className="font-bold">Rx No:</span> {rxId}
          </p>
        </div>
        <div className="flex justify-between gap-4">
          <p>
            <span className="font-bold">Patient:</span>{" "}
            {prescription.patientName}
          </p>
          <p>
            <span className="font-bold">Doctor:</span> Dr.{" "}
            {prescription.doctorName}
          </p>
        </div>
      </div>

      {prescription.diagnosis && (
        <p className="text-sm mb-4">
          <span className="font-bold">Diagnosis:</span> {prescription.diagnosis}
        </p>
      )}

      <div className="mb-6">
        <p className="text-3xl font-bold mb-3">Rx</p>
        <table className="w-full text-sm border-collapse border border-black">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black px-2 py-1.5 text-left w-8">
                #
              </th>
              <th className="border-r border-black px-2 py-1.5 text-left">
                Medicine
              </th>
              <th className="border-r border-black px-2 py-1.5 text-left">
                Dose
              </th>
              <th className="border-r border-black px-2 py-1.5 text-left">
                Frequency
              </th>
              <th className="border-r border-black px-2 py-1.5 text-left">
                Duration
              </th>
              <th className="px-2 py-1.5 text-left">Instructions</th>
            </tr>
          </thead>
          <tbody>
            {(prescription.medications || []).map((med, index) => (
              <tr key={index} className="border-t border-black">
                <td className="border-r border-black px-2 py-2 text-center">
                  {index + 1}
                </td>
                <td className="border-r border-black px-2 py-2">{med.name}</td>
                <td className="border-r border-black px-2 py-2">
                  {med.dosage}
                </td>
                <td className="border-r border-black px-2 py-2">
                  {med.frequency}
                </td>
                <td className="border-r border-black px-2 py-2">
                  {med.duration}
                </td>
                <td className="px-2 py-2 italic">{med.instructions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {prescription.notes && (
        <p className="text-sm mb-8">
          <span className="font-bold">Notes:</span>{" "}
          <span className="italic">{prescription.notes}</span>
        </p>
      )}

      <div className="flex justify-end mt-12 mb-6">
        <div className="text-center w-48">
          <div className="border-b border-black mb-1" />
          <p className="text-xs text-gray-600">Doctor Signature</p>
          <p className="text-sm font-bold mt-1">
            Dr. {prescription.doctorName}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center border-t border-gray-300 pt-3">
      This Prescription Has Been Generated Electronically Through The Creadent Dental Clinic Management System and is maintained in the patient's digital dental records.
      </p>
    </div>
  );
};

export default PrescriptionDocument;
