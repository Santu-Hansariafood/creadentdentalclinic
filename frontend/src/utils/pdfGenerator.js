import jsPDF from 'jspdf'
import { format } from 'date-fns'

export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPosition = margin

  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('creadent dental clinic', margin, yPosition)
  
  yPosition += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('123 Medical Street, Healthcare City', margin, yPosition)
  yPosition += 5
  doc.text('Phone: (555) 123-4567 | Email: billing@dentalclinic.com', margin, yPosition)
  
  yPosition += 15
  doc.setDrawColor(0, 127, 175)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 15
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.status === 'Paid' ? 'RECEIPT' : 'INVOICE', margin, yPosition)
  
  yPosition += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, margin, yPosition)
  yPosition += 6
  doc.text(`Date: ${format(new Date(invoice.date), 'MMM dd, yyyy')}`, margin, yPosition)
  yPosition += 6
  doc.text(`Due Date: ${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}`, margin, yPosition)
  
  if (invoice.paymentDate) {
    yPosition += 6
    doc.setTextColor(16, 185, 129)
    doc.text(`Payment Date: ${format(new Date(invoice.paymentDate), 'MMM dd, yyyy')}`, margin, yPosition)
    doc.setTextColor(0, 0, 0)
  }
  
  yPosition += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', margin, yPosition)
  yPosition += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.patientName, margin, yPosition)
  
  yPosition += 15
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Description', margin, yPosition)
  doc.text('Qty', pageWidth - 80, yPosition)
  doc.text('Price', pageWidth - 60, yPosition)
  doc.text('Amount', pageWidth - margin, yPosition, { align: 'right' })
  
  yPosition += 5
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 8
  doc.setFont('helvetica', 'normal')
  
  invoice.items.forEach(item => {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }
    
    const descLines = doc.splitTextToSize(item.description, 100)
    doc.text(descLines, margin, yPosition)
    doc.text(item.quantity.toString(), pageWidth - 80, yPosition)
    doc.text(`$${item.unitPrice.toFixed(2)}`, pageWidth - 60, yPosition)
    doc.text(`$${item.total.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' })
    
    yPosition += descLines.length * 5 + 5
  })
  
  yPosition += 5
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 10
  const summaryX = pageWidth - 80
  
  doc.text('Subtotal:', summaryX, yPosition)
  doc.text(`$${invoice.subtotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' })
  
  yPosition += 6
  doc.text('Tax:', summaryX, yPosition)
  doc.text(`$${invoice.tax.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' })
  
  if (invoice.discount > 0) {
    yPosition += 6
    doc.setTextColor(16, 185, 129)
    doc.text('Discount:', summaryX, yPosition)
    doc.text(`-$${invoice.discount.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
  
  yPosition += 8
  doc.setDrawColor(0, 127, 175)
  doc.setLineWidth(0.5)
  doc.line(summaryX - 5, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Total:', summaryX, yPosition)
  doc.text(`$${invoice.total.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' })
  
  if (invoice.amountPaid > 0) {
    yPosition += 8
    doc.setFontSize(10)
    doc.setTextColor(16, 185, 129)
    doc.text('Amount Paid:', summaryX, yPosition)
    doc.text(`$${invoice.amountPaid.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' })
  }
  
  if (invoice.balance > 0) {
    yPosition += 8
    doc.setTextColor(239, 68, 68)
    doc.text('Balance Due:', summaryX, yPosition)
    doc.text(`$${invoice.balance.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
  
  if (invoice.insuranceClaim) {
    yPosition += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Insurance Claim Information:', margin, yPosition)
    yPosition += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`Provider: ${invoice.insuranceClaim.provider}`, margin, yPosition)
    yPosition += 5
    doc.text(`Claim Number: ${invoice.insuranceClaim.claimNumber}`, margin, yPosition)
    yPosition += 5
    doc.text(`Claim Amount: $${invoice.insuranceClaim.claimAmount.toFixed(2)}`, margin, yPosition)
    yPosition += 5
    doc.text(`Status: ${invoice.insuranceClaim.status}`, margin, yPosition)
  }
  
  if (invoice.paymentMethod && invoice.transactionId) {
    yPosition += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Information:', margin, yPosition)
    yPosition += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`Method: ${invoice.paymentMethod}`, margin, yPosition)
    yPosition += 5
    doc.text(`Transaction ID: ${invoice.transactionId}`, margin, yPosition)
  }
  
  if (invoice.notes) {
    yPosition += 15
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    const noteLines = doc.splitTextToSize(`Notes: ${invoice.notes}`, pageWidth - 2 * margin)
    doc.text(noteLines, margin, yPosition)
    doc.setTextColor(0, 0, 0)
  }
  
  const footerY = pageHeight - 20
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' })
  doc.text('For questions, contact us at billing@dentalclinic.com', pageWidth / 2, footerY + 4, { align: 'center' })
  
  const fileName = invoice.status === 'Paid' 
    ? `Receipt_${invoice.invoiceNumber}.pdf`
    : `Invoice_${invoice.invoiceNumber}.pdf`
  
  doc.save(fileName)
}

export const generatePaymentReceipt = (invoice, paymentDetails) => {
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = margin

  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text('PAYMENT RECEIPT', pageWidth / 2, yPosition, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  
  yPosition += 20
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Transaction Details', margin, yPosition)
  
  yPosition += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Receipt Number: ${paymentDetails.receiptNumber}`, margin, yPosition)
  yPosition += 6
  doc.text(`Transaction ID: ${paymentDetails.transactionId}`, margin, yPosition)
  yPosition += 6
  doc.text(`Payment Date: ${format(new Date(paymentDetails.date), 'MMM dd, yyyy HH:mm')}`, margin, yPosition)
  yPosition += 6
  doc.text(`Payment Method: ${paymentDetails.method}`, margin, yPosition)
  
  yPosition += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Amount Paid', margin, yPosition)
  yPosition += 10
  doc.setFontSize(20)
  doc.setTextColor(16, 185, 129)
  doc.text(`$${paymentDetails.amount.toFixed(2)}`, margin, yPosition)
  doc.setTextColor(0, 0, 0)
  
  yPosition += 20
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('This receipt confirms your payment has been successfully processed.', margin, yPosition)
  
  doc.save(`Receipt_${paymentDetails.receiptNumber}.pdf`)
}