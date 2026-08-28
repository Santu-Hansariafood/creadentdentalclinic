import jsPDF from "jspdf";
import { format } from "date-fns";
import QRCode from "qrcode";

const formatCurrency = (amount = 0) => `Rs. ${Number(amount || 0).toFixed(2)}`;
const formatPdfDate = (value, formatStr = "MMM dd, yyyy") => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : format(date, formatStr);
};

const CLINIC = {
  name: "Creadent Multispeciality Dental Clinic",
  address:
    "BD-85, Salt Lake Rd, BD Block, Sector 1, Bidhannagar, Kolkata, West Bengal 700064",
  phone: "+91 6292300343",
  email: "creadentmultispecialitydentalc@gmail.com",
  logoUrl: "https://creadentsmiles.com/logo/logo.png",
};

const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load image");
        return response.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
};

const generateQR = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      width: 80,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("QR generation failed:", err);
    return null;
  }
};

export const generateInvoicePDF = async (invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  let logoDataUrl = null;
  try {
    logoDataUrl = await loadImage(CLINIC.logoUrl);
  } catch (e) {
    console.warn("Logo could not be loaded", e);
  }

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", margin, y, 40, 40);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(CLINIC.name, margin + 50, y + 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(CLINIC.address, margin + 50, y + 22);
    doc.text(
      `Phone: ${CLINIC.phone}  |  Email: ${CLINIC.email}`,
      margin + 50,
      y + 32,
    );
    y += 50;
  } else {
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(CLINIC.name, margin, y);
    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(CLINIC.address, margin, y);
    y += 5;
    doc.text(`Phone: ${CLINIC.phone}  |  Email: ${CLINIC.email}`, margin, y);
    y += 10;
  }

  doc.setDrawColor(0, 127, 175);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const title = invoice.status === "Paid" ? "RECEIPT" : "INVOICE";
  doc.text(title, margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const rightColX = pageWidth - margin;
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, rightColX, y - 4, {
    align: "right",
  });
  doc.text(`Date: ${formatPdfDate(invoice.date)}`, rightColX, y + 2, {
    align: "right",
  });
  doc.text(`Due Date: ${formatPdfDate(invoice.dueDate)}`, rightColX, y + 8, {
    align: "right",
  });
  if (invoice.paymentDate) {
    doc.setTextColor(16, 185, 129);
    doc.text(
      `Payment Date: ${formatPdfDate(invoice.paymentDate)}`,
      rightColX,
      y + 14,
      { align: "right" },
    );
    doc.setTextColor(0, 0, 0);
  }
  y += 20;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.patientName, margin, y);
  y += 12;

  const col1 = margin;
  const col2 = pageWidth - 100;
  const col3 = pageWidth - 70;
  const col4 = pageWidth - margin;
  doc.setFont("helvetica", "bold");
  doc.text("Description", col1, y);
  doc.text("Qty", col2, y);
  doc.text("Price", col3, y);
  doc.text("Amount", col4, y, { align: "right" });
  y += 4;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  invoice.items.forEach((item) => {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
      doc.setFont("helvetica", "bold");
      doc.text("Description", col1, y);
      doc.text("Qty", col2, y);
      doc.text("Price", col3, y);
      doc.text("Amount", col4, y, { align: "right" });
      y += 4;
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
    }
    const descLines = doc.splitTextToSize(item.description, col2 - col1 - 10);
    doc.text(descLines, col1, y);
    doc.text(item.quantity.toString(), col2, y);
    doc.text(formatCurrency(item.unitPrice), col3, y);
    doc.text(formatCurrency(item.total), col4, y, { align: "right" });
    y += descLines.length * 5 + 5;
  });

  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const summaryX = pageWidth - 80;
  doc.text("Subtotal:", summaryX, y);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - margin, y, {
    align: "right",
  });
  y += 6;
  doc.text("Tax:", summaryX, y);
  doc.text(formatCurrency(invoice.tax), pageWidth - margin, y, {
    align: "right",
  });
  y += 6;
  if (invoice.discount > 0) {
    doc.setTextColor(16, 185, 129);
    doc.text("Discount:", summaryX, y);
    doc.text(`-${formatCurrency(invoice.discount)}`, pageWidth - margin, y, {
      align: "right",
    });
    doc.setTextColor(0, 0, 0);
    y += 6;
  }

  y += 4;
  doc.setDrawColor(0, 127, 175);
  doc.line(summaryX - 5, y, pageWidth - margin, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", summaryX, y);
  doc.text(formatCurrency(invoice.total), pageWidth - margin, y, {
    align: "right",
  });

  y += 8;
  doc.setFontSize(10);
  if (invoice.amountPaid > 0) {
    doc.setTextColor(16, 185, 129);
    doc.text("Amount Paid:", summaryX, y);
    doc.text(formatCurrency(invoice.amountPaid), pageWidth - margin, y, {
      align: "right",
    });
    y += 6;
  }
  if (invoice.balance > 0) {
    doc.setTextColor(239, 68, 68);
    doc.text("Balance Due:", summaryX, y);
    doc.text(formatCurrency(invoice.balance), pageWidth - margin, y, {
      align: "right",
    });
    doc.setTextColor(0, 0, 0);
    y += 6;
  }

  // --- Insurance Claim (if any) ---
  if (invoice.insuranceClaim) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Insurance Claim Information:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Provider: ${invoice.insuranceClaim.provider}`, margin, y);
    y += 5;
    doc.text(`Claim Number: ${invoice.insuranceClaim.claimNumber}`, margin, y);
    y += 5;
    doc.text(
      `Claim Amount: ${formatCurrency(invoice.insuranceClaim.claimAmount)}`,
      margin,
      y,
    );
    y += 5;
    doc.text(`Status: ${invoice.insuranceClaim.status}`, margin, y);
    y += 8;
  }

  if (
    invoice.paymentMethod ||
    invoice.paymentDate ||
    invoice.transactionId ||
    invoice.merchantTxnNo ||
    invoice.pgTxnNo
  ) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Payment Information:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Transaction Mode: ${invoice.paymentMethod || "-"}`, margin, y);
    y += 5;
    doc.text(
      `Received Date: ${formatPdfDate(invoice.paymentDate, "MMM dd, yyyy HH:mm")}`,
      margin,
      y,
    );
    y += 8;
    const paymentReferences = [
      ["Transaction ID", invoice.transactionId],
      ["Merchant Reference", invoice.merchantTxnNo],
      ["PG Transaction No", invoice.pgTxnNo],
      ["Authorization Ref", invoice.authRefNo],
    ];
    paymentReferences.forEach(([label, value]) => {
      if (value) {
        doc.text(`${label}: ${value}`, margin, y);
        y += 5;
      }
    });
    y += 3;
  }

  if (invoice.notes) {
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    const noteLines = doc.splitTextToSize(
      `Notes: ${invoice.notes}`,
      pageWidth - 2 * margin - 30,
    );
    doc.text(noteLines, margin, y);
    doc.setTextColor(0, 0, 0);
    y += noteLines.length * 4 + 6;
  }

  let qrData = `Invoice: ${invoice.invoiceNumber}`;
  if (invoice.status === "Paid") {
    qrData = `Receipt: ${invoice.invoiceNumber} | Paid: ${formatCurrency(invoice.total)}`;
  }
  const qrImage = await generateQR(qrData);
  if (qrImage) {
    const qrSize = 40;
    const qrX = pageWidth - margin - qrSize;
    const qrY = pageHeight - margin - qrSize - 20; // above footer
    doc.addImage(qrImage, "PNG", qrX, qrY, qrSize, qrSize);
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text("Scan to verify", qrX + qrSize / 2, qrY + qrSize + 4, {
      align: "center",
    });
  }

  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Thank you for choosing Creadent Multispeciality Dental Clinic",
    pageWidth / 2,
    footerY,
    { align: "center" },
  );
  doc.text(
    "For questions, contact us at " + CLINIC.email,
    pageWidth / 2,
    footerY + 4,
    { align: "center" },
  );

  const fileName =
    invoice.status === "Paid"
      ? `Receipt_${invoice.invoiceNumber}.pdf`
      : `Invoice_${invoice.invoiceNumber}.pdf`;
  doc.save(fileName);
};

export const generatePaymentReceipt = async (invoice, paymentDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  let logoDataUrl = null;
  try {
    logoDataUrl = await loadImage(CLINIC.logoUrl);
  } catch (e) {
    console.warn("Logo could not be loaded", e);
  }

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", margin, y, 40, 40);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(CLINIC.name, margin + 50, y + 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(CLINIC.address, margin + 50, y + 22);
    doc.text(
      `Phone: ${CLINIC.phone}  |  Email: ${CLINIC.email}`,
      margin + 50,
      y + 32,
    );
    y += 50;
  } else {
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(CLINIC.name, margin, y);
    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(CLINIC.address, margin, y);
    y += 5;
    doc.text(`Phone: ${CLINIC.phone}  |  Email: ${CLINIC.email}`, margin, y);
    y += 15;
  }

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("PAYMENT RECEIPT", pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 20;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Details", margin, y);
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt Number: ${paymentDetails.receiptNumber}`, margin, y);
  y += 6;
  doc.text(`Transaction ID: ${paymentDetails.transactionId}`, margin, y);
  y += 6;
  doc.text(
    `Payment Date: ${formatPdfDate(paymentDetails.date, "MMM dd, yyyy HH:mm")}`,
    margin,
    y,
  );
  y += 6;
  doc.text(`Payment Method: ${paymentDetails.method}`, margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Amount Paid", margin, y);
  y += 8;
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(paymentDetails.amount), margin, y);
  doc.setTextColor(0, 0, 0);
  y += 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Paid against Invoice: ${invoice.invoiceNumber}`, margin, y);
  y += 8;
  doc.text(
    "This receipt confirms your payment has been successfully processed.",
    margin,
    y,
  );
  y += 15;

  const qrData = `Receipt ${paymentDetails.receiptNumber} | Invoice ${invoice.invoiceNumber} | Amount ${formatCurrency(paymentDetails.amount)}`;
  const qrImage = await generateQR(qrData);
  if (qrImage) {
    const qrSize = 50;
    const qrX = pageWidth - margin - qrSize;
    const qrY = y - 10;
    doc.addImage(qrImage, "PNG", qrX, qrY, qrSize, qrSize);
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text("Scan to verify", qrX + qrSize / 2, qrY + qrSize + 4, {
      align: "center",
    });
  }

  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("Creadent Multispeciality Dental Clinic", pageWidth / 2, footerY, {
    align: "center",
  });
  doc.text(CLINIC.address, pageWidth / 2, footerY + 4, { align: "center" });

  doc.save(`Receipt_${paymentDetails.receiptNumber}.pdf`);
};
