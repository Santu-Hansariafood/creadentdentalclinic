const User = require("../models/User");
const Medicine = require("../models/Medicine");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const Invoice = require("../models/Invoice");
const Prescription = require("../models/Prescription");
const PaymentLedger = require("../models/PaymentLedger");
const Conversation = require("../models/Conversation");
const ChatMessage = require("../models/ChatMessage");
const Notification = require("../models/Notification");
const Transaction = require("../models/Transaction");
const generateToken = require("../utils/generateToken");
const storageService = require("../utils/storageService");
const {
  sendAppointmentBookingNotifications,
} = require("../utils/appointmentNotifications");
const { sendPrescriptionEmail } = require("../utils/emailService");
const {
  sendInvoiceWhatsApp,
  sendLoginCredentialsWhatsApp,
} = require("../utils/whatsappNotifications");
const {
  initiateSale,
  generateOTP,
  verifyOTP,
  authorizeTransaction,
  getTransactionStatus,
  processRefund,
} = require("../utils/iciciPaymentService");

const generatePatientPassword = (phone = "") => {
  const currentYear = new Date().getFullYear().toString();
  const last4Digits = phone.slice(-4);
  return `${currentYear}${last4Digits}`;
};

const toIsoDateString = (value) => {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
};

const toDateOnlyString = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

const getSelfPatient = async (user) => {
  if (!user) throw new Error("Not authenticated");
  return await Patient.findOne({ userId: user._id });
};

const requireStaff = (user) => {
  if (!user || !["admin", "employee", "doctor"].includes(user.role)) {
    throw new Error("Unauthorized: Staff access required");
  }
};

const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  verified: user.verified,
  specialization: user.specialization,
  license: user.license,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const serializeAttachment = async (att) => {
  if (!att) return null;
  const obj = att && att.toObject ? att.toObject() : { ...att };
  const storageKey = obj.storageKey;
  let url = obj.url || null;
  if (!url && storageKey) {
    try {
      url = await storageService.getPresignedUrl(storageKey);
    } catch (_) {
      url = url || `/files/${encodeURIComponent(storageKey)}`;
    }
  }
  return {
    storageKey: obj.storageKey,
    name: obj.name,
    originalName: obj.originalName || obj.name,
    size: obj.size,
    type: obj.type,
    url,
    uploadedAt: obj.uploadedAt ? new Date(obj.uploadedAt).toISOString() : null,
  };
};

const serializeAttachments = async (attachments) => {
  if (!Array.isArray(attachments)) return [];
  const results = [];
  for (const att of attachments) {
    const s = await serializeAttachment(att);
    if (s) results.push(s);
  }
  return results;
};

const resolvers = {
  Appointment: {
    date: (parent) => toIsoDateString(parent.date),
  },
  MedicalRecord: {
    id: (parent) => (parent.id || parent._id)?.toString(),
    patientId: (parent) => (parent.patientId?._id || parent.patientId)?.toString?.() ?? parent.patientId,
    doctorId: (parent) => (parent.doctorId?._id || parent.doctorId)?.toString?.() ?? parent.doctorId,
    date: (parent) => toIsoDateString(parent.date),
    followUpDate: (parent) => (parent.followUpDate ? toIsoDateString(parent.followUpDate) : null),
    createdAt: (parent) => (parent.createdAt ? new Date(parent.createdAt).toISOString() : null),
    updatedAt: (parent) => (parent.updatedAt ? new Date(parent.updatedAt).toISOString() : null),
    attachments: async (parent) => await serializeAttachments(parent.attachments),
    patient: async (parent) => {
      try {
        let p = parent.patient;
        if (!p && parent.patientId) {
          p = await Patient.findById(parent.patientId);
        }
        if (!p) return null;
        const po = p.toObject ? p.toObject() : { ...p };
        return {
          ...po,
          id: (po._id || po.id)?.toString?.() ?? po.id,
          userId: po.userId?.toString?.() ?? po.userId,
          dateOfBirth: toDateOnlyString(po.dateOfBirth),
          dentalHistory: po.dentalHistory
            ? {
                ...po.dentalHistory,
                lastVisit: toDateOnlyString(po.dentalHistory.lastVisit),
              }
            : null,
          insurance: po.insurance
            ? {
                ...po.insurance,
                expiryDate: toDateOnlyString(po.insurance.expiryDate),
              }
            : null,
        };
      } catch (_) {
        return null;
      }
    },
  },
  Prescription: {
    id: (parent) => (parent.id || parent._id)?.toString(),
    date: (parent) => toIsoDateString(parent.date),
    patient: async (parent) => {
      try {
        const p = await Patient.findById(parent.patientId);
        if (!p) return null;
        return {
          ...p.toObject(),
          id: p._id.toString(),
          userId: p.userId?.toString(),
          dateOfBirth: toDateOnlyString(p.dateOfBirth),
        };
      } catch {
        return null;
      }
    },
  },
  Patient: {
    id: (parent) => (parent.id || parent._id)?.toString(),
    dateOfBirth: (parent) => toDateOnlyString(parent.dateOfBirth),
    userId: (parent) => parent.userId?.toString(),
    dentalHistory: (parent) =>
      parent.dentalHistory
        ? {
            ...parent.dentalHistory,
            lastVisit: toDateOnlyString(parent.dentalHistory.lastVisit),
          }
        : null,
    insurance: (parent) =>
      parent.insurance
        ? {
            ...parent.insurance,
            expiryDate: toDateOnlyString(parent.insurance.expiryDate),
          }
        : null,
  },
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return serializeUser(user);
    },
    getUsers: async () => await User.find(),
    getUsersByRole: async (_, { role }) => await User.find({ role }),
    getUser: async (_, { id }) => await User.findById(id),
    getMedicines: async (_, { page = 1, limit = 10, search = "" }) => {
      const skip = (page - 1) * limit;
      const query = search ? { name: { $regex: search, $options: "i" } } : {};
      const medicines = await Medicine.find(query).skip(skip).limit(limit);
      const totalCount = await Medicine.countDocuments(query);
      return {
        medicines,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },
    getMedicine: async (_, { id }) => await Medicine.findById(id),
    getMedicineCategories: async () => {
      const medicines = await Medicine.find();
      const categories = [...new Set(medicines.map((m) => m.category))];
      return categories.length > 0
        ? categories
        : [
            "Antibiotic",
            "Analgesic",
            "Antiseptic",
            "Anesthetic",
            "Anti-inflammatory",
            "Other",
          ];
    },
    getPatients: async (_, { page = 1, limit = 10, search = "" }, { user }) => {
      if (user?.role === "patient") {
        const patient = await getSelfPatient(user);
        return {
          patients: patient ? [patient] : [],
          totalCount: patient ? 1 : 0,
          totalPages: patient ? 1 : 0,
          currentPage: page,
        };
      }
      requireStaff(user);
      const skip = (page - 1) * limit;
      const query = search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { phone: { $regex: search, $options: "i" } },
              { patientId: { $regex: search, $options: "i" } },
            ],
          }
        : {};
      const patients = await Patient.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const totalCount = await Patient.countDocuments(query);
      return {
        patients,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },
    getPatient: async (_, { id }, { user }) => {
      if (user?.role === "patient") {
        const patient = await getSelfPatient(user);
        if (!patient || patient._id.toString() !== id.toString()) {
          throw new Error("Unauthorized: You can only access your own profile");
        }
        return patient;
      }
      requireStaff(user);
      return await Patient.findById(id);
    },
    getMyPatient: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await Patient.findOne({ userId: user._id });
    },
    checkPatientExists: async (_, { phone, email }) => {
      const normalizedPhone = (phone || "").replace(/\D/g, "").slice(-10);
      const normalizedEmail = email?.trim().toLowerCase();

      if (normalizedPhone.length === 10) {
        const patientPhoneExists = await Patient.exists({
          phone: normalizedPhone,
        });
        if (patientPhoneExists) return true;
        const userPhoneExists = await User.exists({ phone: normalizedPhone });
        if (userPhoneExists) return true;
      }

      if (normalizedEmail) {
        const escapedEmail = normalizedEmail.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        const userEmailExists = await User.exists({
          email: { $regex: `^${escapedEmail}$`, $options: "i" },
        });
        if (userEmailExists) return true;
      }

      return false;
    },
    findPatientByNameAndPhone: async (_, { name, phone }) => {
      const normalizedName = name.trim().toLowerCase();
      const patient = await Patient.findOne({
        phone,
      }).collation({ locale: "en", strength: 2 });
      if (!patient) return null;
      if (patient.name.trim().toLowerCase() === normalizedName) {
        return patient;
      }
      return null;
    },
    findPatientByNameAndEmail: async (_, { name, email }) => {
      if (!email) return null;
      const normalizedName = name.trim().toLowerCase();
      const normalizedEmail = email.trim().toLowerCase();
      const patient = await Patient.findOne({
        email: normalizedEmail,
      }).collation({ locale: "en", strength: 2 });
      if (!patient) return null;
      if (patient.name.trim().toLowerCase() === normalizedName) {
        return patient;
      }
      return null;
    },
    findPatientsByNameOrContact: async (_, { name, email, phone }) => {
      const normalizedName = name?.trim();
      const normalizedEmail = email?.trim().toLowerCase();
      const normalizedPhone = phone?.trim();

      if (!normalizedName && !normalizedEmail && !normalizedPhone) return [];

      const and = [];
      if (normalizedName) {
        and.push({
          name: {
            $regex: normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        });
      }
      const or = [];
      if (normalizedPhone) {
        or.push({ phone: normalizedPhone });
      }
      if (normalizedEmail) {
        or.push({
          email: {
            $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        });
      }
      const query = {};
      if (and.length) query.$and = and;
      if (or.length) query.$or = or;
      if (!and.length && !or.length) return [];
      return await Patient.find(query).sort({ createdAt: -1 }).limit(10);
    },
    getAppointments: async (
      _,
      { page = 1, limit = 10, search = "", status = "All", patientId },
      { user },
    ) => {
      if (user?.role === "patient") {
        const patient = await getSelfPatient(user);
        if (!patient) {
          return { appointments: [], totalCount: 0, totalPages: 0, currentPage: page };
        }
        patientId = patient._id;
      } else {
        requireStaff(user);
      }
      const skip = (page - 1) * limit;
      const query = {};
      if (status && status !== "All") {
        query.status = status;
      }
      if (patientId) {
        query.patientId = patientId;
      }
      if (search) {
        query.$or = [
          { patientName: { $regex: search, $options: "i" } },
          { doctorName: { $regex: search, $options: "i" } },
          { type: { $regex: search, $options: "i" } },
        ];
      }
      const appointments = await Appointment.find(query)
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(limit);
      const totalCount = await Appointment.countDocuments(query);
      return {
        appointments,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },
    getMedicalRecords: async (_, { patientId }, { user }) => {
      if (user?.role === "patient") {
        const patient = await getSelfPatient(user);
        if (!patient) return [];
        patientId = patient._id;
      } else {
        requireStaff(user);
      }
      const query = {};
      if (patientId) query.patientId = patientId;
      return await MedicalRecord.find(query).sort({ date: -1 });
    },
    getInvoices: async (_, { patientId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const query = {};
      if (user.role === "patient") {
        const patient = await Patient.findOne({ userId: user._id });
        if (!patient) return [];
        query.patientId = patient._id;
      } else if (patientId) {
        query.patientId = patientId;
      }
      return await Invoice.find(query).sort({
        date: -1,
      });
    },
    getPrescriptions: async (_, { patientId }, { user }) => {
      if (user?.role === "patient") {
        const patient = await getSelfPatient(user);
        if (!patient) return [];
        patientId = patient._id;
      } else {
        requireStaff(user);
      }
      const query = {};
      if (patientId) query.patientId = patientId;
      return await Prescription.find(query).sort({ date: -1 });
    },
    getPaymentLedgers: async (_, { page = 1, limit = 10, search = "" }, { user }) => {
      requireStaff(user);
      const skip = (page - 1) * limit;
      const query = search
        ? {
            $or: [
              { treatmentName: { $regex: search, $options: "i" } },
              { paymentMode: { $regex: search, $options: "i" } },
              { referenceNo: { $regex: search, $options: "i" } },
            ],
          }
        : {};
      const paymentLedgers = await PaymentLedger.find(query)
        .sort({ slNo: 1 })
        .skip(skip)
        .limit(limit);
      const totalCount = await PaymentLedger.countDocuments(query);
      const totalsByDate = await PaymentLedger.find(query).select(
        "paymentDate paymentAmount",
      );
      const dateWiseTotals = totalsByDate.reduce((totals, ledger) => {
        const date = new Date(ledger.paymentDate).toISOString().slice(0, 10);
        totals[date] = (totals[date] || 0) + (ledger.paymentAmount || 0);
        return totals;
      }, {});
      return {
        paymentLedgers,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        totalPayment: Object.values(dateWiseTotals).reduce(
          (sum, amount) => sum + amount,
          0,
        ),
        dateWiseTotals: Object.entries(dateWiseTotals)
          .sort(([first], [second]) => second.localeCompare(first))
          .map(([date, amount]) => ({ date, amount })),
      };
    },
    getDashboardStats: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");

      if (user.role === "patient") {
        const patient = await getSelfPatient(user);
        const patientId = patient?._id;
        return {
          patient: {
            upcomingAppointments: patientId
              ? await Appointment.countDocuments({ patientId, date: { $gte: new Date().toISOString().split("T")[0] }, status: "Scheduled" })
              : 0,
            totalAppointments: patientId
              ? await Appointment.countDocuments({ patientId })
              : 0,
            pendingBills: patientId
              ? await Invoice.countDocuments({ patientId, balance: { $gt: 0 } })
              : 0,
            unreadMessages: await ChatMessage.countDocuments({ receiverId: user._id, read: false }),
          },
        };
      }
      requireStaff(user);

      const totalPatients = await Patient.countDocuments();
      const today = new Date().toISOString().split("T")[0];
      const todayAppointments = await Appointment.countDocuments({
        date: today,
      });

      const invoices = await Invoice.find();
      const pendingPayments = invoices.filter((inv) => inv.balance > 0).length;
      const monthlyRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

      const unreadMessages = await ChatMessage.countDocuments({
        receiverId: user._id,
        read: false,
      });
      const upcomingAppointments = await Appointment.countDocuments({
        patientId: user._id,
        date: { $gte: today },
        status: "Scheduled",
      });
      const pendingBills = await Invoice.countDocuments({
        patientId: user._id,
        balance: { $gt: 0 },
      });

      const doctorApts = await Appointment.countDocuments({
        doctorId: user._id,
        date: today,
      });
      const doctorPatients = await Appointment.distinct("patientId", {
        doctorId: user._id,
      }).length;
      const pendingReports = await MedicalRecord.countDocuments({
        doctorId: user._id,
        diagnosis: { $exists: false },
      });

      return {
        patient: {
          upcomingAppointments,
          totalAppointments: await Appointment.countDocuments({
            patientId: user._id,
          }),
          pendingBills,
          unreadMessages,
        },
        doctor: {
          todayAppointments: doctorApts,
          totalPatients: doctorPatients,
          pendingReports,
          unreadMessages,
        },
        admin: {
          totalPatients,
          todayAppointments,
          pendingPayments,
          monthlyRevenue,
        },
      };
    },
    getReportsData: async (_, __, { user }) => {
      requireStaff(user);
      const invoices = await Invoice.find();
      const monthlyRevenueMap = {};
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      invoices.forEach((invoice) => {
        const date = new Date(invoice.date);
        const monthKey = months[date.getMonth()];
        if (!monthlyRevenueMap[monthKey]) {
          monthlyRevenueMap[monthKey] = 0;
        }
        monthlyRevenueMap[monthKey] += invoice.total;
      });

      const monthlyRevenue = months.map((month) => ({
        month,
        revenue: monthlyRevenueMap[month] || 0,
      }));

      const appointments = await Appointment.find();
      const typeCount = {};
      appointments.forEach((apt) => {
        if (!typeCount[apt.type]) {
          typeCount[apt.type] = 0;
        }
        typeCount[apt.type]++;
      });

      const appointmentsByType = Object.keys(typeCount).map((type) => ({
        type,
        count: typeCount[type],
      }));

      const patients = await Patient.find();
      const ageGroups = {
        "0-18": 0,
        "19-35": 0,
        "36-50": 0,
        "51-65": 0,
        "65+": 0,
      };

      patients.forEach((patient) => {
        const dob = new Date(patient.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }

        if (age <= 18) ageGroups["0-18"]++;
        else if (age <= 35) ageGroups["19-35"]++;
        else if (age <= 50) ageGroups["36-50"]++;
        else if (age <= 65) ageGroups["51-65"]++;
        else ageGroups["65+"]++;
      });

      const patientDemographics = Object.keys(ageGroups).map((ageGroup) => ({
        ageGroup,
        count: ageGroups[ageGroup],
      }));

      const medicalRecords = await MedicalRecord.find();
      const treatmentCounts = {};

      medicalRecords.forEach((record) => {
        if (record.diagnosis) {
          const treatment = record.diagnosis || "General Treatment";
          if (!treatmentCounts[treatment]) {
            treatmentCounts[treatment] = { total: 0, successful: 0 };
          }
          treatmentCounts[treatment].total++;
          treatmentCounts[treatment].successful++;
        }
      });

      const treatmentSuccess = Object.keys(treatmentCounts).map(
        (treatment) => ({
          treatment,
          successRate:
            Math.round(
              (treatmentCounts[treatment].successful /
                treatmentCounts[treatment].total) *
                100,
            ) || 0,
        }),
      );

      return {
        monthlyRevenue,
        appointmentsByType,
        patientDemographics,
        treatmentSuccess,
      };
    },
    getConversations: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await Conversation.find({ "participants.id": user._id }).sort({
        lastMessageTime: -1,
      });
    },
    getChatMessages: async (_, { conversationId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const conversation = await Conversation.findOne({
        _id: conversationId,
        "participants.id": user._id,
      });
      if (!conversation) {
        throw new Error("Unauthorized: Conversation access denied");
      }
      return await ChatMessage.find({ conversationId }).sort({ timestamp: 1 });
    },
    getNotifications: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await Notification.find({ userId: user._id }).sort({
        timestamp: -1,
      });
    },
    getRecentActivities: async (_, { limit = 10 }, { user }) => {
      requireStaff(user);
      // Fetch recent records from all collections
      const patients = await Patient.find()
        .sort({ createdAt: -1 })
        .limit(limit);
      const appointments = await Appointment.find()
        .sort({ createdAt: -1 })
        .limit(limit);
      const prescriptions = await Prescription.find()
        .sort({ createdAt: -1 })
        .limit(limit);
      const medicines = await Medicine.find()
        .sort({ createdAt: -1 })
        .limit(limit);
      const medicalRecords = await MedicalRecord.find()
        .sort({ createdAt: -1 })
        .limit(limit);
      const invoices = await Invoice.find()
        .sort({ createdAt: -1 })
        .limit(limit);
      const paymentLedgers = await PaymentLedger.find()
        .sort({ createdAt: -1 })
        .limit(limit);

      const activities = [
        ...patients.map((p) => ({
          id: p._id.toString(),
          type: "patient",
          action: "New patient registered",
          user: p.name,
          timestamp: p.createdAt,
        })),
        ...appointments.map((a) => ({
          id: a._id.toString(),
          type: "appointment",
          action: "Appointment scheduled",
          user: a.patientName,
          timestamp: a.createdAt,
        })),
        ...prescriptions.map((p) => ({
          id: p._id.toString(),
          type: "prescription",
          action: "New prescription created",
          user: p.patientName,
          timestamp: p.createdAt,
        })),
        ...medicines.map((m) => ({
          id: m._id.toString(),
          type: "medicine",
          action: "New medicine added",
          user: m.name,
          timestamp: m.createdAt,
        })),
        ...medicalRecords.map((r) => ({
          id: r._id.toString(),
          type: "medical_record",
          action: "Medical record updated",
          user: r.patientName,
          timestamp: r.createdAt,
        })),
        ...invoices.map((i) => ({
          id: i._id.toString(),
          type: "invoice",
          action: "Invoice generated",
          user: i.patientName,
          timestamp: i.createdAt,
        })),
        ...paymentLedgers.map((l) => ({
          id: l._id.toString(),
          type: "payment",
          action: "Payment ledger entry added",
          user: l.lorryNo,
          timestamp: l.createdAt,
        })),
      ];

      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return activities.slice(0, limit);
    },
    getTransactions: async (
      _,
      { page = 1, limit = 10, invoiceId, patientId, txnStatus },
      { user },
    ) => {
      if (!user) throw new Error("Not authenticated");
      const skip = (page - 1) * limit;
      const query = {};
      if (user.role === "patient") {
        const patient = await Patient.findOne({ userId: user._id });
        if (!patient) {
          return {
            transactions: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
          };
        }
        query.patientId = patient._id;
      } else if (patientId) {
        query.patientId = patientId;
      }
      if (invoiceId) query.invoiceId = invoiceId;
      if (txnStatus) query.txnStatus = txnStatus;
      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const totalCount = await Transaction.countDocuments(query);
      return {
        transactions,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },
    getTransaction: async (_, { id }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const transaction = await Transaction.findById(id);
      if (transaction && user.role === "patient") {
        const patient = await Patient.findOne({ userId: user._id });
        if (
          !patient ||
          transaction.patientId?.toString() !== patient._id.toString()
        ) {
          throw new Error("Unauthorized");
        }
      }
      return transaction;
    },
  },
  Mutation: {
    register: async (
      _,
      { name, phone, email, password, role, specialization, license },
      { user },
    ) => {
      if (role !== "patient") {
        if (!user || !["admin"].includes(user.role)) {
          throw new Error(
            "Unauthorized: Only admins can register staff members",
          );
        }
      } else if (user && !["admin", "employee", "doctor"].includes(user.role)) {
        if (user.role !== "patient") {
          throw new Error("Unauthorized: Insufficient permissions");
        }
      }

      const normalizedPhone = (phone || "").replace(/\D/g, "").slice(-10);
      const normalizedEmail = email?.trim().toLowerCase() || undefined;
      if (normalizedPhone.length !== 10) {
        throw new Error("Phone number must contain 10 digits");
      }

      const orConditions = [{ phone: normalizedPhone }];
      if (normalizedEmail) {
        const escapedEmail = normalizedEmail.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        orConditions.push({
          email: { $regex: `^${escapedEmail}$`, $options: "i" },
        });
      }

      const userExists = await User.findOne({ $or: orConditions });
      if (userExists) {
        throw new Error("User with this email or phone already exists");
      }

      const emailToStore =
        normalizedEmail ||
        (role === "patient"
          ? `${normalizedPhone}@patient.creadent.local`
          : undefined);

      if (!emailToStore) {
        throw new Error("Email is required for staff registration");
      }

      const newUser = await User.create({
        name,
        phone: normalizedPhone,
        email: emailToStore,
        password,
        role,
        specialization,
        license,
        verified: true,
      });

      if (newUser && role === "patient") {
        try {
          const existingPatient = await Patient.findOne({
            phone: normalizedPhone,
          });
          if (!existingPatient) {
            await Patient.create({
              name,
              phone: normalizedPhone,
              email: email || undefined,
              userId: newUser._id,
              status: "Active",
            });
          } else if (!existingPatient.userId) {
            existingPatient.userId = newUser._id;
            existingPatient.name = name;
            if (email) existingPatient.email = email;
            await existingPatient.save();
          }
        } catch (patientErr) {
          console.warn(
            "Failed to link patient record during register:",
            patientErr?.message,
          );
        }
      }

      if (newUser) {
        if (role === "patient" && !user) {
          return {
            token: generateToken(newUser._id),
            user: serializeUser(newUser),
          };
        }
        return {
          user: serializeUser(newUser),
        };
      } else {
        throw new Error("Invalid user data");
      }
    },

    login: async (_, { phone, password }) => {
      const normalizedPhone = (phone || "").replace(/\D/g, "").slice(-10);
      const userQuery = {
        $or: [{ phone }, { phone: normalizedPhone }],
      };
      if (/^\S+@\S+\.\S+$/.test(phone || "")) {
        userQuery.$or.push({ email: phone });
      }
      const users = await User.find(userQuery);

      const rolePriority = {
        admin: 4,
        doctor: 3,
        employee: 2,
        patient: 1,
      };

      users.sort((a, b) => rolePriority[b.role] - rolePriority[a.role]);

      for (const user of users) {
        if (await user.matchPassword(password)) {
          return {
            token: generateToken(user._id),
            user: serializeUser(user),
          };
        }
      }

      const usersByEmail = await User.find({ email: phone });
      usersByEmail.sort((a, b) => rolePriority[b.role] - rolePriority[a.role]);

      for (const user of usersByEmail) {
        if (await user.matchPassword(password)) {
          return {
            token: generateToken(user._id),
            user: serializeUser(user),
          };
        }
      }

      throw new Error("Invalid phone/email or password");
    },

    forgotPassword: async (_, { phone }) => {
      const normalizedPhone = (phone || "").replace(/\D/g, "").slice(-10);
      const users = await User.find({
        $or: [{ phone }, { phone: normalizedPhone }],
      });

      const rolePriority = {
        admin: 4,
        doctor: 3,
        employee: 2,
        patient: 1,
      };

      users.sort((a, b) => rolePriority[b.role] - rolePriority[a.role]);

      if (users.length === 0) {
        throw new Error("User not found with this mobile number");
      }

      const user = users[0];

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.resetPasswordOTP = otp;
      user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
      return true;
    },

    resetPassword: async (_, { phone, otp, newPassword }) => {
      const normalizedPhone = (phone || "").replace(/\D/g, "").slice(-10);
      const users = await User.find({
        $or: [{ phone }, { phone: normalizedPhone }],
        resetPasswordOTP: otp,
        resetPasswordOTPExpires: { $gt: Date.now() },
      });

      const rolePriority = {
        admin: 4,
        doctor: 3,
        employee: 2,
        patient: 1,
      };

      users.sort((a, b) => rolePriority[b.role] - rolePriority[a.role]);

      if (users.length === 0) {
        throw new Error("Invalid or expired OTP");
      }

      const user = users[0];

      user.password = newPassword;
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpires = undefined;
      await user.save();

      return true;
    },

    registerMedicine: async (_, args, { user }) => {
      requireStaff(user);
      const medicine = new Medicine(args);
      return await medicine.save();
    },

    updateMedicine: async (_, { id, ...args }, { user }) => {
      requireStaff(user);
      return await Medicine.findByIdAndUpdate(id, args, { new: true });
    },

    deleteMedicine: async (_, { id }, { user }) => {
      requireStaff(user);
      await Medicine.findByIdAndDelete(id);
      return true;
    },

    updateUser: async (_, { id, ...args }, { user }) => {
      if (!user || user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can update users");
      }
      const target = await User.findById(id);
      if (!target) {
        throw new Error("User not found");
      }
      const update = { ...args };
      if (update.phone) {
        update.phone = (update.phone || "").replace(/\D/g, "").slice(-10);
      }
      Object.keys(update).forEach((key) => {
        if (update[key] !== undefined) {
          target[key] = update[key];
        }
      });
      await target.save();
      return serializeUser(target);
    },

    deleteUser: async (_, { id }, { user }) => {
      if (!user || user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can delete users");
      }
      await User.findByIdAndDelete(id);
      return true;
    },

    createAppointment: async (_, args, { io, user }) => {
      if (!user) throw new Error("Not authenticated");
      let appointmentData = { ...args };
      if (user.role === "patient") {
        const patient = await getSelfPatient(user);
        if (!patient) throw new Error("Patient profile not found");
        appointmentData = {
          ...appointmentData,
          patientId: patient._id,
          patientName: patient.name,
        };
      } else {
        requireStaff(user);
      }
      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      await sendAppointmentBookingNotifications(savedAppointment);

      if (io) {
        io.emit("notification", {
          type: "NEW_APPOINTMENT",
          message: `New appointment booked for ${savedAppointment.patientName} on ${savedAppointment.date}`,
          appointment: savedAppointment,
        });
      }

      return savedAppointment;
    },
    updateAppointment: async (_, { id, ...args }, { io, user }) => {
      requireStaff(user);
      const appointmentNotificationReset =
        args.date || args.time
          ? {
              reminderOneDaySentAt: null,
              reminderOneHourSentAt: null,
              lastNotificationError: null,
            }
          : {};

      const updatedAppointment = await Appointment.findByIdAndUpdate(id, args, {
        new: true,
      });

      if (
        updatedAppointment &&
        Object.keys(appointmentNotificationReset).length > 0
      ) {
        updatedAppointment.reminderOneDaySentAt =
          appointmentNotificationReset.reminderOneDaySentAt;
        updatedAppointment.reminderOneHourSentAt =
          appointmentNotificationReset.reminderOneHourSentAt;
        updatedAppointment.lastNotificationError =
          appointmentNotificationReset.lastNotificationError;
        await updatedAppointment.save();
      }

      if (io && updatedAppointment) {
        let message = `Appointment for ${updatedAppointment.patientName} has been updated`;
        let type = "APPOINTMENT_UPDATED";

        if (args.date || args.time) {
          message = `Appointment for ${updatedAppointment.patientName} has been rescheduled to ${updatedAppointment.date} at ${updatedAppointment.time}`;
          type = "APPOINTMENT_RESCHEDULED";
        }

        io.emit("notification", {
          type,
          message,
          appointment: updatedAppointment,
        });
      }

      return updatedAppointment;
    },
    createMedicalRecord: async (_, args) => {
      const record = new MedicalRecord(args);
      await record.save();
      return record;
    },
    updateMedicalRecord: async (_, { id, ...rest }) => {
      const allowed = [
        "visitType",
        "diagnosis",
        "treatment",
        "prescriptions",
        "notes",
        "followUpDate",
        "vitalSigns",
        "attachments",
      ];
      const updateData = {};
      for (const key of allowed) {
        if (rest[key] !== undefined) updateData[key] = rest[key];
      }
      const record = await MedicalRecord.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true },
      );
      return record;
    },
    deleteMedicalRecord: async (_, { id }) => {
      const res = await MedicalRecord.findByIdAndDelete(id);
      return !!res;
    },
    createInvoice: async (_, args) => {
      // Auto-generate invoice number if not provided
      let invoiceNumber = args.invoiceNumber;
      if (!invoiceNumber) {
        const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
        const nextNumber = lastInvoice
          ? parseInt(lastInvoice.invoiceNumber.replace("INV-", "")) + 1
          : 1;
        invoiceNumber = `INV-${String(nextNumber).padStart(4, "0")}`;
      }
      const invoice = new Invoice({
        ...args,
        invoiceNumber,
        amountPaid: args.amountPaid || 0,
        status: args.balance > 0 ? "Unpaid" : "Paid",
      });
      return await invoice.save();
    },
    recordInvoicePayment: async (
      _,
      { invoiceId, amount, paymentMethod, paymentDate },
      { user },
    ) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      if (user.role === "doctor") {
        throw new Error("Unauthorized: Doctors cannot record invoice payments");
      }

      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (user.role === "patient") {
        const patient = await Patient.findOne({ userId: user._id });
        if (
          !patient ||
          invoice.patientId.toString() !== patient._id.toString()
        ) {
          throw new Error("Unauthorized: You can only pay your own invoices");
        }
        if (paymentMethod && paymentMethod.toLowerCase() === "cash") {
          throw new Error(
            "Unauthorized: Cash payments must be recorded by clinic staff. Use ICICI Bank payment gateway to pay online.",
          );
        }
      }

      const paymentAmount = Number(amount);
      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        throw new Error("Payment amount must be greater than 0");
      }

      if (paymentAmount > invoice.balance) {
        throw new Error("Payment amount cannot exceed the outstanding balance");
      }

      invoice.amountPaid = (invoice.amountPaid || 0) + paymentAmount;
      invoice.balance = Math.max(0, invoice.total - invoice.amountPaid);
      invoice.status = invoice.balance === 0 ? "Paid" : "Partial";
      invoice.paymentMethod = paymentMethod;
      invoice.paymentDate = paymentDate ? new Date(paymentDate) : new Date();

      const savedInvoice = await invoice.save();
      const lastLedger = await PaymentLedger.findOne().sort({ slNo: -1 });
      await PaymentLedger.create({
        slNo: (lastLedger?.slNo || 0) + 1,
        lorryNo: savedInvoice.invoiceNumber,
        treatmentName:
          savedInvoice.items
            ?.map((item) => item.description)
            .filter(Boolean)
            .join(", ") || "Dental treatment",
        paymentDate: savedInvoice.paymentDate,
        paymentMode: paymentMethod || "Manual",
        referenceNo: savedInvoice.invoiceNumber,
        paymentAmount,
        dueAmount: savedInvoice.balance,
        status: savedInvoice.status === "Paid" ? "Paid" : "Partial",
        remarks: "Payment recorded by clinic staff",
        invoiceId: savedInvoice._id,
      });

      return savedInvoice;
    },
    updateInvoice: async (_, { id, ...args }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      if (!["admin", "employee"].includes(user.role)) {
        throw new Error(
          "Unauthorized: Only admins and employees can update invoices",
        );
      }

      const invoice = await Invoice.findById(id);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const updateData = { ...args };

      if (
        updateData.total !== undefined &&
        updateData.amountPaid !== undefined
      ) {
        updateData.balance = Math.max(
          0,
          updateData.total - updateData.amountPaid,
        );
        updateData.status =
          updateData.balance === 0
            ? "Paid"
            : updateData.amountPaid > 0
              ? "Partial"
              : "Unpaid";
      } else if (updateData.total !== undefined) {
        updateData.balance = Math.max(
          0,
          updateData.total - (invoice.amountPaid || 0),
        );
        updateData.status =
          updateData.balance === 0
            ? "Paid"
            : (invoice.amountPaid || 0) > 0
              ? "Partial"
              : "Unpaid";
      } else if (updateData.amountPaid !== undefined) {
        updateData.balance = Math.max(0, invoice.total - updateData.amountPaid);
        updateData.status =
          updateData.balance === 0
            ? "Paid"
            : updateData.amountPaid > 0
              ? "Partial"
              : "Unpaid";
      }

      const updatedInvoice = await Invoice.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true },
      );

      return updatedInvoice;
    },
    deleteInvoice: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      if (user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can delete invoices");
      }

      const invoice = await Invoice.findById(id);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      await Invoice.findByIdAndDelete(id);
      return true;
    },
    sendInvoiceWhatsApp: async (_, { invoiceId, patientId }, { user }) => {
      if (!user) {
        return {
          success: false,
          message: "Not authenticated",
          error: "Not authenticated",
        };
      }

      if (!["admin", "employee"].includes(user.role)) {
        return {
          success: false,
          message:
            "Unauthorized: Only admins and employees can send WhatsApp messages",
          error: "Unauthorized",
        };
      }

      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return {
          success: false,
          message: "Invoice not found",
          error: "Invoice not found",
        };
      }

      try {
        const result = await sendInvoiceWhatsApp(invoice, patientId);
        return {
          success: result.success,
          skipped: result.skipped,
          message: result.success
            ? "Invoice details sent via WhatsApp successfully"
            : result.skipped
              ? "WhatsApp not configured - message prepared but not sent"
              : "Failed to send WhatsApp message",
          phone: result.phone || "",
          patientName: result.patient?.name || "",
          error:
            result.errors?.length > 0
              ? result.errors.join(" | ")
              : result.error || null,
          messagePreview: result.messagePreview || "",
        };
      } catch (err) {
        return {
          success: false,
          message: "Error sending WhatsApp message",
          error: err?.message || String(err),
        };
      }
    },
    sendLoginCredentialsWhatsApp: async (
      _,
      { patientId, patientName, phone, password },
      { user },
    ) => {
      if (!user) {
        return {
          success: false,
          message: "Not authenticated",
          error: "Not authenticated",
        };
      }

      if (!["admin", "employee"].includes(user.role)) {
        return {
          success: false,
          message:
            "Unauthorized: Only admins and employees can send WhatsApp messages",
          error: "Unauthorized",
        };
      }

      try {
        const credentials = {
          patientId,
          patientName,
          phone,
          password,
        };
        const result = await sendLoginCredentialsWhatsApp(credentials);
        return {
          success: result.success,
          skipped: result.skipped,
          message: result.success
            ? "Login credentials sent via WhatsApp successfully"
            : result.skipped
              ? "WhatsApp not configured - message prepared but not sent"
              : "Failed to send WhatsApp message",
          phone: result.phone || "",
          patientName: patientName || "",
          error:
            result.errors?.length > 0
              ? result.errors.join(" | ")
              : result.error || null,
          messagePreview: result.messagePreview || "",
        };
      } catch (err) {
        return {
          success: false,
          message: "Error sending WhatsApp message",
          error: err?.message || String(err),
        };
      }
    },
    createPrescription: async (_, args) => {
      const prescription = new Prescription({
        ...args,
        date: args.date ? new Date(args.date) : new Date(),
      });
      return await prescription.save();
    },
    sendPrescriptionEmail: async (
      _,
      {
        prescriptionId,
        patientName,
        patientEmail,
        patientId: patientIdExternal,
        doctorName,
        date,
        diagnosis,
        notes,
        medications,
        pdfDataUri,
      },
    ) => {
      let prescription = null;
      let patient = null;

      try {
        prescription = await Prescription.findById(prescriptionId);
      } catch {
        prescription = null;
      }

      if (prescription) {
        patientName = patientName || prescription.patientName;
        doctorName = doctorName || prescription.doctorName;
        date = date || prescription.date;
        diagnosis = diagnosis || prescription.diagnosis;
        notes = notes || prescription.notes;
        medications = medications || prescription.medications;
        try {
          patient = await Patient.findById(prescription.patientId);
        } catch {
          patient = null;
        }
      }

      if (!patientEmail && patient?.email) {
        patientEmail = patient.email;
      }

      if (!patientEmail) {
        return {
          success: false,
          message:
            "Patient email address not available. Please update the patient's email first.",
          sentTo: null,
          messageId: null,
        };
      }

      let pdfBuffer = null;
      if (typeof pdfDataUri === "string" && pdfDataUri.includes("base64,")) {
        try {
          const base64 = pdfDataUri.split("base64,")[1];
          pdfBuffer = Buffer.from(base64, "base64");
        } catch (err) {
          console.error("[EMAIL] Failed to decode PDF data URI:", err);
          pdfBuffer = null;
        }
      }

      const rxId = prescriptionId
        ? `RX-${String(prescriptionId).slice(-8).toUpperCase()}`
        : "RX-PRESCRIPTION";

      const safePatientName = patientName || "Patient";
      const filenameParts = safePatientName.replace(/[^a-zA-Z0-9]/g, "_");
      const dateForFile = date ? new Date(date) : new Date();
      const dateStr =
        String(dateForFile.getDate()).padStart(2, "0") +
        String(dateForFile.getMonth() + 1).padStart(2, "0") +
        dateForFile.getFullYear();
      const pdfFilename = `Prescription_${filenameParts}_${dateStr}.pdf`;

      const clinicInfo = {
        name: "CREADENT DENTAL CLINIC",
        tagline: "Excellence in Dental Care",
        address: "BD-85, Salt Lake Rd, BD Block, Sector 1",
        city: "Bidhannagar, Kolkata, West Bengal 700064",
        phone: "+91 6292300343",
        email: "creadentmultispecialitydentalclinic@gmail.com",
        website: "https://creadentdentalclinic.com/",
      };

      try {
        const result = await sendPrescriptionEmail({
          patientEmail,
          patientName: safePatientName,
          doctorName: doctorName || "Doctor",
          rxId,
          pdfBuffer,
          pdfFilename,
          clinicInfo,
        });

        return {
          success: true,
          message: `Prescription email sent successfully to ${patientEmail}`,
          sentTo: patientEmail,
          messageId: result.messageId,
        };
      } catch (err) {
        console.error("[RESOLVER] sendPrescriptionEmail error:", err);
        return {
          success: false,
          message:
            err?.message ||
            "Failed to send email. Check SMTP configuration / app password.",
          sentTo: patientEmail,
          messageId: null,
        };
      }
    },
    updateMedicineStock: async (_, { id, stock }) => {
      return await Medicine.findByIdAndUpdate(id, { stock }, { new: true });
    },
    createPatient: async (_, args, { user }) => {
      const isStaff =
        user && ["admin", "employee", "doctor"].includes(user.role);
      const isPatientSelf = user && user.role === "patient";

      if (!isStaff && !isPatientSelf) {
        if (user) {
          throw new Error("Unauthorized: Insufficient permissions");
        }
      }

      if (isPatientSelf && args.userId && args.userId !== user._id.toString()) {
        throw new Error(
          "Unauthorized: You can only create your own patient profile",
        );
      }

      if (!args.dateOfBirth && !args.age) {
        throw new Error("Either date of birth or age is required");
      }
      if (args.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(args.email)) {
          throw new Error("Invalid email format");
        }
      }
      const normalizedPhone = (args.phone || "").replace(/\D/g, "").slice(-10);
      const normalizedEmail = args.email?.trim().toLowerCase() || undefined;
      if (normalizedPhone.length !== 10) {
        throw new Error("Phone number must contain 10 digits");
      }
      if (
        args.bloodGroup &&
        !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].includes(
          args.bloodGroup,
        )
      ) {
        throw new Error("Invalid blood group");
      }

      const existingPatient = await Patient.findOne({ phone: normalizedPhone });
      if (existingPatient && existingPatient.userId) {
        throw new Error("A patient with this phone number already exists");
      }

      let newUser = null;
      let existingUser = null;
      if (args.password || isPatientSelf) {
        const userQuery = { $or: [{ phone: normalizedPhone }] };
        if (normalizedEmail) {
          userQuery.$or.push({ email: normalizedEmail });
        }
        existingUser = await User.findOne(userQuery);
      }

      if (existingUser) {
        if (existingUser.role !== "patient") {
          throw new Error("User with this email or phone already exists");
        }

        newUser = existingUser;
        if (args.password) {
          existingUser.password = args.password;
        }
        if (normalizedEmail && existingUser.email !== normalizedEmail) {
          existingUser.email = normalizedEmail;
        }
        existingUser.name = args.name;
        existingUser.phone = normalizedPhone;
        existingUser.verified = true;
        await existingUser.save();
      } else if (args.password) {
        newUser = await User.create({
          name: args.name,
          email: normalizedEmail || `${normalizedPhone}@patient.creadent.local`,
          phone: normalizedPhone,
          password: args.password,
          role: "patient",
          verified: true,
        });
      } else if (isPatientSelf && !args.userId) {
        newUser = user;
      }

      let resolvedUserId = undefined;
      if (newUser) {
        resolvedUserId = newUser._id;
      } else if (args.userId) {
        try {
          const existingUser = await User.findById(args.userId);
          resolvedUserId = existingUser ? existingUser._id : undefined;
        } catch (_) {}
      }

      const patientData = {
        ...args,
        phone: normalizedPhone,
        userId: resolvedUserId,
        dateOfBirth: args.dateOfBirth ? new Date(args.dateOfBirth) : undefined,
        age: args.age ? Number(args.age) : undefined,
        dentalHistory: args.dentalHistory
          ? {
              ...args.dentalHistory,
              lastVisit: args.dentalHistory.lastVisit
                ? new Date(args.dentalHistory.lastVisit)
                : undefined,
            }
          : undefined,
        insurance: args.insurance
          ? {
              ...args.insurance,
              expiryDate: args.insurance.expiryDate
                ? new Date(args.insurance.expiryDate)
                : undefined,
            }
          : undefined,
      };

      const patient = new Patient(patientData);
      const saved = await patient.save();

      if (saved.userId && saved._id) {
        try {
          await User.findByIdAndUpdate(saved.userId, {
            name: saved.name,
            phone: normalizedPhone,
            email: saved.email || undefined,
          });
        } catch (_) {}
      }

      return saved;
    },
    generatePatientLogin: async (_, { patientId }, { user }) => {
      if (!user || !["admin", "employee"].includes(user.role)) {
        throw new Error(
          "Unauthorized: Only admins and employees can generate patient logins",
        );
      }

      const patient = await Patient.findById(patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }

      const generatedPassword = generatePatientPassword(patient.phone);
      let patientUser = null;
      let newlyCreated = false;

      if (patient.userId) {
        patientUser = await User.findById(patient.userId);
      }

      if (!patientUser) {
        patientUser = await User.findOne({
          role: "patient",
          $or: [
            { phone: patient.phone },
            ...(patient.email ? [{ email: patient.email }] : []),
          ],
        });
      }

      if (patientUser) {
        patientUser.name = patient.name;
        patientUser.phone = patient.phone;
        patientUser.email = patient.email || patientUser.email;
        patientUser.password = generatedPassword;
        patientUser.verified = true;
        await patientUser.save();
      } else {
        patientUser = await User.create({
          name: patient.name,
          email: patient.email || `${patient.phone}@patient.creadent.local`,
          phone: patient.phone,
          password: generatedPassword,
          role: "patient",
          verified: true,
        });
        newlyCreated = true;
      }

      if (
        !patient.userId ||
        patient.userId.toString() !== patientUser._id.toString()
      ) {
        patient.userId = patientUser._id;
        await patient.save();
      }

      return {
        patientId: patient._id.toString(),
        patientName: patient.name,
        phone: patient.phone,
        password: generatedPassword,
        userId: patientUser._id.toString(),
        newlyCreated,
      };
    },
    updatePatient: async (_, { id, ...args }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      const patient = await Patient.findById(id);
      if (!patient) {
        throw new Error("Patient not found");
      }

      if (
        user.role === "patient" &&
        patient.userId?.toString() !== user._id.toString()
      ) {
        throw new Error(
          "Unauthorized: You can only update your own patient profile",
        );
      }

      const normalizedPhone = args.phone
        ? (args.phone || "").replace(/\D/g, "").slice(-10)
        : undefined;
      const nextPhone = normalizedPhone || patient.phone;
      const nextEmail = args.email ?? patient.email;

      if (normalizedPhone) {
        args.phone = normalizedPhone;
        const existingPatient = await Patient.findOne({
          phone: normalizedPhone,
          _id: { $ne: id },
        });
        if (existingPatient) {
          throw new Error("A patient with this phone number already exists");
        }
      } else if (args.phone) {
        const existingPatient = await Patient.findOne({
          phone: args.phone,
          _id: { $ne: id },
        });
        if (existingPatient) {
          throw new Error("A patient with this phone number already exists");
        }
      }

      let patientUser = null;
      if (patient.userId) {
        patientUser = await User.findById(patient.userId);
      }

      if (args.password) {
        if (!patientUser) {
          const userQuery = { role: "patient" };
          if (nextPhone) userQuery.$or = [{ phone: nextPhone }];
          if (nextEmail) {
            userQuery.$or = userQuery.$or || [];
            userQuery.$or.push({ email: nextEmail });
          }
          const existingUser = await User.findOne(userQuery);

          if (existingUser) {
            patientUser = existingUser;
          } else {
            patientUser = new User({
              name: args.name || patient.name,
              email: nextEmail || `${nextPhone}@patient.creadent.local`,
              phone: nextPhone,
              password: args.password,
              role: "patient",
              verified: true,
            });
          }
        } else {
          patientUser.name = args.name || patient.name;
          patientUser.phone = nextPhone;
          patientUser.email = nextEmail || patientUser.email;
          patientUser.password = args.password;
          patientUser.verified = true;
        }

        await patientUser.save();
        patient.userId = patientUser._id;
      } else if (patientUser) {
        patientUser.name = args.name || patient.name;
        patientUser.phone = nextPhone;
        patientUser.email = nextEmail || patientUser.email;
        await patientUser.save();
      }

      const updateData = {
        ...args,
        phone: nextPhone,
        userId: patient.userId,
        dateOfBirth: args.dateOfBirth ? new Date(args.dateOfBirth) : undefined,
        age: args.age !== undefined ? Number(args.age) : undefined,
        dentalHistory: args.dentalHistory
          ? {
              ...args.dentalHistory,
              lastVisit: args.dentalHistory.lastVisit
                ? new Date(args.dentalHistory.lastVisit)
                : undefined,
            }
          : undefined,
        insurance: args.insurance
          ? {
              ...args.insurance,
              expiryDate: args.insurance.expiryDate
                ? new Date(args.insurance.expiryDate)
                : undefined,
            }
          : undefined,
      };

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          patient[key] = updateData[key];
        }
      });

      return await patient.save();
    },
    deletePatient: async (_, { id }) => {
      const patient = await Patient.findById(id);
      if (!patient) {
        throw new Error("Patient not found");
      }

      await Appointment.deleteMany({ patientId: patient._id });
      await MedicalRecord.deleteMany({ patientId: patient._id });
      await Prescription.deleteMany({ patientId: patient._id });
      await Invoice.deleteMany({ patientId: patient._id });

      if (patient.userId) {
        await Conversation.deleteMany({
          participants: { $elemMatch: { id: patient.userId.toString() } },
        });
        await ChatMessage.deleteMany({
          $or: [{ senderId: patient.userId }, { receiverId: patient.userId }],
        });
        await Notification.deleteMany({ userId: patient.userId });
        await User.findByIdAndDelete(patient.userId);
      }

      await Patient.findByIdAndDelete(id);
      return true;
    },
    addPaymentLedger: async (_, args) => {
      const ledger = new PaymentLedger(args);
      return await ledger.save();
    },
    iciciInitiateSale: async (
      _,
      {
        invoiceId,
        patientId,
        amount,
        customerEmailID,
        customerMobileNo,
        payType,
      },
      { user },
    ) => {
      if (!user) throw new Error("Not authenticated");
      if (user.role === "doctor")
        throw new Error("Unauthorized: Doctors cannot initiate payments");

      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === "Paid") throw new Error("Invoice is already paid");

      let resolvedPatientId = patientId || invoice.patientId;

      if (user.role === "patient") {
        const patient = await Patient.findOne({ userId: user._id });
        if (!patient)
          throw new Error("Unauthorized: Patient profile not found");
        if (invoice.patientId?.toString() !== patient._id.toString()) {
          throw new Error("Unauthorized: You can only pay your own invoices");
        }
        resolvedPatientId = patient._id;
      }

      const result = await initiateSale({
        invoiceId: invoice._id,
        patientId: resolvedPatientId,
        amount,
        customerEmailID,
        customerMobileNo,
        payType,
      });
      return result;
    },
    iciciGenerateOTP: async (_, { transactionId, tranCtx }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      if (user.role === "patient") {
        const patient = await Patient.findOne({ userId: user._id });
        const transaction = await Transaction.findById(transactionId);
        if (
          !patient ||
          !transaction ||
          transaction.patientId?.toString() !== patient._id.toString()
        ) {
          throw new Error("Unauthorized");
        }
      }
      const result = await generateOTP({ transactionId, tranCtx });
      return {
        success: result.success,
        data: result.data ? JSON.stringify(result.data) : null,
        error: result.error
          ? typeof result.error === "string"
            ? result.error
            : JSON.stringify(result.error)
          : null,
      };
    },
    iciciVerifyOTP: async (
      _,
      { transactionId, tranCtx, otpValue },
      { user },
    ) => {
      if (!user) throw new Error("Not authenticated");
      if (user.role === "patient") {
        const patient = await Patient.findOne({ userId: user._id });
        const transaction = await Transaction.findById(transactionId);
        if (
          !patient ||
          !transaction ||
          transaction.patientId?.toString() !== patient._id.toString()
        ) {
          throw new Error("Unauthorized");
        }
      }
      const result = await verifyOTP({ transactionId, tranCtx, otpValue });
      return {
        success: result.success,
        data: result.data ? JSON.stringify(result.data) : null,
        error: result.error
          ? typeof result.error === "string"
            ? result.error
            : JSON.stringify(result.error)
          : null,
      };
    },
    iciciAuthorize: async (_, { transactionId, tranCtx }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      if (user.role === "patient") {
        const patient = await Patient.findOne({ userId: user._id });
        const transaction = await Transaction.findById(transactionId);
        if (
          !patient ||
          !transaction ||
          transaction.patientId?.toString() !== patient._id.toString()
        ) {
          throw new Error("Unauthorized");
        }
      }
      const result = await authorizeTransaction({ transactionId, tranCtx });
      return {
        success: result.success,
        data: result.data ? JSON.stringify(result.data) : null,
        error: result.error
          ? typeof result.error === "string"
            ? result.error
            : JSON.stringify(result.error)
          : null,
      };
    },
    iciciGetTransactionStatus: async (
      _,
      { transactionId, merchantTxnNo },
      { user },
    ) => {
      if (!user) throw new Error("Not authenticated");
      if (user.role === "patient") {
        const patient = await Patient.findOne({ userId: user._id });
        if (transactionId) {
          const transaction = await Transaction.findById(transactionId);
          if (
            !patient ||
            !transaction ||
            transaction.patientId?.toString() !== patient._id.toString()
          ) {
            throw new Error("Unauthorized");
          }
        } else if (merchantTxnNo) {
          const transaction = await Transaction.findOne({ merchantTxnNo });
          if (
            !patient ||
            !transaction ||
            transaction.patientId?.toString() !== patient._id.toString()
          ) {
            throw new Error("Unauthorized");
          }
        } else {
          throw new Error("Either transactionId or merchantTxnNo is required");
        }
      }
      const result = await getTransactionStatus({
        transactionId,
        merchantTxnNo,
      });
      return {
        success: result.success,
        data: result.data ? JSON.stringify(result.data) : null,
        error: result.error
          ? typeof result.error === "string"
            ? result.error
            : JSON.stringify(result.error)
          : null,
        transaction: result.transaction || null,
      };
    },
    iciciProcessRefund: async (
      _,
      { transactionId, refundAmount, reason },
      { user },
    ) => {
      if (!user) throw new Error("Not authenticated");
      if (!["admin"].includes(user.role)) {
        throw new Error("Unauthorized: Only admins can process refunds");
      }
      const result = await processRefund({
        transactionId,
        refundAmount,
        reason,
      });
      return result;
    },
  },
};

module.exports = resolvers;
