import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
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
import { GET_INVOICES, GET_PATIENTS } from "../graphql/queries";
import { CREATE_INVOICE } from "../graphql/mutations";

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

  const { loading, error, data } = useQuery(GET_INVOICES);
  const { data: patientsData } = useQuery(GET_PATIENTS, {
    variables: { page: 1, limit: 100 },
  });
  const [createInvoice] = useMutation(CREATE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  if (loading) return <div className="p-6 text-center">Loading billing...</div>;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const allInvoices = data?.getInvoices || [];
  const patients = patientsData?.getPatients?.patients || [];

  // Filter invoices for patients - only show their own invoices
  const invoices =
    user?.role === "patient"
      ? allInvoices.filter((inv) =>
          inv.patientName.toLowerCase().includes(user.name.toLowerCase()),
        )
      : allInvoices;

  const paymentMethods = []; // Mocked as empty for now until model is ready
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

  // Calculate totals based on filtered invoices for patients
  const totalPending = filteredInvoices
    .filter((inv) => inv.balance > 0)
    .reduce((sum, inv) => sum + inv.balance, 0);

  const totalPaid = filteredInvoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingCount = filteredInvoices.filter((inv) => inv.balance > 0).length;

  // Calculate subtotal and total
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
      setNewInvoice({
        ...newInvoice,
        patientId,
        patientName: patient.name,
      });
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await createInvoice({
        variables: {
          ...newInvoice,
          subtotal,
          total: totalAmount,
          balance: totalAmount,
        },
      });
      toast.success("Invoice created successfully!");
      setShowCreateInvoice(false);
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
    } catch (err) {
      toast.error("Failed to create invoice");
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

  const handlePaymentSuccess = (paymentIntent) => {
    toast.success("Payment processed successfully!");
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setSelectedInvoices([]);
  };

  return (
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
            onClick={() => setShowCreateInvoice(true)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={20} />
            Create Invoice
          </button>
        )}
      </motion.div>

      {showCreateInvoice && (
        <motion.div {...fadeIn("up")} className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Invoice</h2>
          <form onSubmit={handleCreateInvoice} className="space-y-6">
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
                          handleItemChange(index, "description", e.target.value)
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
                onClick={() => setShowCreateInvoice(false)}
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
              <DollarSign size={24} className="text-warning" />
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
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
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
                        onClick={() => toast.success("Downloading receipt...")}
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
    </div>
  );
};

export default Billing;
