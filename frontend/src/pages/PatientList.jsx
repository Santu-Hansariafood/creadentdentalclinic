import { motion } from "framer-motion";
import { fadeIn } from "../utils/motion";
import PatientCard from "../components/PatientCard";
import PatientRegistration from "./PatientRegistration";
import { useQuery, useMutation } from "@apollo/client";
import { GET_PATIENTS } from "../graphql/queries";
import { DELETE_PATIENT } from "../graphql/mutations";
import Pagination from "../components/Pagination";
import { useState, useEffect } from "react";
import { Search, Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import Preloader from "../components/Preloader";
import { useAuth } from "../context/AuthContext";

const PatientList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const [deletePatient, { loading: deleteLoading }] = useMutation(
    DELETE_PATIENT,
    {
      refetchQueries: [{ query: GET_PATIENTS }],
      awaitRefetchQueries: true,
      onCompleted: () => {
        toast.success("Patient and all related records deleted successfully!");
      },
      onError: (err) => {
        toast.error(`Error deleting patient: ${err.message}`);
      },
    },
  );

  const handleDelete = (patient) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${patient.name}? This will permanently erase the patient, their login account, and all appointments, medical records, prescriptions, and invoices linked to them. This cannot be undone.`,
      )
    ) {
      deletePatient({ variables: { id: patient.id } }).then(() => {
        if (
          data?.getPatients?.patients?.length <= 1 &&
          data.getPatients.currentPage > 1
        ) {
          setPage((p) => Math.max(1, p - 1));
        }
      });
    }
  };

  const handleEditRedirect = (patient) => {
    if (!user) return;
    setSelectedPatient(patient);
  };

  const handleCloseEdit = () => {
    setSelectedPatient(null);
    refetch();
  };

  if (loading && !data)
    return <Preloader />;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const {
    patients = [],
    totalPages = 1,
    totalCount = 0,
    currentPage = 1,
  } = data?.getPatients || {};

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
              {totalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  <Users size={12} />
                  {totalCount} total {totalCount === 1 ? "patient" : "patients"}
                  {debouncedSearch && (
                    <>
                      {" "}
                      • matching "{debouncedSearch}"
                    </>
                  )}
                </span>
              )}
            </p>
          </div>
          {user &&
            (user.role === "admin" ||
              user.role === "doctor" ||
              user.role === "employee") && (
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
            placeholder="Search patients by name, email, phone, or patient ID..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Preloader />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient, index) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                delay={index * 0.1}
                onEdit={(pat) => handleEditRedirect(pat)}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {patients.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center mt-6">
              <Users size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {debouncedSearch
                  ? `No patients found matching "${debouncedSearch}".`
                  : "No patients registered yet."}
              </p>
              {user &&
                (user.role === "admin" ||
                  user.role === "doctor" ||
                  user.role === "employee") && (
                  <button
                    onClick={() =>
                      navigate(`/${user.role}/patient-registration`)
                    }
                    className="btn-primary inline-flex items-center gap-2 mt-4"
                  >
                    <Plus size={18} />
                    Register First Patient
                  </button>
                )}
            </div>
          )}

          {currentPage && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-8 text-xs text-gray-500">
              <span>
                Showing page {currentPage} of {totalPages} (
                {patients.length} of {totalCount} patients)
              </span>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {selectedPatient && (
        <PatientRegistration
          initialPatient={selectedPatient}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
};

export default PatientList;
