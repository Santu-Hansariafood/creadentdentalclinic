import { motion } from 'framer-motion'

const Preloader = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
    >
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 border-4 border-gray-200 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rounded-full"
          />
        </div>
        <img
          src="/logo/logo.png"
          alt="Creadent Dental Clinic"
          className="w-12 h-12 object-contain mx-auto mb-2"
        />
        <p className="text-primary font-medium">Loading...</p>
      </div>
    </motion.div>
  )
}

export default Preloader
