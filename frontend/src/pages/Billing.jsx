import { Suspense, useState, useEffect } from "react";
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
  Loader2,
  MessageCircle,
  ExternalLink,
  Copy,
  Pencil,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fadeIn, staggerContainer } from "../utils/motion";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useQuery, useMutation } from "@apollo/client";
import { GET_INVOICES, GET_MY_PATIENT, GET_PATIENTS } from "../graphql/queries";
import {
  CREATE_INVOICE,
  GENERATE_PATIENT_LOGIN,
  UPDATE_INVOICE,
  DELETE_INVOICE,
  SEND_INVOICE_WHATSAPP,
  SEND_LOGIN_CREDENTIALS_WHATSAPP,
  RECORD_INVOICE_PAYMENT,
} from "../graphql/mutations";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import Preloader from "../components/Preloader";
const PageHeader = lazy(() => import("../components/PageHeader"));
const InvoiceCard = lazy(() => import("../components/InvoiceCard"));
const PaymentModal = lazy(() => import("../components/PaymentModal"));
const PaymentMethodCard = lazy(() => import("../components/PaymentMethodCard"));

import {
  invoices as mockInvoices,
  patients as mockPatients,
} from "../data/mockData";
import { lazy } from "react";

const Billing = () => {
  const { user, isDemoUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  const [demoInvoiceList, setDemoInvoiceList] = useState([...mockInvoices]);
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { loading, error, data, refetch } = useQuery(GET_INVOICES, {
    skip: isDemoUser,
  });
  const { data: patientsData } = useQuery(GET_PATIENTS, {
    variables: { page: 1, limit: 100 },
    skip: isDemoUser,
  });
  const { data: myPatientData } = useQuery(GET_MY_PATIENT, {
    skip: user?.role !== "patient" || isDemoUser,
  });
  const [recordInvoicePayment] = useMutation(RECORD_INVOICE_PAYMENT);
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
  const [sendInvoiceWhatsApp] = useMutation(SEND_INVOICE_WHATSAPP);
  const [sendLoginCredentialsWhatsApp] = useMutation(
    SEND_LOGIN_CREDENTIALS_WHATSAPP,
  );

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
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [whatsAppPreviewData, setWhatsAppPreviewData] = useState(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sharingWhatsAppInvoice, setSharingWhatsAppInvoice] = useState(null);
  const [sharingLoginViaWA, setSharingLoginViaWA] = useState(null);
  const [selectedPatientForPayment, setSelectedPatientForPayment] =
    useState(null);
  const [iciciCallbackNotice, setIciciCallbackNotice] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("paymentStatus");
    const invoiceId = params.get("invoiceId");
    const transactionId = params.get("transactionId");
    const hashValid = params.get("hashValid");
    const paymentConfirmed = params.get("paymentConfirmed") === "1";
    const callbackProcessed = params.get("callbackProcessed") === "1";
    const error = params.get("error");

    if (paymentStatus && (invoiceId || transactionId)) {
      const statusLabels = {
        SUC: paymentConfirmed
          ? "Payment completed successfully!"
          : "Payment return received. We are waiting for bank confirmation.",
        REJ: "Payment was rejected by the bank.",
        ERR: "Payment encountered an error.",
        REQ: "Payment is still being processed.",
        PENDING: "Payment is pending completion.",
      };
      const statusIcon =
        paymentStatus === "SUC" && paymentConfirmed && hashValid === "1"
          ? "success"
          : paymentStatus === "SUC" ||
              paymentStatus === "REQ" ||
              paymentStatus === "PENDING"
            ? "info"
            : "error";
      const message =
        statusLabels[paymentStatus] ||
        (error
          ? decodeURIComponent(error)
          : "Payment status received from ICICI Bank.");

      setIciciCallbackNotice({
        status: paymentStatus,
        invoiceId,
        transactionId,
        hashValid: hashValid === "1",
        paymentConfirmed,
        callbackProcessed,
        message,
        icon: statusIcon,
      });

      if (statusIcon === "success") {
        toast.success(message);
      } else if (statusIcon === "info") {
        toast(message, { icon: "ℹ️" });
      } else {
        toast.error(message);
      }

      refetch?.().catch(() => {});

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("paymentStatus");
      cleanUrl.searchParams.delete("invoiceId");
      cleanUrl.searchParams.delete("transactionId");
      cleanUrl.searchParams.delete("hashValid");
      cleanUrl.searchParams.delete("callbackProcessed");
      cleanUrl.searchParams.delete("paymentConfirmed");
      cleanUrl.searchParams.delete("error");
      window.history.replaceState({}, document.title, cleanUrl.toString());

      setTimeout(() => setIciciCallbackNotice(null), 12000);
    }
  }, [refetch]);

  const allInvoices = isDemoUser ? demoInvoiceList : data?.getInvoices || [];
  const patients = isDemoUser
    ? mockPatients
    : patientsData?.getPatients?.patients || [];
  const myPatient = isDemoUser
    ? { id: user?.id, ...user }
    : myPatientData?.getMyPatient;

  useEffect(() => {
    const invoiceId = new URLSearchParams(window.location.search).get("invoiceId");
    if (!invoiceId || !allInvoices.length || selectedInvoice) return;
    const invoice = allInvoices.find((item) => String(item.id) === invoiceId);
    if (!invoice || invoice.balance <= 0) return;
    setSelectedInvoice(invoice);
    setSelectedPatientForPayment(
      patients.find((patient) => patient.id === invoice.patientId) || myPatient || null,
    );
    setShowPaymentModal(true);
  }, [allInvoices, myPatient, patients, selectedInvoice]);

  if (!isDemoUser && loading) return <Preloader />;
  if (!isDemoUser && error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const enrichInvoiceWithPatient = (invoice) => ({
    ...invoice,
    patient: patients.find(
      (patient) => String(patient.id) === String(invoice.patientId),
    ),
  });
  const buildPatientPassword = (phone = "") =>
    `${new Date().getFullYear()}${phone.slice(-4)}`;

  const invoices =
    user?.role === "patient" && myPatient
      ? allInvoices.filter(
          (inv) => inv.patientId === myPatient.id || inv.patientId === 1,
        )
      : allInvoices;

  const callbackInvoice = iciciCallbackNotice?.invoiceId
    ? invoices.find(
        (invoice) =>
          String(invoice.id) === String(iciciCallbackNotice.invoiceId),
      )
    : null;

  const paymentMethods = [];
  const userPaymentMethods = paymentMethods;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(debouncedSearch.toLowerCase());
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
        const patient =
          patients.find((p) => p.id === createdInvoice.patientId) ||
          myPatient ||
          null;
        setSelectedPatientForPayment(patient);
        setShowPaymentModal(true);
      }

      resetInvoiceForm(!loginCredentials);
    } catch (err) {
      toast.error(err.message || "Failed to create invoice");
    }
  };

  const handlePayment = (invoice) => {
    setSelectedInvoice(invoice);
    const patient =
      patients.find(
        (p) =>
          p.id === invoice.patientId ||
          (myPatient && myPatient.id === invoice.patientId),
      ) ||
      myPatient ||
      null;
    setSelectedPatientForPayment(patient);
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

  const handleDemoPaymentSuccess = (paymentInfo) => {
    if (!selectedInvoice) return;
    const paymentAmount = paymentInfo?.amount || selectedInvoice.balance;
    const updated = demoInvoiceList.map((inv) => {
      if (inv.id !== selectedInvoice.id) return inv;
      const amountPaid = (inv.amountPaid || 0) + paymentAmount;
      const total = inv.total || 0;
      const balance = Math.max(0, total - amountPaid);
      const status =
        balance <= 0
          ? "Paid"
          : amountPaid > 0
            ? "Partial"
            : inv.status || "Unpaid";
      return {
        ...inv,
        amountPaid,
        balance,
        status,
        paymentDate: paymentInfo?.paymentDate || new Date().toISOString(),
        paymentMethod: paymentInfo?.paymentMethod || inv.paymentMethod,
      };
    });
    setDemoInvoiceList(updated);
    toast.success("Payment recorded successfully (Demo mode).");
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setSelectedInvoices([]);
    setSelectedPatientForPayment(null);
  };

  const handlePaymentSuccess = async (paymentInfo) => {
    if (isDemoUser) {
      handleDemoPaymentSuccess(paymentInfo);
      return;
    }

    try {
      await refetch();
    } catch (error) {
      console.warn("Failed to refresh invoice after payment:", error.message);
    }

    toast.success("Payment processed successfully!");
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setSelectedInvoices([]);
    setSelectedPatientForPayment(null);
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
      date: invoice.date
        ? invoice.date.split("T")[0]
        : format(new Date(), "yyyy-MM-dd"),
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

  const handleShareInvoiceWhatsApp = async (invoice) => {
    setSharingWhatsAppInvoice(invoice.id);
    try {
      const { data } = await sendInvoiceWhatsApp({
        variables: {
          invoiceId: invoice.id,
          patientId: invoice.patientId,
        },
      });
      const result = data?.sendInvoiceWhatsApp;
      if (result?.success) {
        toast.success(
          result.skipped
            ? "Message ready (WhatsApp not configured on server)"
            : `Invoice details sent via WhatsApp to ${result.patientName || "patient"}`,
        );
        if (result.messagePreview) {
          setWhatsAppPreviewData({
            title: "Invoice WhatsApp Message",
            message: result.messagePreview,
            phone: result.phone,
          });
          setShowWhatsAppPreview(true);
        }
      } else if (result?.skipped) {
        setWhatsAppPreviewData({
          title: "Invoice WhatsApp Message (Preview - Not Sent)",
          message: result.messagePreview || "Message content",
          phone: result.phone,
          note: "WhatsApp not configured on server. Configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
        });
        setShowWhatsAppPreview(true);
        toast("WhatsApp not configured on server. Preview available instead.", {
          icon: "ℹ️",
        });
      } else {
        toast.error(result?.error || "Failed to send WhatsApp message");
      }
    } catch (err) {
      toast.error(err.message || "Failed to send WhatsApp message");
    } finally {
      setSharingWhatsAppInvoice(null);
    }
  };

  const handleShareLoginWhatsApp = async (credentials) => {
    if (!credentials) return;
    setSharingLoginViaWA(credentials.patientId);
    try {
      const { data } = await sendLoginCredentialsWhatsApp({
        variables: {
          patientId: credentials.patientId,
          patientName: credentials.patientName,
          phone: credentials.phone,
          password: credentials.password,
        },
      });
      const result = data?.sendLoginCredentialsWhatsApp;
      if (result?.success) {
        toast.success(
          result.skipped
            ? "Login message ready (WhatsApp not configured on server)"
            : `Login credentials sent via WhatsApp to ${credentials.patientName}`,
        );
        if (result.messagePreview) {
          setWhatsAppPreviewData({
            title: "Login Credentials WhatsApp Message",
            message: result.messagePreview,
            phone: result.phone,
          });
          setShowWhatsAppPreview(true);
        }
      } else if (result?.skipped) {
        setWhatsAppPreviewData({
          title: "Login WhatsApp Message (Preview - Not Sent)",
          message: result.messagePreview || "Message content",
          phone: result.phone,
          note: "WhatsApp not configured on server. Configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
        });
        setShowWhatsAppPreview(true);
        toast("WhatsApp not configured on server. Preview available instead.", {
          icon: "ℹ️",
        });
      } else {
        toast.error(result?.error || "Failed to send WhatsApp message");
      }
    } catch (err) {
      toast.error(err.message || "Failed to send WhatsApp message");
    } finally {
      setSharingLoginViaWA(null);
    }
  };

  const handleDirectWhatsAppShare = (phone, text) => {
    const digitsOnly = (phone || "").replace(/\D/g, "").slice(-10);
    const waPhone = digitsOnly ? `91${digitsOnly}` : "";
    const encodedText = encodeURIComponent(text || "");
    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Suspense fallback={<Preloader />}>
      <div className="max-w-7xl mx-auto">
        {iciciCallbackNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${
              iciciCallbackNotice.status === "SUC"
                ? "border-green-200 bg-green-50"
                : iciciCallbackNotice.status === "REQ" ||
                    iciciCallbackNotice.status === "PENDING"
                  ? "border-blue-200 bg-blue-50"
                  : "border-red-200 bg-red-50"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                iciciCallbackNotice.status === "SUC"
                  ? "bg-green-100"
                  : iciciCallbackNotice.status === "REQ" ||
                      iciciCallbackNotice.status === "PENDING"
                    ? "bg-blue-100"
                    : "bg-red-100"
              }`}
            >
              {iciciCallbackNotice.status === "SUC" ? (
                <CheckCircle size={18} className="text-green-700" />
              ) : iciciCallbackNotice.status === "REQ" ||
                iciciCallbackNotice.status === "PENDING" ? (
                <Loader2 size={18} className="text-blue-700 animate-spin" />
              ) : (
                <AlertCircle size={18} className="text-red-700" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`font-semibold text-sm ${
                  iciciCallbackNotice.status === "SUC"
                    ? "text-green-900"
                    : iciciCallbackNotice.status === "REQ" ||
                        iciciCallbackNotice.status === "PENDING"
                      ? "text-blue-900"
                      : "text-red-900"
                }`}
              >
                ICICI Bank Payment — Status: {iciciCallbackNotice.status}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {iciciCallbackNotice.message}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                {iciciCallbackNotice.invoiceId && (
                  <span>
                    Invoice: {String(iciciCallbackNotice.invoiceId).slice(-8)}
                  </span>
                )}
                {iciciCallbackNotice.transactionId && (
                  <span>
                    Txn: {String(iciciCallbackNotice.transactionId).slice(-10)}
                  </span>
                )}
                {typeof iciciCallbackNotice.hashValid === "boolean" && (
                  <span>
                    Secure Hash:{" "}
                    <span
                      className={
                        iciciCallbackNotice.hashValid
                          ? "text-green-700 font-medium"
                          : "text-red-700 font-medium"
                      }
                    >
                      {iciciCallbackNotice.hashValid ? "Verified" : "Mismatch"}
                    </span>
                  </span>
                )}
              </div>
              {iciciCallbackNotice.status === "SUC" && callbackInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    generateInvoicePDF({
                      ...enrichInvoiceWithPatient(callbackInvoice),
                      status: "Paid",
                      paymentMethod: "ICICI Bank",
                      paymentDate: new Date().toISOString(),
                      transactionId: iciciCallbackNotice.transactionId,
                    });
                    toast.success("Bill downloaded successfully");
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
                >
                  <Download size={16} />
                  Download Bill
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIciciCallbackNotice(null)}
              className="p-1 hover:bg-white/50 rounded text-gray-500"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}

        <PageHeader
          title="Billing & Payments"
          subtitle={
            user?.role === "patient"
              ? "View your invoices and payment history"
              : "Manage invoices, payments, and financial records"
          }
          action={
            user?.role === "admin" && (
              <button
                onClick={() => {
                  setGeneratedLogin(null);
                  setShowCreateInvoice(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                Create Invoice
              </button>
            )
          }
        />

        {generatedLogin && !generatedLogin.preview && (
          <motion.div
            {...fadeIn("up", 0.05)}
            className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Patient login generated for {generatedLogin.patientName}
                </p>
                <p className="text-sm text-green-800 mt-1">
                  Phone: {generatedLogin.phone} | Password:{" "}
                  <span className="font-semibold">
                    {generatedLogin.password}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleShareLoginWhatsApp(generatedLogin)}
                  disabled={sharingLoginViaWA === generatedLogin.patientId}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {sharingLoginViaWA === generatedLogin.patientId ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MessageCircle size={16} />
                  )}
                  Send WhatsApp
                </button>
                <button
                  onClick={() => {
                    const loginMsg = `🏥 CREADENT DENTAL CLINIC\n\nDear ${generatedLogin.patientName},\n\nYour secure patient portal login:\n📱 Mobile: ${generatedLogin.phone}\n🔑 Password: ${generatedLogin.password}\n\n🔐 Login here: https://creadentsmiles.com/login\n\nAfter login, go to Billing & Payments to pay invoices.\n\nRegards,\nTeam Creadent`;
                    handleDirectWhatsAppShare(generatedLogin.phone, loginMsg);
                  }}
                  className="flex items-center gap-2 px-3 py-2 border border-green-500 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                >
                  <ExternalLink size={16} />
                  Open WA
                </button>
                <button
                  onClick={() => {
                    const text = `Patient Login - ${generatedLogin.patientName}\nPhone: ${generatedLogin.phone}\nPassword: ${generatedLogin.password}\nLogin: https://creadentsmiles.com/login`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(text);
                      toast.success("Credentials copied to clipboard");
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 border border-green-500 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>
            </div>
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
                  <div className="text-sm text-gray-700 space-y-2">
                    <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-1">
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
                        <span className="font-semibold text-primary">
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
                    {!generatedLogin.preview && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            handleShareLoginWhatsApp(generatedLogin)
                          }
                          disabled={
                            sharingLoginViaWA === generatedLogin.patientId
                          }
                          className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {sharingLoginViaWA === generatedLogin.patientId ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <MessageCircle size={16} />
                          )}
                          Send Login via WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const loginMsg = `🏥 CREADENT DENTAL CLINIC\n\nDear ${generatedLogin.patientName},\n\nYour secure patient portal login:\n📱 Mobile: ${generatedLogin.phone}\n🔑 Password: ${generatedLogin.password}\n\n🔐 Login here: https://creadentsmiles.com/login\n\nAfter login, visit Billing & Payments to pay invoices online.\n\nRegards,\nTeam Creadent Dental Clinic`;
                            handleDirectWhatsAppShare(
                              generatedLogin.phone,
                              loginMsg,
                            );
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 border border-green-500 text-green-700 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors"
                          title="Open WhatsApp Web directly"
                        >
                          <ExternalLink size={16} />
                          Open WA
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const text = `Patient Login for ${generatedLogin.patientName}\nPhone: ${generatedLogin.phone}\nPassword: ${generatedLogin.password}\nLogin: https://creadentsmiles.com/login`;
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(text);
                              toast.success(
                                "Login credentials copied to clipboard",
                              );
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    )}
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
                            Invoice date: {format(new Date(inv.date), "dd/MM/yyyy")}
                          </p>
                          <p className="text-sm text-success">
                            Paid date: {format(
                              new Date(inv.paymentDate || inv.date),
                              "dd/MM/yyyy",
                            )}
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
                            generateInvoicePDF(enrichInvoiceWithPatient(inv));
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
                    invoice={enrichInvoiceWithPatient(invoice)}
                    delay={index * 0.05}
                    onPay={user?.role !== "doctor" ? handlePayment : undefined}
                    onShareWhatsApp={
                      user?.role === "admin" || user?.role === "employee"
                        ? handleShareInvoiceWhatsApp
                        : undefined
                    }
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
            patient={selectedPatientForPayment}
            isDemo={false}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedInvoice(null);
              setSelectedPatientForPayment(null);
            }}
            onSuccess={(paymentInfo) => handlePaymentSuccess(paymentInfo)}
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
                        editTotalAmount - (editInvoiceForm.amountPaid || 0),
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
                Are you sure you want to delete this invoice? This action cannot
                be undone and will permanently remove the invoice record for{" "}
                <span className="font-medium">
                  {invoiceToDelete.patientName}
                </span>
                .
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

        {showWhatsAppPreview && whatsAppPreviewData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 border-b border-gray-200 flex items-start justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={22} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {whatsAppPreviewData.title}
                    </h3>
                    {whatsAppPreviewData.phone && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        Recipient: +{whatsAppPreviewData.phone}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowWhatsAppPreview(false);
                    setWhatsAppPreviewData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {whatsAppPreviewData.note && (
                <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ {whatsAppPreviewData.note}
                  </p>
                </div>
              )}

              <div className="p-5">
                <div className="bg-[#e5ddd5] rounded-xl p-4 shadow-inner">
                  <div className="bg-white rounded-xl p-4 shadow-sm max-w-full">
                    <div className="flex items-start justify-between mb-3 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          C
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            Creadent Dental Clinic
                          </p>
                          <p className="text-[10px] text-gray-400">
                            via WhatsApp Business
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date().toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-sans leading-relaxed">
                      {whatsAppPreviewData.message}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-200 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={() => {
                    handleDirectWhatsAppShare(
                      whatsAppPreviewData.phone
                        ? whatsAppPreviewData.phone
                            .replace(/^91/, "")
                            .slice(-10)
                        : "",
                      whatsAppPreviewData.message,
                    );
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <ExternalLink size={16} />
                  Open in WhatsApp
                </button>
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(
                        whatsAppPreviewData.message,
                      );
                      toast.success("Message copied to clipboard");
                    }
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  <Copy size={16} />
                  Copy Message
                </button>
                <button
                  onClick={() => {
                    setShowWhatsAppPreview(false);
                    setWhatsAppPreviewData(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Close
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
