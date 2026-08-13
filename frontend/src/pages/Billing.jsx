import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Search,
  Filter,
  IndianRupee,
  Download,
  Calendar,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import InvoiceCard from "../components/InvoiceCard";
import PaymentModal from "../components/PaymentModal";
import PaymentMethodCard from "../components/PaymentMethodCard";
import { fadeIn, staggerContainer } from "../utils/motion";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useQuery, useMutation } from "@apollo/client";
import { GET_INVOICES, GET_MY_PATIENT, GET_PATIENTS } from "../graphql/queries";
import { CREATE_INVOICE, GENERATE_PATIENT_LOGIN, UPDATE_INVOICE, DELETE_INVOICE } from "../graphql/mutations";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import Preloader from "../components/Preloader";

const Billing = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [activeTab, setActiveTab] = useState("invoices");
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [autoGenerateLogin, setAutoGenerateLogin] = useState(true);
  const [generatedLogin, setGeneratedLogin] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: "",
    patientId: "",
    patientName: "",
    date: format(new Date(), "yyyy-MM-dd"),
    dueDate: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
    tax: 0,
    discount: 0,
    notes: "",
  });

  const { loading, error, data, refetch } = useQuery(GET_INVOICES);
  const { data: patientsData } = useQuery(GET_PATIENTS, {
    variables: { page: 1, limit: 100 },
  });
  const { data: myPatientData } = useQuery(GET_MY_PATIENT, {
    skip: user?.role !== "patient",
  });
  const [createInvoice] = useMutation(CREATE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });
  const [generatePatientLogin] = useMutation(GENERATE_PATIENT_LOGIN);
  const [updateInvoice] = useMutation(UPDATE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });
  const [deleteInvoice] = useMutation(DELETE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  const [showEditInvoice, setShowEditInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editInvoiceForm, setEditInvoiceForm] = useState({
    invoiceNumber: "",
    patientId: "",
    patientName: "",
    date: "",
    dueDate: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
    tax: 0,
    discount: 0,
    notes: "",
    amountPaid: 0,
    status: "Unpaid",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  if (loading) return <Preloader />;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const allInvoices = data?.getInvoices || [];
  const patients = patientsData?.getPatients?.patients || [];
  const myPatient = myPatientData?.getMyPatient;
  const buildPatientPassword = (phone = "") =>
    `${new Date().getFullYear()}${phone.slice(-4)}`;

  const invoices =
    user?.role === "patient" && myPatient
      ? allInvoices.filter((inv) => inv.patientId === myPatient.id)
      : allInvoices;

  const paymentMethods = [];
  const userPaymentMethods = paymentMethods;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || inv.status === filterStatus;

    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const invDate = new Date(inv.date);
      matchesDate =
        invDate >= new Date(dateRange.start) &&
        invDate <= new Date(dateRange.end);
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPending = filteredInvoices
    .filter((inv) => inv.balance > 0)
    .reduce((sum, inv) => sum + inv.balance, 0);

  const totalPaid = filteredInvoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingCount = filteredInvoices.filter((inv) => inv.balance > 0).length;

  const subtotal = newInvoice.items.reduce((sum, item) => sum + item.total, 0);
  const totalAmount = subtotal + newInvoice.tax - newInvoice.discount;

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newInvoice.items];
    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index][field] = parseFloat(value) || 0;
      updatedItems[index].total =
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    } else {
      updatedItems[index][field] = value;
    }
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const handleAddItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [
        ...newInvoice.items,
        { description: "", quantity: 1, unitPrice: 0, total: 0 },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const updatedItems = newInvoice.items.filter((_, i) => i !== index);
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const handlePatientChange = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setGeneratedLogin({
        patientId: patient.id,
        patientName: patient.name,
        phone: patient.phone,
        password: buildPatientPassword(patient.phone),
        userId: patient.userId,
        newlyCreated: !patient.userId,
        preview: true,
      });
      setNewInvoice({
        ...newInvoice,
        patientId,
        patientName: patient.name,
      });
    }
  };

  const resetInvoiceForm = (clearGeneratedCredentials = true) => {
    setShowCreateInvoice(false);
    if (clearGeneratedCredentials) {
      setGeneratedLogin(null);
    }
    setAutoGenerateLogin(true);
    setNewInvoice({
      invoiceNumber: "",
      patientId: "",
      patientName: "",
      date: format(new Date(), "yyyy-MM-dd"),
      dueDate: "",
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
      tax: 0,
      discount: 0,
      notes: "",
    });
  };

  const handleCreateInvoice = async (e, shouldPayNow = false) => {
    e.preventDefault();
    try {
      const { data: createInvoiceData } = await createInvoice({
        variables: {
          ...newInvoice,
          subtotal,
          total: totalAmount,
          balance: totalAmount,
        },
      });
      const createdInvoice = createInvoiceData?.createInvoice;
      let loginCredentials = null;

      if (autoGenerateLogin && newInvoice.patientId) {
        const { data: loginData } = await generatePatientLogin({
          variables: { patientId: newInvoice.patientId },
        });
        if (loginData?.generatePatientLogin) {
          loginCredentials = loginData.generatePatientLogin;
          setGeneratedLogin(loginCredentials);
          toast.success(
            `Patient login password generated: ${loginCredentials.password}`,
          );
        }
      } else {
        setGeneratedLogin(null);
      }

      toast.success(
        shouldPayNow
          ? "Invoice created. Ready to record payment."
          : "Invoice created successfully!",
      );

      if (shouldPayNow && createdInvoice) {
        setSelectedInvoice(createdInvoice);
        setShowPaymentModal(true);
      }

      resetInvoiceForm(!loginCredentials);
    } catch (err) {
      toast.error(err.message || "Failed to create invoice");
    }
  };

  const handlePayment = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handleBulkPayment = () => {
    if (selectedInvoices.length === 0) {
      toast.error("Please select invoices to pay");
      return;
    }
    const totalAmount = selectedInvoices.reduce((sum, id) => {
      const inv = invoices.find((i) => i.id === id);
      return sum + (inv?.balance || 0);
    }, 0);
    toast.success(`Processing bulk payment of ₹${totalAmount.toFixed(2)}...`);
  };

  const handleExport = (format) => {
    toast.success(`Exporting billing records as ${format.toUpperCase()}...`);
  };

  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId],
    );
  };

  const handlePaymentSuccess = async () => {
    await refetch();
    toast.success("Payment processed successfully!");
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setSelectedInvoices([]);
  };

  const editSubtotal = editInvoiceForm.items.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const editTotalAmount =
    editSubtotal + (editInvoiceForm.tax || 0) - (editInvoiceForm.discount || 0);

  const handleEditItemChange = (index, field, value) => {
    const updatedItems = [...editInvoiceForm.items];
    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index][field] = parseFloat(value) || 0;
      updatedItems[index].total =
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    } else {
      updatedItems[index][field] = value;
    }
    setEditInvoiceForm({ ...editInvoiceForm, items: updatedItems });
  };

  const handleEditAddItem = () => {
    setEditInvoiceForm({
      ...editInvoiceForm,
      items: [
        ...editInvoiceForm.items,
        { description: "", quantity: 1, unitPrice: 0, total: 0 },
      ],
    });
  };

  const handleEditRemoveItem = (index) => {
    const updatedItems = editInvoiceForm.items.filter((_, i) => i !== index);
    setEditInvoiceForm({ ...editInvoiceForm, items: updatedItems });
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setEditInvoiceForm({
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      date: invoice.date ? invoice.date.split("T")[0] : format(new Date(), "yyyy-MM-dd"),
      dueDate: invoice.dueDate ? invoice.dueDate.split("T")[0] : "",
      items:
        invoice.items?.length > 0
          ? invoice.items.map((item) => ({
              description: item.description || "",
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              total: item.total || (item.quantity || 0) * (item.unitPrice || 0),
            }))
          : [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
      tax: invoice.tax || 0,
      discount: invoice.discount || 0,
      notes: invoice.notes || "",
      amountPaid: invoice.amountPaid || 0,
      status: invoice.status || "Unpaid",
    });
    setShowEditInvoice(true);
  };

  const handleEditPatientChange = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setEditInvoiceForm({
        ...editInvoiceForm,
        patientId,
        patientName: patient.name,
      });
    }
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    if (!editingInvoice) return;
    try {
      const newBalance = Math.max(
        0,
        editTotalAmount - (editInvoiceForm.amountPaid || 0),
      );
      const newStatus =
        newBalance === 0
          ? "Paid"
          : (editInvoiceForm.amountPaid || 0) > 0
            ? "Partial"
            : "Unpaid";

      await updateInvoice({
        variables: {
          id: editingInvoice.id,
          invoiceNumber: editInvoiceForm.invoiceNumber,
          patientId: editInvoiceForm.patientId,
          patientName: editInvoiceForm.patientName,
          date: editInvoiceForm.date,
          dueDate: editInvoiceForm.dueDate,
          items: editInvoiceForm.items,
          subtotal: editSubtotal,
          tax: editInvoiceForm.tax,
          discount: editInvoiceForm.discount,
          total: editTotalAmount,
          amountPaid: editInvoiceForm.amountPaid,
          balance: newBalance,
          status: editInvoiceForm.status || newStatus,
          notes: editInvoiceForm.notes,
        },
      });
      toast.success("Invoice updated successfully!");
      setShowEditInvoice(false);
      setEditingInvoice(null);
    } catch (err) {
      toast.error(err.message || "Failed to update invoice");
    }
  };

  const handleDeleteInvoice = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteInvoice({
        variables: { id: invoiceToDelete.id },
      });
      toast.success("Invoice deleted successfully!");
      setShowDeleteConfirm(false);
      setInvoiceToDelete(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete invoice");
    }
  };

  return (
    <Suspense fallback={<Preloader />}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          {...fadeIn("down")}
          className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Billing & Payments
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {user?.role === "patient"
                ? "View your invoices and payment history"
                : "Manage invoices, payments, and financial records"}
            </p>
          </div>
          {user?.role === "admin" && (
            <button
              onClick={() => {
                setGeneratedLogin(null);
                setShowCreateInvoice(true);
              }}
              className="btn-primary flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus size={20} />
              Create Invoice
            </button>
          )}
        </motion.div>

        {generatedLogin && !generatedLogin.preview && (
          <motion.div
            {...fadeIn("up", 0.05)}
            className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4"
          >
            <p className="text-sm font-semibold text-green-900">
              Patient login generated for {generatedLogin.patientName}
            </p>
            <p className="text-sm text-green-800 mt-1">
              Phone: {generatedLogin.phone} | Password:{" "}
              {generatedLogin.password}
            </p>
          </motion.div>
        )}

        {showCreateInvoice && (
          <motion.div {...fadeIn("up")} className="card mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Invoice</h2>
            <form
              onSubmit={(e) => handleCreateInvoice(e, false)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient
                  </label>
                  <select
                    className="input-field"
                    value={newInvoice.patientId}
                    onChange={(e) => handlePatientChange(e.target.value)}
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={newInvoice.date}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={newInvoice.dueDate}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, dueDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={newInvoice.tax}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        tax: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={newInvoice.discount}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        discount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <input
                    type="checkbox"
                    checked={autoGenerateLogin}
                    onChange={(e) => setAutoGenerateLogin(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Generate patient login password
                </label>
                {generatedLogin && (
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      Patient:{" "}
                      <span className="font-semibold">
                        {generatedLogin.patientName}
                      </span>
                    </p>
                    <p>
                      Login phone:{" "}
                      <span className="font-semibold">
                        {generatedLogin.phone}
                      </span>
                    </p>
                    <p>
                      Generated password:{" "}
                      <span className="font-semibold">
                        {generatedLogin.password}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {generatedLogin.preview
                        ? generatedLogin.userId
                          ? "This will reset the patient's current login to the generated password."
                          : "A new patient login will be created when the invoice is generated."
                        : generatedLogin.newlyCreated
                          ? "New patient login created successfully."
                          : "Existing patient login password updated successfully."}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {newInvoice.items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-3 items-end"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Description (e.g., Cleaning, Filling)"
                          className="input-field"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          className="input-field"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          min="1"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Price"
                          className="input-field"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, "unitPrice", e.target.value)
                          }
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-900 font-medium">
                          ₹{item.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-1">
                        {newInvoice.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">
                    ₹{newInvoice.tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium">
                    -₹{newInvoice.discount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-4 border-t border-gray-200 pt-2">
                  <span className="text-gray-900 font-bold">Total:</span>
                  <span className="text-primary text-xl font-bold">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  className="input-field min-h-[100px]"
                  value={newInvoice.notes}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, notes: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="btn-primary">
                  Generate Invoice
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={(e) => handleCreateInvoice(e, true)}
                >
                  Generate & Pay Now
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={resetInvoiceForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div {...fadeIn("up", 0.1)} className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <IndianRupee size={24} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalPending.toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {pendingCount} unpaid invoice(s)
            </p>
          </motion.div>

          <motion.div {...fadeIn("up", 0.2)} className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <CreditCard size={24} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalPaid.toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">All time payments</p>
          </motion.div>

          <motion.div {...fadeIn("up", 0.3)} className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredInvoices.length}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Generated invoices</p>
          </motion.div>
        </div>

        <motion.div {...fadeIn("up", 0.4)} className="card mb-6">
          <div className="flex items-center gap-4 mb-4 border-b border-gray-200 pb-4">
            <button
              onClick={() => setActiveTab("invoices")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "invoices"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Invoices
            </button>
            {user?.role !== "admin" && (
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "history"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Payment History
              </button>
            )}
            {user?.role === "admin" && (
              <>
                <button
                  onClick={() => setActiveTab("payment-methods")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "payment-methods"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Payment Methods
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "history"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Payment History
                </button>
              </>
            )}
          </div>

          {activeTab === "invoices" && (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search invoices..."
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
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              {user?.role === "admin" && (
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-gray-600" />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, start: e.target.value })
                      }
                      className="input-field"
                      placeholder="Start date"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, end: e.target.value })
                      }
                      className="input-field"
                      placeholder="End date"
                    />
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleExport("csv")}
                      className="btn-outline flex items-center gap-2"
                    >
                      <Download size={18} />
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExport("pdf")}
                      className="btn-outline flex items-center gap-2"
                    >
                      <Download size={18} />
                      Export PDF
                    </button>
                  </div>
                </div>
              )}

              {user?.role === "admin" && selectedInvoices.length > 0 && (
                <div className="mb-4 p-4 bg-primary/5 rounded-lg flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    {selectedInvoices.length} invoice(s) selected
                  </p>
                  <button onClick={handleBulkPayment} className="btn-primary">
                    Pay Selected (₹
                    {selectedInvoices
                      .reduce((sum, id) => {
                        const inv = invoices.find((i) => i.id === id);
                        return sum + (inv?.balance || 0);
                      }, 0)
                      .toFixed(2)}
                    )
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "payment-methods" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading text-lg font-semibold text-gray-900">
                  Saved Payment Methods
                </h3>
                <button
                  onClick={() => toast.info("Add payment method feature")}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Card
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userPaymentMethods.map((method, index) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    delay={index * 0.05}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <h3 className="font-heading text-lg font-semibold text-gray-900 mb-6">
                Payment History
              </h3>
              <div className="space-y-4">
                {filteredInvoices
                  .filter((inv) => inv.status === "Paid")
                  .map((inv, index) => (
                    <motion.div
                      key={inv.id}
                      {...fadeIn("up", index * 0.05)}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(inv.date), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ₹{inv.total.toFixed(2)}
                          </p>
                          <span className="badge badge-success">Paid</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{inv.patientName}</span>
                        <button
                          onClick={() => {
                            generateInvoicePDF(inv);
                            toast.success("Receipt downloaded successfully");
                          }}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Download size={14} />
                          Receipt
                        </button>
                      </div>
                    </motion.div>
                  ))}
                {filteredInvoices.filter((inv) => inv.status === "Paid")
                  .length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard
                      size={64}
                      className="mx-auto mb-4 text-gray-300"
                    />
                    <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                      No payment history
                    </h3>
                    <p className="text-gray-600">
                      You haven't made any payments yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {activeTab === "invoices" && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice, index) => (
                <div key={invoice.id} className="relative">
                  {user?.role === "admin" && invoice.balance > 0 && (
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => toggleInvoiceSelection(invoice.id)}
                      className="absolute top-4 left-4 z-10 w-5 h-5 rounded border-gray-300"
                    />
                  )}
                  <InvoiceCard
                    invoice={invoice}
                    delay={index * 0.05}
                    onPay={user?.role !== "doctor" ? handlePayment : undefined}
                    onEdit={
                      user?.role === "admin" || user?.role === "employee"
                        ? handleEditInvoice
                        : undefined
                    }
                    onDelete={
                      user?.role === "admin" ? handleDeleteInvoice : undefined
                    }
                  />
                </div>
              ))
            ) : (
              <motion.div
                {...fadeIn("up")}
                className="col-span-2 card text-center py-12"
              >
                <CreditCard size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                  No invoices found
                </h3>
                <p className="text-gray-600">
                  {searchTerm ||
                  filterStatus !== "All" ||
                  (user?.role === "admin" && dateRange.start)
                    ? "Try adjusting your search or filter"
                    : user?.role === "patient"
                      ? "No billing records available for you"
                      : "No billing records available"}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {showPaymentModal && selectedInvoice && (
          <PaymentModal
            invoice={selectedInvoice}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedInvoice(null);
            }}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {showEditInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-xl font-bold">Edit Invoice</h2>
                <button
                  onClick={() => {
                    setShowEditInvoice(false);
                    setEditingInvoice(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleUpdateInvoice} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={editInvoiceForm.invoiceNumber}
                      onChange={(e) =>
                        setEditInvoiceForm({
                          ...editInvoiceForm,
                          invoiceNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient
                    </label>
                    <select
                      className="input-field"
                      value={editInvoiceForm.patientId}
                      onChange={(e) => handleEditPatientChange(e.target.value)}
                      required
                    >
                      <option value="">Select Patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={editInvoiceForm.date}
                      onChange={(e) =>
                        setEditInvoiceForm({
                          ...editInvoiceForm,
                          date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={editInvoiceForm.dueDate}
                      onChange={(e) =>
                        setEditInvoiceForm({
                          ...editInvoiceForm,
                          dueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax (%)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={editInvoiceForm.tax}
                      onChange={(e) =>
                        setEditInvoiceForm({
                          ...editInvoiceForm,
                          tax: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={editInvoiceForm.discount}
                      onChange={(e) =>
                        setEditInvoiceForm({
                          ...editInvoiceForm,
                          discount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Paid
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={editInvoiceForm.amountPaid}
                      onChange={(e) =>
                        setEditInvoiceForm({
                          ...editInvoiceForm,
                          amountPaid: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      className="input-field"
                      value={editInvoiceForm.status}
                      onChange={(e) =>
                        setEditInvoiceForm({
                          ...editInvoiceForm,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partial">Partial</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Items
                    </label>
                    <button
                      type="button"
                      onClick={handleEditAddItem}
                      className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editInvoiceForm.items.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-end"
                      >
                        <div className="col-span-5">
                          <input
                            type="text"
                            placeholder="Description (e.g., Cleaning, Filling)"
                            className="input-field"
                            value={item.description}
                            onChange={(e) =>
                              handleEditItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            className="input-field"
                            value={item.quantity}
                            onChange={(e) =>
                              handleEditItemChange(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                            min="1"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Price"
                            className="input-field"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleEditItemChange(
                                index,
                                "unitPrice",
                                e.target.value,
                              )
                            }
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-900 font-medium">
                            ₹{item.total.toFixed(2)}
                          </p>
                        </div>
                        <div className="col-span-1">
                          {editInvoiceForm.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleEditRemoveItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      ₹{editSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">
                      ₹{(editInvoiceForm.tax || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium">
                      -₹{(editInvoiceForm.discount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 border-t border-gray-200 pt-2">
                    <span className="text-gray-900 font-bold">Total:</span>
                    <span className="text-primary text-xl font-bold">
                      ₹{editTotalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-medium text-success">
                      ₹{(editInvoiceForm.amountPaid || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 border-t border-gray-200 pt-2">
                    <span className="text-gray-900 font-bold">Balance:</span>
                    <span
                      className={`text-xl font-bold ${
                        editTotalAmount - (editInvoiceForm.amountPaid || 0) > 0
                          ? "text-danger"
                          : "text-success"
                      }`}
                    >
                      ₹
                      {Math.max(
                        0,
                        editTotalAmount -
                          (editInvoiceForm.amountPaid || 0),
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    className="input-field min-h-[100px]"
                    value={editInvoiceForm.notes}
                    onChange={(e) =>
                      setEditInvoiceForm({
                        ...editInvoiceForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      setShowEditInvoice(false);
                      setEditingInvoice(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Invoice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showDeleteConfirm && invoiceToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Delete Invoice
                  </h3>
                  <p className="text-sm text-gray-500">
                    {invoiceToDelete.invoiceNumber}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this invoice? This action
                cannot be undone and will permanently remove the invoice
                record for <span className="font-medium">{invoiceToDelete.patientName}</span>.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setInvoiceToDelete(null);
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteInvoice}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Suspense>
  );
};

export default Billing;
