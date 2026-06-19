import { motion } from 'framer-motion'
import { Pill, Calendar, User, FileText, Download } from 'lucide-react'
import { fadeIn } from '../utils/motion'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'

const PrescriptionCard = ({ prescription, delay = 0 }) => {
  const handleDownload = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15
      let yPos = margin

      // Load logo - we'll use a placeholder if not available, but use /logo/logo.png
      const logoUrl = '/logo/logo.png'
      
      try {
        // Try to add logo if available
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = logoUrl
        })
        
        // Add logo at top center
        const logoWidth = 30
        const logoHeight = 30
        const logoX = (pageWidth - logoWidth) / 2
        pdf.addImage(img, 'PNG', logoX, yPos, logoWidth, logoHeight)
        yPos += logoHeight + 5
      } catch (err) {
        // If logo fails, continue without it
        console.log('Logo not available, skipping')
      }

      // Clinic Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Creadent Dental Clinic', pageWidth / 2, yPos, { align: 'center' })
      yPos += 8
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('123 Dental Street, Healthcare City', pageWidth / 2, yPos, { align: 'center' })
      yPos += 5
      pdf.text('Phone: +1 (555) 123-4567 | Email: info@creadent.com', pageWidth / 2, yPos, { align: 'center' })
      yPos += 5
      pdf.text('Website: www.creadent.com', pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      // Line separator
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 10

      // Prescription Info
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('PRESCRIPTION', pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      // Date and Prescription Number
      pdf.setFontSize(11)
      const prescriptionDate = new Date(prescription.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      pdf.text(`Prescription No: ${prescription.id}`, margin, yPos)
      pdf.text(`Date: ${prescriptionDate}`, pageWidth - margin - 60, yPos, { align: 'right' })
      yPos += 10

      // Patient and Doctor Info
      pdf.setFont('helvetica', 'bold')
      pdf.text('Patient Details:', margin, yPos)
      yPos += 7
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Name: ${prescription.patientName}`, margin + 5, yPos)
      yPos += 8

      pdf.setFont('helvetica', 'bold')
      pdf.text('Doctor:', margin, yPos)
      yPos += 7
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Dr. ${prescription.doctorName}`, margin + 5, yPos)
      yPos += 10

      // Diagnosis
      pdf.setFont('helvetica', 'bold')
      pdf.text('Diagnosis:', margin, yPos)
      yPos += 7
      pdf.setFont('helvetica', 'normal')
      pdf.text(prescription.diagnosis, margin + 5, yPos)
      yPos += 10

      // Medications Section
      pdf.setFont('helvetica', 'bold')
      pdf.text('Medications:', margin, yPos)
      yPos += 10

      pdf.setFont('helvetica', 'normal')
      prescription.medications.forEach((med, index) => {
        // Check if we need a new page
        if (yPos > 270) {
          pdf.addPage()
          yPos = margin
        }
        
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${index + 1}. ${med.name}`, margin, yPos)
        yPos += 6
        
        pdf.setFont('helvetica', 'normal')
        pdf.text(`   Dosage: ${med.dosage}`, margin, yPos)
        yPos += 6
        pdf.text(`   Frequency: ${med.frequency}`, margin, yPos)
        yPos += 6
        pdf.text(`   Duration: ${med.duration}`, margin, yPos)
        yPos += 6
        if (med.instructions) {
          pdf.text(`   Instructions: ${med.instructions}`, margin, yPos)
          yPos += 6
        }
        yPos += 4
      })

      // Doctor's Notes (if any)
      if (prescription.notes) {
        // Check page
        if (yPos > 260) {
          pdf.addPage()
          yPos = margin
        }
        
        pdf.setFont('helvetica', 'bold')
        pdf.text('Additional Notes:', margin, yPos)
        yPos += 7
        pdf.setFont('helvetica', 'normal')
        pdf.text(prescription.notes, margin + 5, yPos)
        yPos += 10
      }

      // Signature area
      // Check page
      if (yPos > 240) {
        pdf.addPage()
        yPos = margin
      }
      
      yPos = 270
      pdf.setDrawColor(100, 100, 100)
      pdf.setLineWidth(0.3)
      pdf.line(pageWidth - 100, yPos, pageWidth - margin, yPos)
      yPos += 5
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Doctor\'s Signature', pageWidth - 60, yPos, { align: 'center' })

      // Footer
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(128, 128, 128)
      pdf.text('This prescription is valid for 30 days from the date of issue.', pageWidth / 2, 290, { align: 'center' })
      pdf.text('Please keep this prescription for your records.', pageWidth / 2, 295, { align: 'center' })

      // Download the PDF
      pdf.save(`Prescription-${prescription.id}.pdf`)
      toast.success('Prescription PDF downloaded successfully!')
    } catch (err) {
      console.error('Error generating PDF:', err)
      toast.error('Failed to generate prescription PDF')
    }
  }

  return (
    <motion.div
      {...fadeIn('up', delay)}
      className="card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Pill size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-gray-900">
              Prescription #{prescription.id}
            </h3>
            <p className="text-sm text-gray-600">{prescription.diagnosis}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${
            prescription.status === 'Active' ? 'badge-success' : 'badge-info'
          }`}>
            {prescription.status}
          </span>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            title="Download Prescription"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>Prescribed: {new Date(prescription.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={16} />
          <span>Dr. {prescription.doctorName}</span>
        </div>
      </div>

      <div className="space-y-3">
        {prescription.medications.map((med, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900">{med.name}</p>
                <p className="text-sm text-gray-600">{med.dosage}</p>
              </div>
              <span className="text-xs text-gray-500">Qty: {med.quantity || 1}</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Frequency:</span> {med.frequency}</p>
              <p><span className="font-medium">Duration:</span> {med.duration}</p>
              <p className="text-gray-500 italic">{med.instructions}</p>
            </div>
          </div>
        ))}
      </div>

      {prescription.notes && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-900 mb-1">Doctor's Notes</p>
              <p className="text-xs text-blue-700">{prescription.notes}</p>
            </div>
          </div>
        </div>
      )}

      {prescription.refillsRemaining > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Refills Remaining:</span> {prescription.refillsRemaining}
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default PrescriptionCard
