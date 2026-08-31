import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pill, Tag, Plus, Trash2 } from "lucide-react";
import { fadeIn } from "../utils/motion";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@apollo/client";
import { REGISTER_MEDICINE, UPDATE_MEDICINE } from "../graphql/mutations";
import { GET_MEDICINES, GET_MEDICINE_CATEGORIES } from "../graphql/queries";

const FormContent = ({
  formData,
  setFormData,
  handleChange,
  handleSubmit,
  showNewCategoryInput,
  toggleCategoryInput,
  categoriesLoading,
  categoriesError,
  categories,
  registerLoading,
  updateLoading,
  initialMedicine,
  onClose,
}) => (
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
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories..."
                    : categoriesError
                      ? "Error loading"
                      : "Select Category"}
                </option>
                {!categoriesError &&
                  categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
              {categoriesError && (
                <p className="text-red-500 text-xs mt-1">
                  Failed to load categories. You can still add a new one.
                </p>
              )}
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
            onClick={toggleCategoryInput}
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dosage Form *
        </label>
        <select
          name="dosageForm"
          value={formData.dosageForm}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">Select form</option>
          <option value="Tablet">Tablet</option>
          <option value="Liquid">Liquid</option>
          <option value="Capsule">Capsule</option>
          <option value="Injection">Injection</option>
          <option value="Cream">Cream</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dosage Strength *
        </label>
        <input
          type="text"
          name="dosageStrength"
          value={formData.dosageStrength}
          onChange={handleChange}
          className="input-field"
          placeholder="e.g., 500mg, 10ml, 5%"
          required
        />
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

    <div className="flex justify-end gap-3 pt-4">
      {onClose && (
        <button type="button" onClick={onClose} className="btn-secondary px-6">
          Cancel
        </button>
      )}
      <button
        type="submit"
        className="btn-primary px-8"
        disabled={registerLoading || updateLoading}
      >
        {registerLoading || updateLoading
          ? initialMedicine
            ? "Saving..."
            : "Registering..."
          : initialMedicine
            ? "Save Changes"
            : "Register Medicine"}
      </button>
    </div>
  </form>
);

const MedicineRegistration = ({ initialMedicine, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    newCategory: "",
    description: "",
    dosageForm: "",
    dosageStrength: "",
  });
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const {
    loading: categoriesLoading,
    error: categoriesError,
    data: categoriesData,
  } = useQuery(GET_MEDICINE_CATEGORIES);

  const categories = categoriesData?.getMedicineCategories || [];

  const [registerMedicine, { loading: registerLoading }] = useMutation(
    REGISTER_MEDICINE,
    {
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
          dosageForm: "",
          dosageStrength: "",
        });
        setShowNewCategoryInput(false);
        if (onClose) onClose();
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    },
  );

  const [updateMedicine, { loading: updateLoading }] = useMutation(
    UPDATE_MEDICINE,
    {
      refetchQueries: [
        { query: GET_MEDICINES },
        { query: GET_MEDICINE_CATEGORIES },
      ],
      onCompleted: () => {
        toast.success("Medicine updated successfully!");
        if (onClose) onClose();
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    },
  );

  useEffect(() => {
    if (initialMedicine?.id) {
      setFormData({
        name: initialMedicine.name || "",
        category: initialMedicine.category || "",
        newCategory: "",
        description: initialMedicine.description || "",
        dosageForm: initialMedicine.dosageForm || "",
        dosageStrength: initialMedicine.dosageStrength || "",
      });
      setShowNewCategoryInput(false);
    }
  }, [initialMedicine?.id]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
    if (!formData.dosageForm) {
      toast.error("Please select a dosage form");
      return;
    }
    if (!formData.dosageStrength) {
      toast.error("Please enter the dosage strength");
      return;
    }

    const variables = {
      name: formData.name,
      category: finalCategory,
      description: formData.description || undefined,
      dosageForm: formData.dosageForm,
      dosageStrength: formData.dosageStrength,
    };

    try {
      if (initialMedicine) {
        await updateMedicine({
          variables: { id: initialMedicine.id, ...variables },
        });
      } else {
        await registerMedicine({ variables });
      }
    } catch (err) {
      // Already handled in mutation onError
    }
  };

  const toggleCategoryInput = () => {
    setShowNewCategoryInput((prev) => !prev);
    setFormData((prev) => ({ ...prev, category: "", newCategory: "" }));
  };

  if (initialMedicine) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-gray-900">
                Edit Medicine
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <FormContent
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              showNewCategoryInput={showNewCategoryInput}
              toggleCategoryInput={toggleCategoryInput}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              categories={categories}
              registerLoading={registerLoading}
              updateLoading={updateLoading}
              initialMedicine={initialMedicine}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    );
  }

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
        <FormContent
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          showNewCategoryInput={showNewCategoryInput}
          toggleCategoryInput={toggleCategoryInput}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          categories={categories}
          registerLoading={registerLoading}
          updateLoading={updateLoading}
          initialMedicine={initialMedicine}
          onClose={onClose}
        />
      </motion.div>
    </div>
  );
};

export default MedicineRegistration;
