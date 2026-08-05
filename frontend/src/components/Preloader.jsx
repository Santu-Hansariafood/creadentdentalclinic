import { motion } from "framer-motion";

const Preloader = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const circleVariants = {
    animate: {
      scale: [1, 1.2, 1],
      rotate: [0, 90, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.3, 1],
      opacity: [0.3, 0.6, 0.3],
      transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-white via-primary/5 to-white"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        <motion.div
          variants={itemVariants}
          className="relative w-32 h-32 mx-auto mb-6"
        >
          {/* Outer Pulse */}
          <motion.div
            variants={pulseVariants}
            animate="animate"
            className="absolute inset-0 rounded-full bg-primary/20"
          />
          {/* Middle Pulse */}
          <motion.div
            variants={pulseVariants}
            animate="animate"
            transition={{ delay: 0.3 }}
            className="absolute inset-4 rounded-full bg-primary/30"
          />
          {/* Rotating Circle */}
          <motion.div
            variants={circleVariants}
            animate="animate"
            className="absolute inset-8 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent" />
          </motion.div>
          {/* Logo */}
          <div className="absolute inset-10 flex items-center justify-center">
            <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center">
              <img
                src="/logo/logo.png"
                alt="Creadent Dental Clinic"
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-2">
          <h1 className="font-heading font-bold text-2xl text-gray-900">
            Creadent
          </h1>
          <p className="text-sm text-gray-500">Dental Clinic</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Preloader;
