import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { parseDate, formatDate, formatDateTime } from "../utils/dateUtils";
import { CLINIC_INFO, BRAND } from "../utils/prescriptionConfig";

const LOGO_PATH = "/logo/logo.png";
const MARGIN = 15;

const text = (value, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s || fallback;
};

const getRxId = (prescription) =>
  prescription.id
    ? `RX-${String(prescription.id).slice(-8).toUpperCase()}`
    : "RX-NEW";

const calculateAge = (dob) => {
  const birthDate = parseDate(dob);
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

const buildFilename = (prescription) => {
  const patientName = text(prescription.patientName, "Patient").replace(
    /[^a-zA-Z0-9]/g,
    "_",
  );
  const date = parseDate(prescription.date) || new Date();
  const dateStr =
    String(date.getDate()).padStart(2, "0") +
    String(date.getMonth() + 1).padStart(2, "0") +
    date.getFullYear();
  return `Prescription_${patientName}_${dateStr}.pdf`;
};

const loadLogoDataUrl = () =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = LOGO_PATH;
  });

const buildQrDataUrl = async (prescription, patient) => {
  const payload = [
    CLINIC_INFO.name,
    getRxId(prescription),
    `Patient: ${text(prescription.patientName)}`,
    patient?.patientId ? `ID: ${patient.patientId}` : "",
    `Doctor: ${text(prescription.doctorName)}`,
    `Date: ${formatDate(prescription.date)}`,
  ]
    .filter(Boolean)
    .join(" | ");

  try {
    return await QRCode.toDataURL(payload, {
      width: 130,
      margin: 1,
      color: { dark: BRAND.primary, light: "#ffffff" },
    });
  } catch {
    return null;
  }
};

const drawRoundedRect = (pdf, x, y, w, h, r) => {
  pdf.roundedRect(x, y, w, h, r, r, "F");
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};

export async function generatePrescriptionPDF(
  prescription,
  patient = null,
  { save = true } = {},
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const rxId = getRxId(prescription);
  const [brandR, brandG, brandB] = hexToRgb(BRAND.primary);
  const [lightR, lightG, lightB] = hexToRgb(BRAND.light);
  const [secR, secG, secB] = hexToRgb(BRAND.secondary);

  const [logoDataUrl, qrDataUrl] = await Promise.all([
    loadLogoDataUrl(),
    buildQrDataUrl(prescription, patient),
  ]);

  let y = MARGIN;

  pdf.setFillColor(lightR, lightG, lightB);
  drawRoundedRect(pdf, MARGIN, y, contentWidth, 36, 3);

  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, "PNG", MARGIN + 5, y + 4, 26, 26);
  }

  const headerX = logoDataUrl ? MARGIN + 37 : MARGIN + 8;
  pdf.setTextColor(brandR, brandG, brandB);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(CLINIC_INFO.name, headerX, y + 12);

  pdf.setTextColor(60, 60, 60);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text(CLINIC_INFO.tagline || "", headerX, y + 17);
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  pdf.text(`${CLINIC_INFO.address}, ${CLINIC_INFO.city}`, headerX, y + 21.5);
  pdf.text(
    `\u260E ${CLINIC_INFO.phone}   \u2709 ${CLINIC_INFO.email}`,
    headerX,
    y + 25.5,
  );
  if (CLINIC_INFO.website) {
    pdf.setTextColor(brandR, brandG, brandB);
    pdf.text(CLINIC_INFO.website, headerX, y + 29.5);
  }

  if (qrDataUrl) {
    pdf.setFillColor(255, 255, 255);
    drawRoundedRect(pdf, pageWidth - MARGIN - 32, y + 3, 28, 28, 2);
    pdf.addImage(qrDataUrl, "PNG", pageWidth - MARGIN - 31, y + 4, 26, 26);
  }

  y += 42;

  pdf.setFillColor(brandR, brandG, brandB);
  drawRoundedRect(pdf, MARGIN, y, contentWidth, 12, 2);

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("MEDICAL PRESCRIPTION", MARGIN + 6, y + 7.8);

  pdf.setFontSize(9);
  pdf.text(
    `Rx No: ${rxId}`,
    pageWidth - MARGIN - 6,
    y + 7.8,
    { align: "right" },
  );

  y += 20;

  pdf.setDrawColor(secR, secG, secB);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(MARGIN, y, contentWidth, 32, 2, "S");

  pdf.setFillColor(lightR, lightG, lightB);
  drawRoundedRect(pdf, MARGIN + 0.5, y + 0.5, contentWidth - 1, 6, 1.5);

  pdf.setTextColor(brandR, brandG, brandB);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.text("\uF007  PATIENT INFORMATION", MARGIN + 4, y + 4.5);

  pdf.setTextColor(255, 255, 255);
  pdf.setFillColor(brandR, brandG, brandB);
  drawRoundedRect(pdf, pageWidth - MARGIN - 52, y + 1.5, 48, 5, 1);
  pdf.setFontSize(8);
  pdf.text(
    `Date: ${formatDate(prescription.date)}`,
    pageWidth - MARGIN - 4,
    y + 4.8,
    { align: "right" },
  );

  y += 10;

  const patientIdLabel = patient?.patientId || prescription.patientId
    ? "Patient ID"
    : null;
  const patientIdValue = patient?.patientId
    ? patient.patientId
    : prescription.patientId
      ? String(prescription.patientId).slice(-8).toUpperCase()
      : null;

  const age = patient?.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;

  const infoLeft = [
    { label: "Name", value: text(prescription.patientName) },
    patientIdLabel
      ? { label: patientIdLabel, value: patientIdValue }
      : null,
    patient?.gender ? { label: "Gender", value: patient.gender } : null,
    age ? { label: "Age", value: `${age} yrs` } : null,
    patient?.phone ? { label: "Phone", value: patient.phone } : null,
  ].filter(Boolean);

  const infoRight = [
    patient?.email
      ? { label: "Email", value: patient.email }
      : null,
    patient?.dateOfBirth
      ? { label: "DOB", value: formatDate(patient.dateOfBirth) }
      : null,
    patient?.bloodGroup
      ? { label: "Blood Group", value: patient.bloodGroup }
      : null,
    patient?.address
      ? { label: "Address", value: patient.address }
      : null,
  ].filter(Boolean);

  const colWidth = (contentWidth - 12) / 2;
  const leftStartX = MARGIN + 5;
  const rightStartX = MARGIN + 5 + colWidth + 2;

  let leftY = y;
  let rightY = y;

  infoLeft.forEach((item) => {
    pdf.setTextColor(110, 110, 110);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(item.label.toUpperCase(), leftStartX, leftY);
    leftY += 3.2;
    pdf.setTextColor(10, 10, 10);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    const valText = pdf.splitTextToSize(text(item.value), colWidth - 8);
    pdf.text(valText, leftStartX, leftY);
    leftY += valText.length * 4.5 + 1;
  });

  infoRight.forEach((item) => {
    pdf.setTextColor(110, 110, 110);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(item.label.toUpperCase(), rightStartX, rightY);
    rightY += 3.2;
    pdf.setTextColor(10, 10, 10);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    const valText = pdf.splitTextToSize(text(item.value), colWidth - 8);
    pdf.text(valText, rightStartX, rightY);
    rightY += valText.length * 4.5 + 1;
  });

  y = Math.max(leftY, rightY) + 6;

  if (prescription.diagnosis) {
    pdf.setFillColor(255, 249, 230);
    drawRoundedRect(pdf, MARGIN, y, contentWidth, 14, 2);
    pdf.setTextColor(139, 105, 20);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("\u26A0  DIAGNOSIS / CLINICAL FINDINGS", MARGIN + 5, y + 6);
    y += 9;
    pdf.setTextColor(80, 60, 10);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const diagLines = pdf.splitTextToSize(
      text(prescription.diagnosis),
      contentWidth - 10,
    );
    pdf.text(diagLines, MARGIN + 5, y + 3);
    y += diagLines.length * 5 + 7;
  } else {
    y += 2;
  }

  const rxBoxY = y;
  pdf.setFillColor(brandR, brandG, brandB);
  drawRoundedRect(pdf, MARGIN, rxBoxY, 18, 18, 2.5);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("times", "bolditalic");
  pdf.setFontSize(20);
  pdf.text("Rx", MARGIN + 5.5, rxBoxY + 13.5);

  pdf.setFillColor(lightR, lightG, lightB);
  drawRoundedRect(pdf, MARGIN + 20, rxBoxY + 3, contentWidth - 25, 12, 2);
  pdf.setTextColor(brandR, brandG, brandB);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("MEDICATION ADVICE", MARGIN + 26, rxBoxY + 11);

  y = rxBoxY + 22;

  const tableData = (prescription.medications || []).map((med, i) => [
    String(i + 1),
    text(med?.name),
    text(med?.dosage),
    text(med?.frequency),
    text(med?.duration),
    text(med?.instructions, ""),
  ]);

  autoTable(pdf, {
    startY: y,
    head: [
      [
        "SL.",
        "MEDICINE NAME",
        "DOSE",
        "FREQUENCY",
        "DURATION",
        "INSTRUCTIONS",
      ],
    ],
    body: tableData.length
      ? tableData
      : [["-", "No medications prescribed", "", "", "", ""]],
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
      textColor: [20, 20, 20],
      lineColor: [secR, secG, secB],
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: [brandR, brandG, brandB],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      lineWidth: 0.3,
      lineColor: [brandR, brandG, brandB],
    },
    alternateRowStyles: {
      fillColor: [lightR, lightG, lightB],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 40, fontStyle: "bold" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 27, halign: "center" },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: "auto" },
    },
  });

  y = (pdf.lastAutoTable?.finalY ?? y + 30) + 8;

  if (y > pageHeight - 75) {
    pdf.addPage();
    y = MARGIN;
  }

  if (prescription.notes) {
    pdf.setFillColor(230, 248, 230);
    drawRoundedRect(pdf, MARGIN, y, contentWidth, 14, 2);
    pdf.setTextColor(30, 100, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("\u270E  ADDITIONAL NOTES / ADVICE", MARGIN + 5, y + 6);
    y += 9;
    pdf.setTextColor(20, 70, 20);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    const noteLines = pdf.splitTextToSize(
      text(prescription.notes),
      contentWidth - 10,
    );
    pdf.text(noteLines, MARGIN + 5, y + 3);
    y += noteLines.length * 5 + 7;
  }

  y += 3;

  pdf.setFillColor(lightR, lightG, lightB);
  drawRoundedRect(pdf, MARGIN, y, (contentWidth / 2) - 2, 10, 2);
  pdf.setTextColor(brandR, brandG, brandB);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.text("PRESCRIBED BY", MARGIN + 5, y + 6.2);
  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(
    `Dr. ${text(prescription.doctorName)}`,
    MARGIN + 5,
    y + 12,
  );
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  pdf.text("Dental Surgeon / Consultant", MARGIN + 5, y + 16);
  pdf.text(
    `Issued: ${formatDateTime(prescription.date)}`,
    MARGIN + 5,
    y + 20,
  );
  if (CLINIC_INFO.validityDays) {
    pdf.setTextColor(brandR, brandG, brandB);
    pdf.text(
      `Valid for ${CLINIC_INFO.validityDays} days from issue date`,
      MARGIN + 5,
      y + 24,
    );
  }

  const signX = MARGIN + contentWidth / 2 + 2;
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.3);
  pdf.line(signX + 10, y + 18, pageWidth - MARGIN - 5, y + 18);
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "italic");
  pdf.text(
    "Signature of Prescribing Doctor",
    signX + ((contentWidth / 2) - 12) / 2 + 10,
    y + 22,
  );
  pdf.setTextColor(brandR, brandG, brandB);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(
    `Dr. ${text(prescription.doctorName)}`,
    signX + ((contentWidth / 2) - 12) / 2 + 10,
    y + 27,
    { align: "center" },
  );
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(90, 90, 90);
  pdf.text(
    "MCI / DCI Registration Verified",
    signX + ((contentWidth / 2) - 12) / 2 + 10,
    y + 31,
    { align: "center" },
  );

  const footerY = pageHeight - 14;
  pdf.setDrawColor(secR, secG, secB);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN, footerY - 3, pageWidth - MARGIN, footerY - 3);

  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont("helvetica", "italic");
  pdf.text(
    "This is a computer-generated prescription and is valid without a physical signature. " +
      "For any queries, contact the clinic. Please complete the full course of medication as advised.",
    pageWidth / 2,
    footerY + 0.5,
    { align: "center", maxWidth: contentWidth },
  );
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(brandR, brandG, brandB);
  pdf.setFontSize(7);
  pdf.text(
    "\u00A9 " +
      new Date().getFullYear() +
      " " +
      CLINIC_INFO.name +
      "  |  Electronic Prescription Generated via Clinic Management System",
    pageWidth / 2,
    footerY + 7,
    { align: "center" },
  );

  const filename = buildFilename(prescription);
  if (save) pdf.save(filename);

  const dataUriString = pdf.output("datauristring");

  return { pdf, filename, dataUriString };
}

export default generatePrescriptionPDF;
