import { motion } from 'framer-motion'
import { FileText, Calendar, CreditCard, DollarSign, Download, RefreshCw } from 'lucide-react'
import { fadeIn } from '../utils/motion'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { generateInvoicePDF } from '../utils/pdfGenerator'

const InvoiceCard = ({ invoice, delay = 0, onPay }) => {
  const statusColors = {
    Paid: 'badge-success',
    Partial: 'badge-warning',
    Pending: 'badge-warning',
    Overdue: 'badge-error',
    Processing: 'badge-info',
    Failed: 'badge-error',
    Refunded: 'badge-info'
  }

  const handleDownloadReceipt = () => {
    generateInvoicePDF(invoice)
    toast.success('Receipt downloaded successfully')
  }

  const handleRequestRefund = () => {
    toast.success('Refund request submitted for review')
  }

  const hasInstallmentPlan = invoice.installmentPlan && invoice.installmentPlan.enabled

  return (
    <motion.div
      {...fadeIn('up', delay)}
      className="card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileText size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-gray-900">
              {invoice.invoiceNumber}
            </h3>
            <p className="text-sm text-gray-600">{invoice.patientName}</p>
          </div>
        </div>
        <span className={`badge ${statusColors[invoice.status]}`}>
          {invoice.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>Date: {format(new Date(invoice.date), 'MMM dd, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</span>
        </div>
        {invoice.paymentMethod && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CreditCard size={16} />
            <span>
              {invoice.paymentMethod}
              {invoice.cardLast4 && ` •••• ${invoice.cardLast4}`}
            </span>
          </div>
        )}
        {invoice.transactionId && (
          <div className="text-xs text-gray-500">
            Transaction ID: {invoice.transactionId}
          </div>
        )}
        {invoice.paymentDate && (
          <div className="flex items-center gap-2 text-sm text-success">
            <Calendar size={16} />
            <span>Paid: {format(new Date(invoice.paymentDate), 'MMM dd, yyyy')}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {invoice.items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm py-2 border-b border-gray-100">
            <div className="flex-1">
              <p className="text-gray-900">{item.description}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.unitPrice}</p>
            </div>
            <p className="font-medium text-gray-900">${item.total.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal:</span>
          <span>${invoice.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tax:</span>
          <span>${invoice.tax.toFixed(2)}</span>
        </div>
        {invoice.discount > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>Discount:</span>
            <span>-${invoice.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total:</span>
          <span>${invoice.total.toFixed(2)}</span>
        </div>
        {invoice.amountPaid > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>Paid:</span>
            <span>${invoice.amountPaid.toFixed(2)}</span>
          </div>
        )}
        {invoice.balance > 0 && (
          <div className="flex justify-between text-base font-semibold text-danger">
            <span>Balance Due:</span>
            <span>${invoice.balance.toFixed(2)}</span>
          </div>
        )}
      </div>

      {invoice.insuranceClaim && (
        <div className="p-3 bg-blue-50 rounded-lg mb-4">
          <p className="text-xs font-medium text-blue-900 mb-1">Insurance Claim</p>
          <div className="text-xs text-blue-700 space-y-1">
            <p>Provider: {invoice.insuranceClaim.provider}</p>
            <p>Claim #: {invoice.insuranceClaim.claimNumber}</p>
            <p>Amount: ${invoice.insuranceClaim.claimAmount.toFixed(2)}</p>
            <p className="font-medium">Status: {invoice.insuranceClaim.status}</p>
          </div>
        </div>
      )}

      {hasInstallmentPlan && (
        <div className="p-3 bg-purple-50 rounded-lg mb-4">
          <p className="text-xs font-medium text-purple-900 mb-2">Installment Plan</p>
          <div className="text-xs text-purple-700 space-y-1">
            <p>Monthly Payment: ${invoice.installmentPlan.monthlyAmount.toFixed(2)}</p>
            <p>Remaining: {invoice.installmentPlan.remainingPayments} of {invoice.installmentPlan.totalPayments} payments</p>
            <p>Next Due: {format(new Date(invoice.installmentPlan.nextDueDate), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      )}

      {invoice.notes && (
        <div className="p-3 bg-gray-50 rounded-lg mb-4">
          <p className="text-xs text-gray-600">{invoice.notes}</p>
        </div>
      )}

      <div className="flex gap-2">
        {invoice.balance > 0 && onPay && (
          <button
            onClick={() => onPay(invoice)}
            className="btn-primary flex-1"
          >
            <DollarSign size={18} className="inline mr-2" />
            Pay ${invoice.balance.toFixed(2)}
          </button>
        )}
        
        {invoice.status === 'Paid' && (
          <>
            <button
              onClick={handleDownloadReceipt}
              className="btn-outline flex-1"
            >
              <Download size={18} className="inline mr-2" />
              Receipt
            </button>
            <button
              onClick={handleRequestRefund}
              className="btn-outline"
              title="Request Refund"
            >
              <RefreshCw size={18} />
            </button>
          </>
        )}

        {(invoice.status === 'Pending' || invoice.status === 'Partial') && !hasInstallmentPlan && (
          <button
            onClick={() => toast.info('Installment plan setup')}
            className="btn-outline"
            title="Setup Installment Plan"
          >
            Setup Plan
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default InvoiceCard