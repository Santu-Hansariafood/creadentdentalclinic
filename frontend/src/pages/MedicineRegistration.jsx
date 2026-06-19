import { useState } from "react";
import { motion } from "framer-motion";
import { Pill, Tag, Plus, Trash2 } from "lucide-react";
import { fadeIn } from "../utils/motion";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@apollo/client";
import { REGISTER_MEDICINE } from "../graphql/mutations";
import { GET_MEDICINES, GET_MEDICINE_CATEGORIES } from "../graphql/queries";

const MedicineRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    newCategory: "",
    description: "",
  });
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const { data: categoriesData } = useQuery(GET_MEDICINE_CATEGORIES);
  const categories = categoriesData?.getMedicineCategories || [];

  const [registerMedicine, { loading }] = useMutation(REGISTER_MEDICINE, {
    refetchQueries: [
      { query: GET_MEDICINES },
      { query: GET_MEDICINE_CATEGORIES },
    ],
    onCompleted: () => {
      toast.success("Medicine registered successfully!");
      setFormData({
        name: "",
        category: "",
        newCategory: "",
        description: "",
      });
      setShowNewCategoryInput(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalCategory = showNewCategoryInput
      ? formData.newCategory
      : formData.category;

    if (!finalCategory) {
      toast.error("Please select or enter a category");
      return;
    }

    await registerMedicine({
      variables: {
        name: formData.name,
        category: finalCategory,
        description: formData.description || undefined,
      },
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div {...fadeIn("down")} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          Medicine Registration
        </h1>
        <p className="text-gray-600">
          Add new medicine to the clinic inventory
        </p>
      </motion.div>

      <motion.div {...fadeIn("up", 0.2)} className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medicine Name *
              </label>
              <div className="relative">
                <Pill
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="e.g., Amoxicillin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="space-y-2">
                {!showNewCategoryInput ? (
                  <div className="relative">
                    <Tag
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="input-field pl-10"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat, idx) => (
                        <option key={idx} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <Tag
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      name="newCategory"
                      value={formData.newCategory}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Enter new category"
                      required
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategoryInput(!showNewCategoryInput);
                    setFormData({ ...formData, category: "", newCategory: "" });
                  }}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors"
                >
                  {showNewCategoryInput ? (
                    <>
                      <Trash2 size={16} />
                      Use existing category
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add new category
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field min-h-[100px]"
              placeholder="Enter description..."
              rows={4}
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="btn-primary px-8"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register Medicine"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default MedicineRegistration;
