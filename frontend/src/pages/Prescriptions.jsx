import { useState } from "react";
import { motion } from "framer-motion";
import { Pill, Search, Filter, Plus, Trash2, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PrescriptionCard from "../components/PrescriptionCard";
import { fadeIn, staggerContainer } from "../utils/motion";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_PRESCRIPTIONS,
  GET_PATIENTS,
  GET_MEDICINES,
} from "../graphql/queries";
import { CREATE_PRESCRIPTION } from "../graphql/mutations";
import generatePrescriptionPDF from "../components/PrescriptionPDF";

const Prescriptions = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [medications, setMedications] = useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const { loading, error, data } = useQuery(GET_PRESCRIPTIONS);
  const { data: patientsData } = useQuery(GET_PATIENTS, {
    variables: { limit: 100 },
  });
  const { data: medicinesData } = useQuery(GET_MEDICINES, {
    variables: { limit: 100 },
  });

  const [createPrescription] = useMutation(CREATE_PRESCRIPTION, {
    refetchQueries: [{ query: GET_PRESCRIPTIONS }],
  });

  if (loading)
    return <div className="p-6 text-center">Loading prescriptions...</div>;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const prescriptions = data?.getPrescriptions || [];
  const patients = patientsData?.getPatients?.patients || [];
  const medicines = medicinesData?.getMedicines?.medicines || [];

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
    ]);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...medications];
    newMedications[index][field] = value;
    setMedications(newMedications);
  };

  const handleMedicationSelect = (index, medicineId) => {
    const medicine = medicines.find((m) => m.id === medicineId);
    if (medicine) {
      const newMedications = [...medications];
      newMedications[index].name = medicine.name;
      newMedications[index].dosage = medicine.dosage || "";
      setMedications(newMedications);
    }
  };

  const filteredPrescriptions = prescriptions.filter((pres) => {
    const matchesSearch =
      pres.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pres.medications.some((med) =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    const matchesStatus =
      filterStatus === "All" || pres.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const downloadPrescription = async (prescription) => {
    try {
      await generatePrescriptionPDF(prescription);
      toast.success("Prescription downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };
  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    try {
      const selectedPatient = patients.find((p) => p.id === selectedPatientId);
      if (!selectedPatient) {
        toast.error("Please select a patient");
        return;
      }

      const result = await createPrescription({
        variables: {
          patientId: selectedPatientId,
          patientName: selectedPatient.name,
          doctorId: user.id,
          doctorName: user.name,
          diagnosis,
          medications: medications.map(
            ({ name, dosage, frequency, duration, instructions }) => ({
              name,
              dosage,
              frequency,
              duration,
              instructions,
            }),
          ),
          notes,
        },
      });

      const newPrescription = result.data.createPrescription;
      toast.success("Prescription created successfully!");
      setShowCreateForm(false);
      setMedications([
        { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
      ]);
      setSelectedPatientId("");
      setDiagnosis("");
      setNotes("");

      setTimeout(() => downloadPrescription(newPrescription), 500);
    } catch (err) {
      toast.error("Failed to create prescription: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div {...fadeIn("down")} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
              Prescriptions
            </h1>
            <p className="text-gray-600">
              View and manage medication prescriptions
            </p>
          </div>
          {user.role === "doctor" && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              New Prescription
            </button>
          )}
        </div>
      </motion.div>

      {showCreateForm && (
        <motion.div {...fadeIn("up", 0.1)} className="card mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-accent px-6 py-4 -mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6 rounded-t-lg">
            <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
              <Pill size={22} />
              Create New Prescription
            </h2>
            <p className="text-white/80 text-sm mt-1">Fill in patient details and medications to generate a professional Rx</p>
          </div>
          <form onSubmit={handleCreatePrescription} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient *
                </label>
                <select
                  className="input-field"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  Medication List & Doses
                </h3>
                <button
                  type="button"
                  onClick={addMedication}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Plus size={16} /> Add Another Medication
                </button>
              </div>

              <div className="space-y-6">
                {medications.map((med, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 relative shadow-sm"
                  >
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medication Name *
                        </label>
                        <select
                          className="input-field bg-white"
                          value={
                            medicines.find((m) => m.name === med.name)?.id || ""
                          }
                          onChange={(e) =>
                            handleMedicationSelect(index, e.target.value)
                          }
                          required
                        >
                          <option value="">Select Medication</option>
                          {medicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} {m.category ? `(${m.category})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dose / Dosage *
                        </label>
                        <input
                          type="text"
                          className="input-field bg-white"
                          placeholder="e.g., 500mg"
                          value={med.dosage}
                          onChange={(e) =>
                            handleMedicationChange(
                              index,
                              "dosage",
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequency *
                        </label>
                        <input
                          type="text"
                          className="input-field bg-white"
                          placeholder="e.g., 3 times daily"
                          value={med.frequency}
                          onChange={(e) =>
                            handleMedicationChange(
                              index,
                              "frequency",
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration *
                          </label>
                          <input
                            type="text"
                            className="input-field bg-white"
                            placeholder="e.g., 7 days"
                            value={med.duration}
                            onChange={(e) =>
                              handleMedicationChange(
                                index,
                                "duration",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions *
                        </label>
                        <input
                          type="text"
                          className="input-field bg-white"
                          placeholder="e.g., Take after meals"
                          value={med.instructions}
                          onChange={(e) =>
                            handleMedicationChange(
                              index,
                              "instructions",
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
              >
                <Download size={20} />
                Generate & Download Prescription
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <motion.div {...fadeIn("up", 0.2)} className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {filteredPrescriptions.length > 0 ? (
          filteredPrescriptions.map((pres, index) => (
            <PrescriptionCard
              key={pres.id}
              prescription={pres}
              delay={index * 0.05}
            />
          ))
        ) : (
          <motion.div
            {...fadeIn("up")}
            className="col-span-2 card text-center py-12"
          >
            <Pill size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
              No prescriptions found
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== "All"
                ? "Try adjusting your search or filter"
                : "No prescriptions available"}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Prescriptions;
