import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { parseDate } from './dateUtils'
import { CLINIC_INFO, BRAND } from './prescriptionConfig'

const loadImage = (url) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })

const formatPrescriptionDate = (dateInput) => {
  const date = parseDate(dateInput) || new Date()
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatPrescriptionTime = (dateInput) => {
  const date = parseDate(dateInput) || new Date()
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const buildFilename = (prescription) => {
  const patientName = (prescription.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_')
  const date = parseDate(prescription.date) || new Date()
  const dateStr =
    String(date.getDate()).padStart(2, '0') +
    String(date.getMonth() + 1).padStart(2, '0') +
    date.getFullYear()
  return `Prescription_${patientName}_${dateStr}.pdf`
}

export async function generatePrescriptionPDF(prescription, { save = true } = {}) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  const [r, g, b] = BRAND.primaryRgb
  const [lr, lg, lb] = BRAND.secondaryRgb

  const logoImg = await loadImage('/icons.svg')

  // Outer decorative border
  pdf.setDrawColor(r, g, b)
  pdf.setLineWidth(0.8)
  pdf.roundedRect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8, 3, 3, 'S')
  pdf.setLineWidth(0.3)
  pdf.setDrawColor(lr, lg, lb)
  pdf.roundedRect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4, 2, 2, 'S')

  // Watermark
  pdf.setTextColor(245, 248, 252)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(72)
  pdf.text('Rx', pageWidth / 2, pageHeight / 2 + 10, { align: 'center', angle: -35 })

  // Header band
  pdf.setFillColor(r, g, b)
  pdf.roundedRect(margin, margin, contentWidth, 38, 2, 2, 'F')

  if (logoImg) {
    pdf.addImage(logoImg, 'PNG', margin + 6, margin + 6, 26, 26)
  }

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(CLINIC_INFO.name, pageWidth - margin - 6, margin + 14, { align: 'right' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.text(CLINIC_INFO.tagline, pageWidth - margin - 6, margin + 20, { align: 'right' })
  pdf.text(`${CLINIC_INFO.address}, ${CLINIC_INFO.city}`, pageWidth - margin - 6, margin + 26, { align: 'right' })
  pdf.text(`Tel: ${CLINIC_INFO.phone}  |  ${CLINIC_INFO.email}`, pageWidth - margin - 6, margin + 32, { align: 'right' })

  let y = margin + 48

  // Meta bar
  pdf.setFillColor(lr, lg, lb)
  pdf.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F')

  const rxId = prescription.id
    ? `RX-${String(prescription.id).slice(-8).toUpperCase()}`
    : 'RX-NEW'

  pdf.setTextColor(r, g, b)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('DATE ISSUED', margin + 6, y + 5)
  pdf.text('PRESCRIPTION ID', pageWidth - margin - 6, y + 5, { align: 'right' })

  pdf.setTextColor(40, 40, 40)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`${formatPrescriptionDate(prescription.date)}  •  ${formatPrescriptionTime(prescription.date)}`, margin + 6, y + 11)
  pdf.text(rxId, pageWidth - margin - 6, y + 11, { align: 'right' })

  y += 22

  // Patient & doctor row
  pdf.setFillColor(248, 250, 252)
  pdf.roundedRect(margin, y, contentWidth * 0.58, 28, 2, 2, 'F')
  pdf.roundedRect(margin + contentWidth * 0.62, y, contentWidth * 0.38, 28, 2, 2, 'F')

  pdf.setTextColor(r, g, b)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('PATIENT', margin + 6, y + 7)
  pdf.text('PRESCRIBING DOCTOR', margin + contentWidth * 0.62 + 6, y + 7)

  pdf.setTextColor(30, 30, 30)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text(prescription.patientName || '—', margin + 6, y + 15)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  const patientMeta = [
    prescription.age ? `Age: ${prescription.age}` : null,
    prescription.sex || prescription.gender ? `Sex: ${prescription.sex || prescription.gender}` : null,
    prescription.phone ? `Ph: ${prescription.phone}` : null,
  ]
    .filter(Boolean)
    .join('   •   ')
  pdf.text(patientMeta || 'Dental Patient', margin + 6, y + 22)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text(`Dr. ${prescription.doctorName || '—'}`, margin + contentWidth * 0.62 + 6, y + 15)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.text('BDS, MDS — Dental Surgeon', margin + contentWidth * 0.62 + 6, y + 21)
  pdf.text('Reg. No: DDS-123456', margin + contentWidth * 0.62 + 6, y + 26)

  y += 36

  // Diagnosis
  if (prescription.diagnosis) {
    pdf.setFillColor(227, 242, 253)
    pdf.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F')
    pdf.setTextColor(r, g, b)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text('DIAGNOSIS', margin + 6, y + 6)
    pdf.setTextColor(40, 40, 40)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    const diagnosisLines = pdf.splitTextToSize(prescription.diagnosis, contentWidth - 50)
    pdf.text(diagnosisLines, margin + 38, y + 6)
    y += Math.max(14, diagnosisLines.length * 5 + 6)
    y += 6
  }

  // Rx symbol + medications title
  pdf.setTextColor(r, g, b)
  pdf.setFont('times', 'bold')
  pdf.setFontSize(28)
  pdf.text('℞', margin, y + 4)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('PRESCRIBED MEDICATIONS', margin + 14, y + 2)

  pdf.setDrawColor(lr, lg, lb)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y + 6, pageWidth - margin, y + 6)

  y += 10

  const tableData = (prescription.medications || []).map((med, index) => [
    String(index + 1),
    med.name || '—',
    med.dosage || '—',
    med.frequency || '—',
    med.duration || '—',
    med.instructions || '—',
  ])

  autoTable(pdf, {
    startY: y,
    head: [['#', 'Medicine', 'Dose', 'Frequency', 'Duration', 'Instructions']],
    body: tableData.length ? tableData : [['—', 'No medications listed', '', '', '', '']],
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      lineColor: [220, 230, 240],
      lineWidth: 0.3,
      textColor: [40, 40, 40],
      valign: 'middle',
    },
    headStyles: {
      fillColor: BRAND.primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold', textColor: BRAND.primaryRgb },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
      4: { cellWidth: 22 },
      5: { cellWidth: 'auto' },
    },
  })

  y = pdf.lastAutoTable.finalY + 10

  // Notes
  if (prescription.notes) {
    if (y > pageHeight - 70) {
      pdf.addPage()
      y = margin + 10
    }
    pdf.setFillColor(255, 251, 235)
    pdf.setDrawColor(251, 191, 36)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD')
    pdf.setTextColor(180, 83, 9)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.text("DOCTOR'S NOTES", margin + 6, y + 6)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(9)
    pdf.setTextColor(80, 60, 20)
    const noteLines = pdf.splitTextToSize(prescription.notes, contentWidth - 12)
    pdf.text(noteLines, margin + 6, y + 12)
    y += Math.max(18, noteLines.length * 4.5 + 10)
  }

  // Signature & stamp area
  const signY = pageHeight - 52

  pdf.setFillColor(lr, lg, lb)
  pdf.roundedRect(margin, signY - 4, 55, 22, 2, 2, 'F')
  pdf.setTextColor(r, g, b)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.text('VALID FOR', margin + 6, signY + 2)
  pdf.setFontSize(14)
  pdf.text(`${CLINIC_INFO.validityDays} DAYS`, margin + 6, signY + 10)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text('From date of issue', margin + 6, signY + 16)

  pdf.setDrawColor(180, 180, 180)
  pdf.setLineWidth(0.4)
  pdf.line(pageWidth - margin - 65, signY + 10, pageWidth - margin, signY + 10)
  pdf.setTextColor(100, 100, 100)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('Authorized Signature', pageWidth - margin - 32, signY + 16, { align: 'center' })
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(40, 40, 40)
  pdf.text(`Dr. ${prescription.doctorName || '—'}`, pageWidth - margin - 32, signY + 22, { align: 'center' })

  // Footer
  pdf.setFillColor(r, g, b)
  pdf.rect(0, pageHeight - 14, pageWidth, 14, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text(
    `This is a computer-generated prescription from ${CLINIC_INFO.name}. Please retain for your medical records.`,
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  )

  const filename = buildFilename(prescription)
  if (save) {
    pdf.save(filename)
  }

  return { pdf, filename }
}

export default generatePrescriptionPDF
