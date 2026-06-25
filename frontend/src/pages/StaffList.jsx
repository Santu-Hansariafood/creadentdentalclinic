import { motion } from "framer-motion";
import { fadeIn } from "../utils/motion";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USERS } from "../graphql/queries";
import { DELETE_USER } from "../graphql/mutations";
import Pagination from "../components/Pagination";
import { useState, useEffect } from "react";
import { Search, Edit2, Trash2, Eye, Plus, Mail, Phone, Briefcase, Award } from "lucide-react";
import toast from "react-hot-toast";
import StaffRegistration from "./StaffRegistration";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const StaffList = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { loading, error, data, refetch } = useQuery(GET_USERS);

  const [deleteUser] = useMutation(DELETE_USER, {
    onCompleted: () => {
      toast.success("Staff deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error deleting staff: ${error.message}`);
    },
  });

  const handleDelete = (staffMember) => {
    if (window.confirm(`Are you sure you want to delete ${staffMember.name}?`)) {
      deleteUser({ variables: { id: staffMember.id } });
    }
  };

  if (loading && !data)
    return <div className="p-6 text-center">Loading staff...</div>;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const allUsers = data?.getUsers || [];
  const staffMembers = allUsers.filter(u => u.role !== "patient");
  const filteredStaff = staffMembers.filter(member => 
    member.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    member.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    member.phone.includes(debouncedSearch)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div {...fadeIn("down")} className="mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Staff List
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage staff members.
            </p>
          </div>
          {user?.role === "admin" && (
            <Link
              to="/admin/staff-registration"
              className="btn-primary flex items-center gap-2 self-start md:self-center"
            >
              <Plus size={20} />
              Add Staff
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
            placeholder="Search staff by name, email or phone..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Searching staff...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((staff, index) => (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{staff.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{staff.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingStaff(staff)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => setSelectedStaff(staff)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleDelete(staff)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Mail size={14} />
                    {staff.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} />
                    {staff.phone}
                  </p>
                  {staff.role === "doctor" && (
                    <>
                      {staff.specialization && (
                        <p className="flex items-center gap-2">
                          <Briefcase size={14} />
                          {staff.specialization}
                        </p>
                      )}
                      {staff.license && (
                        <p className="flex items-center gap-2">
                          <Award size={14} />
                          {staff.license}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredStaff.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center mt-6">
              <p className="text-gray-500">
                No staff members found matching "{debouncedSearch}".
              </p>
            </div>
          )}
        </>
      )}
      
      {/* View Staff Modal */}
      {viewingStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold text-gray-900">Staff Details</h2>
                <button onClick={() => setViewingStaff(null)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium text-gray-900">{viewingStaff.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Role</p>
                  <p className="font-medium text-gray-900 capitalize">{viewingStaff.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{viewingStaff.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{viewingStaff.phone}</p>
                </div>
                {viewingStaff.role === "doctor" && (
                  <>
                    {viewingStaff.specialization && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Specialization</p>
                        <p className="font-medium text-gray-900">{viewingStaff.specialization}</p>
                      </div>
                    )}
                    {viewingStaff.license && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">License Number</p>
                        <p className="font-medium text-gray-900">{viewingStaff.license}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Staff Modal */}
      {selectedStaff && (
        <StaffRegistration
          initialStaff={selectedStaff}
          onClose={() => {
            setSelectedStaff(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default StaffList;
