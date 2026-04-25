import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Search, Filter, DollarSign, Download, Calendar, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { invoices, paymentMethods } from '../data/mockData'
import InvoiceCard from '../components/InvoiceCard'
import PaymentModal from '../components/PaymentModal'
import PaymentMethodCard from '../components/PaymentMethodCard'
import { fadeIn, staggerContainer } from '../utils/motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const Billing = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [showPaymentMethods, setShowPaymentMethods] = useState(false)
  const [activeTab, setActiveTab] = useState('invoices')

  const userInvoices = invoices.filter(inv => {
    if (user.role === 'patient') return inv.patientId === user.id
    return true
  })

  const userPaymentMethods = paymentMethods.filter(pm => pm.userId === user.id)

  const filteredInvoices = userInvoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'All' || inv.status === filterStatus
    
    let matchesDate = true
    if (dateRange.start && dateRange.end) {
      const invDate = new Date(inv.date)
      matchesDate = invDate >= new Date(dateRange.start) && invDate <= new Date(dateRange.end)
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const totalPending = userInvoices
    .filter(inv => inv.balance > 0)
    .reduce((sum, inv) => sum + inv.balance, 0)

  const totalPaid = userInvoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.total, 0)

  const pendingCount = userInvoices.filter(inv => inv.balance > 0).length

  const handlePayment = (invoice) => {
    setSelectedInvoice(invoice)
    setShowPaymentModal(true)
  }

  const handleBulkPayment = () => {
    if (selectedInvoices.length === 0) {
      toast.error('Please select invoices to pay')
      return
    }
    const totalAmount = selectedInvoices.reduce((sum, id) => {
      const inv = userInvoices.find(i => i.id === id)
      return sum + (inv?.balance || 0)
    }, 0)
    toast.success(`Processing bulk payment of $${totalAmount.toFixed(2)}...`)
  }

  const handleExport = (format) => {
    toast.success(`Exporting billing records as ${format.toUpperCase()}...`)
  }

  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const handlePaymentSuccess = (paymentIntent) => {
    toast.success('Payment processed successfully!')
    setShowPaymentModal(false)
    setSelectedInvoice(null)
    setSelectedInvoices([])
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          Billing & Payments
        </h1>
        <p className="text-gray-600">Manage invoices, payments, and financial records</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div {...fadeIn('up', 0.1)} className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-warning" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Balance</p>
              <p className="text-2xl font-bold text-gray-900">${totalPending.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{pendingCount} unpaid invoice(s)</p>
        </motion.div>

        <motion.div {...fadeIn('up', 0.2)} className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <CreditCard size={24} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">${totalPaid.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">All time payments</p>
        </motion.div>

        <motion.div {...fadeIn('up', 0.3)} className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{userInvoices.length}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Generated invoices</p>
        </motion.div>
      </div>

      <motion.div {...fadeIn('up', 0.4)} className="card mb-6">
        <div className="flex items-center gap-4 mb-4 border-b border-gray-200 pb-4">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('payment-methods')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'payment-methods'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Payment Methods
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Payment History
          </button>
        </div>

        {activeTab === 'invoices' && (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-600" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-gray-600" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="input-field"
                  placeholder="Start date"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="input-field"
                  placeholder="End date"
                />
              </div>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => handleExport('csv')}
                  className="btn-outline flex items-center gap-2"
                >
                  <Download size={18} />
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="btn-outline flex items-center gap-2"
                >
                  <Download size={18} />
                  Export PDF
                </button>
              </div>
            </div>

            {selectedInvoices.length > 0 && (
              <div className="mb-4 p-4 bg-primary/5 rounded-lg flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  {selectedInvoices.length} invoice(s) selected
                </p>
                <button
                  onClick={handleBulkPayment}
                  className="btn-primary"
                >
                  Pay Selected (${selectedInvoices.reduce((sum, id) => {
                    const inv = userInvoices.find(i => i.id === id)
                    return sum + (inv?.balance || 0)
                  }, 0).toFixed(2)})
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'payment-methods' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold text-gray-900">
                Saved Payment Methods
              </h3>
              <button
                onClick={() => toast.info('Add payment method feature')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Add Card
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPaymentMethods.map((method, index) => (
                <PaymentMethodCard key={method.id} method={method} delay={index * 0.05} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3 className="font-heading text-lg font-semibold text-gray-900 mb-6">
              Payment History
            </h3>
            <div className="space-y-4">
              {userInvoices
                .filter(inv => inv.status === 'Paid')
                .map((inv, index) => (
                  <motion.div
                    key={inv.id}
                    {...fadeIn('up', index * 0.05)}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(inv.paymentDate), 'MMM dd, yyyy - hh:mm a')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${inv.total.toFixed(2)}</p>
                        <span className="badge badge-success">Paid</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{inv.paymentMethod}</span>
                      <button
                        onClick={() => toast.success('Downloading receipt...')}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <Download size={14} />
                        Receipt
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </motion.div>

      {activeTab === 'invoices' && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice, index) => (
              <div key={invoice.id} className="relative">
                {invoice.balance > 0 && (
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={() => toggleInvoiceSelection(invoice.id)}
                    className="absolute top-4 left-4 z-10 w-5 h-5 rounded border-gray-300"
                  />
                )}
                <InvoiceCard
                  invoice={invoice}
                  delay={index * 0.05}
                  onPay={handlePayment}
                />
              </div>
            ))
          ) : (
            <motion.div {...fadeIn('up')} className="col-span-2 card text-center py-12">
              <CreditCard size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                No invoices found
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'All' || dateRange.start
                  ? 'Try adjusting your search or filter'
                  : 'No billing records available'}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedInvoice(null)
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

export default Billing