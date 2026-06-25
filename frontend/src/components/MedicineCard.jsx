import { motion } from "framer-motion";
import { Pill, Tag, Edit2, Trash2 } from "lucide-react";
import { fadeIn } from "../utils/motion";

const MedicineCard = ({ medicine, delay = 0, onEdit, onDelete }) => {
  return (
    <motion.div
      {...fadeIn("up", delay)}
      className="card-hover relative overflow-hidden"
    >
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

      <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
        <button 
          onClick={onEdit}
          className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
        >
          <Edit2 size={14} />
          Edit
        </button>
        <button 
          onClick={onDelete}
          className="text-sm text-red-500 hover:underline font-medium flex items-center gap-1"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </motion.div>
  );
};

export default MedicineCard;
