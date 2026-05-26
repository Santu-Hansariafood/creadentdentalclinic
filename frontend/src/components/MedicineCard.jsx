import { motion } from 'framer-motion'
import { Pill, Package, Calendar, DollarSign, Tag, Factory } from 'lucide-react'
import { fadeIn } from '../utils/motion'

const MedicineCard = ({ medicine, delay = 0 }) => {
  const isLowStock = medicine.stock < 20
  const isExpired = new Date(medicine.expiryDate) < new Date()

  return (
    <motion.div
      {...fadeIn('up', delay)}
      className="card-hover relative overflow-hidden"
    >
      {isLowStock && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
          LOW STOCK
        </div>
      )}
      {isExpired && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
          EXPIRED
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <Pill size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-gray-900 text-lg leading-tight">
            {medicine.name}
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <Tag size={14} />
            {medicine.category}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-2">
            <Factory size={16} />
            Manufacturer
          </span>
          <span className="font-medium text-gray-900">{medicine.manufacturer}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-2">
            <Pill size={16} />
            Dosage
          </span>
          <span className="font-medium text-gray-900">{medicine.dosage}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-2">
            <Package size={16} />
            Stock
          </span>
          <span className={`font-bold ${isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
            {medicine.stock} units
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-2">
            <Calendar size={16} />
            Expiry
          </span>
          <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
            {new Date(medicine.expiryDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center text-primary font-bold text-lg">
          <DollarSign size={18} />
          <span>{medicine.price.toFixed(2)}</span>
        </div>
        <button className="text-sm text-primary hover:underline font-medium">
          Edit Details
        </button>
      </div>
    </motion.div>
  )
}

export default MedicineCard
