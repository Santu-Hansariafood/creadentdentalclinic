import { motion } from "framer-motion";
import { fadeIn } from "../utils/motion";

const PageHeader = ({ title, subtitle, action }) => (
  <motion.div {...fadeIn("down")} className="mb-6 sm:mb-8">
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">{subtitle}</p>
      </div>
      {action}
    </div>
  </motion.div>
);

export default PageHeader;
