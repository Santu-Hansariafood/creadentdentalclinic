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
const generateToken = require("../utils/generateToken");
const {
  sendAppointmentBookingNotifications,
} = require("../utils/appointmentNotifications");

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

const resolvers = {
  Prescription: {
    id: (parent) => (parent.id || parent._id)?.toString(),
    date: (parent) => toIsoDateString(parent.date),
  },
  Patient: {
    id: (parent) => (parent.id || parent._id)?.toString(),
    dateOfBirth: (parent) => toDateOnlyString(parent.dateOfBirth),
    userId: (parent) => parent.userId?.toString(),
    dentalHistory: (parent) => parent.dentalHistory ? {
      ...parent.dentalHistory,
      lastVisit: toDateOnlyString(parent.dentalHistory.lastVisit)
    } : null,
    insurance: (parent) => parent.insurance ? {
      ...parent.insurance,
      expiryDate: toDateOnlyString(parent.insurance.expiryDate)
    } : null,
  },
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return user;
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
    getPatients: async (_, { page = 1, limit = 10, search = "" }) => {
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
    getPatient: async (_, { id }) => await Patient.findById(id),
    getMyPatient: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await Patient.findOne({ userId: user._id });
    },
    checkPatientExists: async (_, { phone }) => {
      const exists = await Patient.exists({ phone });
      return !!exists;
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
    getAppointments: async (
      _,
      { page = 1, limit = 10, search = "", status = "All" },
    ) => {
      const skip = (page - 1) * limit;
      const query = {};
      if (status && status !== "All") {
        query.status = status;
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
    getMedicalRecords: async () =>
      await MedicalRecord.find().sort({ date: -1 }),
    getInvoices: async () => await Invoice.find().sort({ date: -1 }),
    getPrescriptions: async () => await Prescription.find().sort({ date: -1 }),
    getPaymentLedgers: async (_, { page = 1, limit = 10, search = "" }) => {
      const skip = (page - 1) * limit;
      const paymentLedgers = await PaymentLedger.find()
        .sort({ slNo: 1 })
        .skip(skip)
        .limit(limit);
      const totalCount = await PaymentLedger.countDocuments();
      return {
        paymentLedgers,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },
    getDashboardStats: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");

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
    getReportsData: async () => {
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

      // Patient demographics by age group
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

      // Treatment success (using medical records)
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
    getChatMessages: async (_, { conversationId }) => {
      return await ChatMessage.find({ conversationId }).sort({ timestamp: 1 });
    },
    getNotifications: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await Notification.find({ userId: user._id }).sort({
        timestamp: -1,
      });
    },
    getRecentActivities: async (_, { limit = 10 }) => {
      // Fetch recent records from all collections
      const patients = await Patient.find().sort({ createdAt: -1 }).limit(limit);
      const appointments = await Appointment.find().sort({ createdAt: -1 }).limit(limit);
      const prescriptions = await Prescription.find().sort({ createdAt: -1 }).limit(limit);
      const medicines = await Medicine.find().sort({ createdAt: -1 }).limit(limit);
      const medicalRecords = await MedicalRecord.find().sort({ createdAt: -1 }).limit(limit);
      const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(limit);
      const paymentLedgers = await PaymentLedger.find().sort({ createdAt: -1 }).limit(limit);

      // Format all into activity objects
      const activities = [
        ...patients.map(p => ({
          id: p._id.toString(),
          type: 'patient',
          action: 'New patient registered',
          user: p.name,
          timestamp: p.createdAt
        })),
        ...appointments.map(a => ({
          id: a._id.toString(),
          type: 'appointment',
          action: 'Appointment scheduled',
          user: a.patientName,
          timestamp: a.createdAt
        })),
        ...prescriptions.map(p => ({
          id: p._id.toString(),
          type: 'prescription',
          action: 'New prescription created',
          user: p.patientName,
          timestamp: p.createdAt
        })),
        ...medicines.map(m => ({
          id: m._id.toString(),
          type: 'medicine',
          action: 'New medicine added',
          user: m.name,
          timestamp: m.createdAt
        })),
        ...medicalRecords.map(r => ({
          id: r._id.toString(),
          type: 'medical_record',
          action: 'Medical record updated',
          user: r.patientName,
          timestamp: r.createdAt
        })),
        ...invoices.map(i => ({
          id: i._id.toString(),
          type: 'invoice',
          action: 'Invoice generated',
          user: i.patientName,
          timestamp: i.createdAt
        })),
        ...paymentLedgers.map(l => ({
          id: l._id.toString(),
          type: 'payment',
          action: 'Payment ledger entry added',
          user: l.lorryNo,
          timestamp: l.createdAt
        }))
      ];

      // Sort by timestamp descending and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return activities.slice(0, limit);
    },
  },
  Mutation: {
    register: async (
      _,
      { name, phone, email, password, role, specialization, license },
      { user },
    ) => {
      if (role !== "patient") {
        if (!user || user.role !== "admin") {
          throw new Error(
            "Unauthorized: Only admins can register staff members",
          );
        }
      }

      const userExists = await User.findOne({
        $and: [{ $or: [{ email }, { phone }] }, { role }],
      });
      if (userExists) {
        throw new Error(
          `User with this email or phone already exists as a ${role}`,
        );
      }

      const newUser = await User.create({
        name,
        phone,
        email,
        password,
        role,
        specialization,
        license,
        verified: true,
      });

      if (newUser) {
        if (role === "patient" && !user) {
          return {
            token: generateToken(newUser._id),
            user: newUser,
          };
        }
        return {
          user: newUser,
        };
      } else {
        throw new Error("Invalid user data");
      }
    },

    login: async (_, { phone, password }) => {
      const users = await User.find({ phone });

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
            user,
          };
        }
      }

      const usersByEmail = await User.find({ email: phone });
      usersByEmail.sort((a, b) => rolePriority[b.role] - rolePriority[a.role]);

      for (const user of usersByEmail) {
        if (await user.matchPassword(password)) {
          return {
            token: generateToken(user._id),
            user,
          };
        }
      }

      throw new Error("Invalid phone/email or password");
    },

    forgotPassword: async (_, { phone }) => {
      const users = await User.find({ phone });

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
      const users = await User.find({
        phone,
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

    registerMedicine: async (_, args) => {
      const medicine = new Medicine(args);
      return await medicine.save();
    },
    
    updateMedicine: async (_, { id, ...args }) => {
      return await Medicine.findByIdAndUpdate(id, args, { new: true });
    },
    
    deleteMedicine: async (_, { id }) => {
      await Medicine.findByIdAndDelete(id);
      return true;
    },
    
    updateUser: async (_, { id, ...args }, { user }) => {
      if (!user || user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can update users");
      }
      return await User.findByIdAndUpdate(id, args, { new: true });
    },
    
    deleteUser: async (_, { id }, { user }) => {
      if (!user || user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can delete users");
      }
      await User.findByIdAndDelete(id);
      return true;
    },
    
    createAppointment: async (_, args, { io }) => {
      const appointment = new Appointment(args);
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
    updateAppointment: async (_, { id, ...args }, { io }) => {
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

      if (updatedAppointment && Object.keys(appointmentNotificationReset).length > 0) {
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
      return await record.save();
    },
    createInvoice: async (_, args) => {
      // Auto-generate invoice number if not provided
      let invoiceNumber = args.invoiceNumber;
      if (!invoiceNumber) {
        const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
        const nextNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.replace('INV-', '')) + 1 : 1;
        invoiceNumber = `INV-${String(nextNumber).padStart(4, '0')}`;
      }
      const invoice = new Invoice({
        ...args,
        invoiceNumber,
        amountPaid: args.amountPaid || 0,
        status: args.balance > 0 ? "Unpaid" : "Paid",
      });
      return await invoice.save();
    },
    recordInvoicePayment: async (_, { invoiceId, amount, paymentMethod, paymentDate }, { user }) => {
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
        if (!patient || invoice.patientId.toString() !== patient._id.toString()) {
          throw new Error("Unauthorized: You can only pay your own invoices");
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

      return await invoice.save();
    },
    createPrescription: async (_, args) => {
      const prescription = new Prescription({
        ...args,
        date: args.date ? new Date(args.date) : new Date(),
      });
      return await prescription.save();
    },
    updateMedicineStock: async (_, { id, stock }) => {
      return await Medicine.findByIdAndUpdate(id, { stock }, { new: true });
    },
    createPatient: async (_, args) => {
      // Check if phone number already exists
      const existingPatient = await Patient.findOne({ phone: args.phone });
      if (existingPatient) {
        throw new Error("A patient with this phone number already exists");
      }
      
      // Check if we need to create a user
      let newUser = null;
      if (args.password) {
        const existingUser = await User.findOne({
          $or: [{ email: args.email }, { phone: args.phone }],
        });
        if (existingUser) {
          throw new Error("User with this email or phone already exists");
        }
        
        newUser = await User.create({
          name: args.name,
          email: args.email,
          phone: args.phone,
          password: args.password,
          role: "patient",
          verified: true,
        });
      }

      // Prepare the data with proper date conversions
      const patientData = {
        ...args,
        userId: newUser ? newUser._id : undefined,
        dateOfBirth: args.dateOfBirth ? new Date(args.dateOfBirth) : undefined,
        dentalHistory: args.dentalHistory ? {
          ...args.dentalHistory,
          lastVisit: args.dentalHistory.lastVisit ? new Date(args.dentalHistory.lastVisit) : undefined
        } : undefined,
        insurance: args.insurance ? {
          ...args.insurance,
          expiryDate: args.insurance.expiryDate ? new Date(args.insurance.expiryDate) : undefined
        } : undefined
      };
      
      const patient = new Patient(patientData);
      return await patient.save();
    },
    generatePatientLogin: async (_, { patientId }, { user }) => {
      if (!user || !["admin", "employee"].includes(user.role)) {
        throw new Error("Unauthorized: Only admins and employees can generate patient logins");
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

      if (!patient.userId || patient.userId.toString() !== patientUser._id.toString()) {
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

      if (user.role === "patient" && patient.userId?.toString() !== user._id.toString()) {
        throw new Error("Unauthorized: You can only update your own patient profile");
      }

      const nextPhone = args.phone || patient.phone;
      const nextEmail = args.email ?? patient.email;

      // Check if phone number is being changed and already exists
      if (args.phone) {
        const existingPatient = await Patient.findOne({ 
          phone: args.phone,
          _id: { $ne: id }
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
          const existingUser = await User.findOne({
            role: "patient",
            $or: [
              { phone: nextPhone },
              ...(nextEmail ? [{ email: nextEmail }] : []),
            ],
          });

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

      // Prepare the data with proper date conversions
      const updateData = {
        ...args,
        userId: patient.userId,
        dateOfBirth: args.dateOfBirth ? new Date(args.dateOfBirth) : undefined,
        dentalHistory: args.dentalHistory ? {
          ...args.dentalHistory,
          lastVisit: args.dentalHistory.lastVisit ? new Date(args.dentalHistory.lastVisit) : undefined
        } : undefined,
        insurance: args.insurance ? {
          ...args.insurance,
          expiryDate: args.insurance.expiryDate ? new Date(args.insurance.expiryDate) : undefined
        } : undefined
      };
      
      return await Patient.findByIdAndUpdate(id, updateData, { new: true });
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
  },
};

module.exports = resolvers;
