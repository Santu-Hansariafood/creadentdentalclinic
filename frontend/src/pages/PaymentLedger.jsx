import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Plus, Truck, Calendar, DollarSign, FileText } from 'lucide-react'
import { fadeIn } from '../utils/motion'
import { useQuery } from '@apollo/client'
import { GET_PAYMENT_LEDGERS } from '../graphql/queries'
import { format } from 'date-fns'

const PaymentLedger = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const { loading, error, data } = useQuery(GET_PAYMENT_LEDGERS)

  if (loading) return <div className="p-6 text-center">Loading ledger...</div>
  if (error) return <div className="p-6 text-center text-red-500">Error: {error.message}</div>

  const ledgers = data?.getPaymentLedgers || []

  const filteredLedgers = ledgers.filter(ledger => 
    ledger.lorryNo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn('down')} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
              Payment Ledger MIS
            </h1>
            <p className="text-gray-600">Track payments and dues by Lorry Number</p>
          </div>
          <button className="btn-primary flex items-center gap-2 self-start md:self-center">
            <Plus size={20} />
            Add Entry
          </button>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Lorry Number..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <motion.div {...fadeIn('up', 0.2)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Sl No</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Lorry No</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Payment Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Payment Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Due Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLedgers.map((ledger) => (
                <tr key={ledger.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{ledger.slNo}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-primary" />
                      <span className="font-medium text-gray-900">{ledger.lorryNo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {format(new Date(ledger.paymentDate), 'dd MMM yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <DollarSign size={14} />
                      {ledger.paymentAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-red-600 font-semibold">
                      <DollarSign size={14} />
                      {ledger.dueAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ledger.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      ledger.status === 'Partial' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {ledger.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {ledger.remarks || '-'}
                  </td>
                </tr>
              ))}
              {filteredLedgers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 text-gray-200" />
                    No ledger entries found.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredLedgers.length > 0 && (
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right text-gray-700">Total:</td>
                  <td className="px-6 py-4 text-green-600">
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      {filteredLedgers.reduce((sum, item) => sum + item.paymentAmount, 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-red-600">
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      {filteredLedgers.reduce((sum, item) => sum + item.dueAmount, 0).toLocaleString()}
                    </div>
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default PaymentLedger
