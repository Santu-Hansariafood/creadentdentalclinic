import { motion } from "framer-motion";
import { fadeIn } from "../utils/motion";
import PatientCard from "../components/PatientCard";
import PatientRegistration from "./PatientRegistration";
import { useQuery, useMutation } from "@apollo/client";
import { GET_PATIENTS } from "../graphql/queries";
import { DELETE_PATIENT } from "../graphql/mutations";
import Pagination from "../components/Pagination";
import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PatientList = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { loading, error, data, refetch } = useQuery(GET_PATIENTS, {
    variables: { page, limit, search: debouncedSearch },
  });

  const [deletePatient] = useMutation(DELETE_PATIENT, {
    onCompleted: () => {
      toast.success("Patient deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error deleting patient: ${error.message}`);
    },
  });

  const handleDelete = (patient) => {
    if (window.confirm(`Are you sure you want to delete ${patient.name}?`)) {
      deletePatient({ variables: { id: patient.id } });
    }
  };

  if (loading && !data)
    return <div className="p-6 text-center">Loading patients...</div>;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const { patients = [], totalPages = 1 } = data?.getPatients || {};

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div {...fadeIn("down")} className="mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Patient List
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage patient records.
            </p>
          </div>
          {user && (user.role === "admin" || user.role === "doctor" || user.role === "employee") && (
            <Link
              to={`/${user.role}/patient-registration`}
              className="btn-primary flex items-center gap-2 self-start md:self-center"
            >
              <Plus size={20} />
              Add Patient
            </Link>
          )}
        </div>
      </motion.div>

      <div className="mb-8">
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search patients by name, email or phone..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Searching patients...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient, index) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                delay={index * 0.1}
                onEdit={(pat) => setSelectedPatient(pat)}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {patients.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center mt-6">
              <p className="text-gray-500">
                No patients found matching "{debouncedSearch}".
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
      
      {selectedPatient && (
        <PatientRegistration
          initialPatient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
};

export default PatientList;
