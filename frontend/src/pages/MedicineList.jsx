import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, Pill } from "lucide-react";
import { fadeIn } from "../utils/motion";
import MedicineCard from "../components/MedicineCard";
import MedicineRegistration from "./MedicineRegistration";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation } from "@apollo/client";
import { GET_MEDICINES } from "../graphql/queries";
import { DELETE_MEDICINE } from "../graphql/mutations";
import Pagination from "../components/Pagination";
import toast from "react-hot-toast";
import Preloader from "../components/Preloader";
import PageHeader from "../components/PageHeader";

const MedicineList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const limit = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { loading, error, data, refetch } = useQuery(GET_MEDICINES, {
    variables: { page, limit, search: debouncedSearch },
  });

  const [deleteMedicine] = useMutation(DELETE_MEDICINE, {
    onCompleted: () => {
      toast.success("Medicine deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleDelete = (medicine) => {
    if (window.confirm(`Are you sure you want to delete ${medicine.name}?`)) {
      deleteMedicine({ variables: { id: medicine.id } });
    }
  };

  if (loading && !data) return <Preloader />;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">
        Error loading inventory: {error.message}
      </div>
    );

  const { medicines = [], totalPages = 1 } = data?.getMedicines || {};

  const categories = ["All", ...new Set(medicines.map((m) => m.category))];

  const filteredMedicines = medicines.filter((medicine) => {
    return filterCategory === "All" || medicine.category === filterCategory;
  });

  return (
    <Suspense fallback={<Preloader />}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Medicine Inventory"
          subtitle="View and manage clinic medication stock"
          action={
            (user.role === "admin" || user.role === "doctor") && (
              <Link
                to={`/${user.role}/medicine-registration`}
                className="btn-primary flex items-center gap-2 self-start md:self-center"
              >
                <Plus size={20} />
                Add Medicine
              </Link>
            )
          }
        />

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search medicines by name..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-64">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              className="input-field pl-10"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Searching inventory...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMedicines.map((medicine, index) => (
                <MedicineCard
                  key={medicine.id}
                  medicine={medicine}
                  delay={index * 0.05}
                  onEdit={() => setSelectedMedicine(medicine)}
                  onDelete={() => handleDelete(medicine)}
                />
              ))}
            </div>

            {filteredMedicines.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Pill size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No medicines found matching your criteria.
                </p>
              </div>
            )}

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}

        {selectedMedicine && (
          <MedicineRegistration
            initialMedicine={selectedMedicine}
            onClose={() => {
              setSelectedMedicine(null);
              refetch();
            }}
          />
        )}
      </div>
    </Suspense>
  );
};

export default MedicineList;
