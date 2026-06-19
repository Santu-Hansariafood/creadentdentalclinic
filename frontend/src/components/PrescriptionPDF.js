import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { parseDate, formatDate } from "../utils/dateUtils";
import { CLINIC_INFO } from "../utils/prescriptionConfig";

const LOGO_PATH = "/logo/logo.png";
const MARGIN = 18;

const text = (value, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s || fallback;
};

const getRxId = (prescription) =>
  prescription.id
    ? `RX-${String(prescription.id).slice(-8).toUpperCase()}`
    : "RX-NEW";

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

const buildQrDataUrl = async (prescription) => {
  const payload = [
    CLINIC_INFO.name,
    getRxId(prescription),
    text(prescription.patientName),
    text(prescription.doctorName),
    formatDate(prescription.date),
  ].join(" | ");

  try {
    return await QRCode.toDataURL(payload, {
      width: 120,
      margin: 0,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch {
    return null;
  }
};

const drawLine = (pdf, x1, y1, x2, y2) => {
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(x1, y1, x2, y2);
};

export async function generatePrescriptionPDF(
  prescription,
  { save = true } = {},
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const rxId = getRxId(prescription);

  const [logoDataUrl, qrDataUrl] = await Promise.all([
    loadLogoDataUrl(),
    buildQrDataUrl(prescription),
  ]);

  let y = MARGIN;

  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, "PNG", MARGIN, y, 22, 22);
  }

  const headerX = logoDataUrl ? MARGIN + 28 : MARGIN;
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(CLINIC_INFO.name, headerX, y + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`${CLINIC_INFO.address}, ${CLINIC_INFO.city}`, headerX, y + 14);
  pdf.text(
    `Tel: ${CLINIC_INFO.phone}  |  Email: ${CLINIC_INFO.email}`,
    headerX,
    y + 19,
  );

  if (qrDataUrl) {
    pdf.addImage(qrDataUrl, "PNG", pageWidth - MARGIN - 22, y, 22, 22);
  }

  y += 30;
  drawLine(pdf, MARGIN, y, pageWidth - MARGIN, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Date:", MARGIN, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(formatDate(prescription.date), MARGIN + 18, y);

  pdf.setFont("helvetica", "bold");
  pdf.text("Rx No:", pageWidth - MARGIN - 45, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(rxId, pageWidth - MARGIN - 28, y);

  y += 7;
  pdf.setFont("helvetica", "bold");
  pdf.text("Patient:", MARGIN, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(text(prescription.patientName), MARGIN + 22, y);

  pdf.setFont("helvetica", "bold");
  pdf.text("Doctor:", pageWidth - MARGIN - 55, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Dr. ${text(prescription.doctorName)}`, pageWidth - MARGIN - 38, y);

  y += 8;
  drawLine(pdf, MARGIN, y, pageWidth - MARGIN, y);
  y += 8;

  if (prescription.diagnosis) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Diagnosis:", MARGIN, y);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(
      text(prescription.diagnosis),
      contentWidth - 28,
    );
    pdf.text(lines, MARGIN + 26, y);
    y += lines.length * 5 + 6;
  }

  pdf.setFont("times", "bold");
  pdf.setFontSize(22);
  pdf.text("Rx", MARGIN, y + 2);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  y += 8;

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
    head: [["#", "Medicine", "Dose", "Frequency", "Duration", "Instructions"]],
    body: tableData.length
      ? tableData
      : [["-", "No medications", "", "", "", ""]],
    theme: "plain",
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 40 },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
      4: { cellWidth: 22 },
      5: { cellWidth: "auto" },
    },
  });

  y = (pdf.lastAutoTable?.finalY ?? y + 30) + 10;

  if (prescription.notes) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Notes:", MARGIN, y);
    pdf.setFont("helvetica", "normal");
    const noteLines = pdf.splitTextToSize(
      text(prescription.notes),
      contentWidth - 20,
    );
    pdf.text(noteLines, MARGIN + 18, y);
    y += noteLines.length * 5 + 8;
  }

  const signY = pageHeight - 45;
  drawLine(pdf, pageWidth - MARGIN - 60, signY, pageWidth - MARGIN, signY);
  pdf.setFontSize(9);
  pdf.text("Doctor Signature", pageWidth - MARGIN - 30, signY + 5, {
    align: "center",
  });
  pdf.setFont("helvetica", "bold");
  pdf.text(
    `Dr. ${text(prescription.doctorName)}`,
    pageWidth - MARGIN - 30,
    signY + 11,
    { align: "center" },
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(80, 80, 80);
  pdf.text(
    `This prescription has been generated electronically through the clinic management system and is maintained in the patient's digital dental records.`,
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" },
  );

  const filename = buildFilename(prescription);
  if (save) pdf.save(filename);

  return { pdf, filename };
}

export default generatePrescriptionPDF;
