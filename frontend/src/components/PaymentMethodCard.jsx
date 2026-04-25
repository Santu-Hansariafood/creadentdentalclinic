import { motion } from 'framer-motion'
import { CreditCard, Trash2, CheckCircle } from 'lucide-react'
import { fadeIn } from '../utils/motion'
import toast from 'react-hot-toast'

const PaymentMethodCard = ({ method, delay = 0 }) => {
  const handleDelete = () => {
    toast.success('Payment method removed successfully')
  }

  const handleSetDefault = () => {
    toast.success('Default payment method updated')
  }

  const cardBrandColors = {
    visa: 'from-blue-500 to-blue-700',
    mastercard: 'from-red-500 to-orange-600',
    amex: 'from-blue-600 to-indigo-700',
    discover: 'from-orange-500 to-orange-700',
    default: 'from-gray-600 to-gray-800'
  }

  const cardBrand = method.brand.toLowerCase()
  const gradientClass = cardBrandColors[cardBrand] || cardBrandColors.default

  return (
    <motion.div
      {...fadeIn('up', delay)}
      className="relative"
    >
      <div className={`bg-gradient-to-br ${gradientClass} rounded-xl p-6 text-white shadow-lg`}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs opacity-75 mb-1">Card Number</p>
            <p className="text-lg font-mono tracking-wider">
              •••• •••• •••• {method.last4}
            </p>
          </div>
          {method.isDefault && (
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
              <CheckCircle size={14} />
              <span className="text-xs">Default</span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs opacity-75 mb-1">Expires</p>
            <p className="font-medium">{method.expiryMonth}/{method.expiryYear}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75 mb-1">Card Type</p>
            <p className="font-medium uppercase">{method.brand}</p>
          </div>
        </div>

        <div className="absolute top-4 right-4">
          <CreditCard size={32} className="opacity-30" />
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {!method.isDefault && (
          <button
            onClick={handleSetDefault}
            className="btn-outline flex-1 text-sm py-2"
          >
            Set as Default
          </button>
        )}
        <button
          onClick={handleDelete}
          className="btn-danger text-sm py-2 px-4"
          title="Remove card"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  )
}

export default PaymentMethodCard