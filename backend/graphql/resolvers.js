const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Invoice = require('../models/Invoice');
const Prescription = require('../models/Prescription');
const PaymentLedger = require('../models/PaymentLedger');
const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const Notification = require('../models/Notification');
const generateToken = require('../utils/generateToken');

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return user;
    },
    getUsers: async () => await User.find(),
    getUsersByRole: async (_, { role }) => await User.find({ role }),
    getUser: async (_, { id }) => await User.findById(id),
    getMedicines: async (_, { page = 1, limit = 10, search = '' }) => {
      const skip = (page - 1) * limit;
      const query = search ? { name: { $regex: search, $options: 'i' } } : {};
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
    getPatients: async (_, { page = 1, limit = 10, search = '' }) => {
      const skip = (page - 1) * limit;
      const query = search ? { 
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      } : {};
      const patients = await Patient.find(query).skip(skip).limit(limit);
      const totalCount = await Patient.countDocuments(query);
      return {
        patients,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },
    getPatient: async (_, { id }) => await Patient.findById(id),
    getAppointments: async (_, { page = 1, limit = 10, search = '', status = 'All' }) => {
      const skip = (page - 1) * limit;
      const query = {};
      if (status && status !== 'All') {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { patientName: { $regex: search, $options: 'i' } },
          { doctorName: { $regex: search, $options: 'i' } },
          { type: { $regex: search, $options: 'i' } }
        ];
      }
      const appointments = await Appointment.find(query).sort({ date: 1, time: 1 }).skip(skip).limit(limit);
      const totalCount = await Appointment.countDocuments(query);
      return {
        appointments,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },
    getMedicalRecords: async () => await MedicalRecord.find().sort({ date: -1 }),
    getInvoices: async () => await Invoice.find().sort({ date: -1 }),
    getPrescriptions: async () => await Prescription.find().sort({ date: -1 }),
    getPaymentLedgers: async (_, { page = 1, limit = 10, search = '' }) => {
      const skip = (page - 1) * limit;
      const paymentLedgers = await PaymentLedger.find().sort({ slNo: 1 }).skip(skip).limit(limit);
      const totalCount = await PaymentLedger.countDocuments();
      return {
        paymentLedgers,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },
    getDashboardStats: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const totalPatients = await Patient.countDocuments();
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = await Appointment.countDocuments({ date: today });
      
      const invoices = await Invoice.find();
      const pendingPayments = invoices.filter(inv => inv.balance > 0).length;
      const monthlyRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

      const unreadMessages = await ChatMessage.countDocuments({ receiverId: user._id, read: false });
      const upcomingAppointments = await Appointment.countDocuments({ patientId: user._id, date: { $gte: today }, status: 'Scheduled' });
      const pendingBills = await Invoice.countDocuments({ patientId: user._id, balance: { $gt: 0 } });

      const doctorApts = await Appointment.countDocuments({ doctorId: user._id, date: today });
      const doctorPatients = await Appointment.distinct('patientId', { doctorId: user._id }).length;
      const pendingReports = await MedicalRecord.countDocuments({ doctorId: user._id, diagnosis: { $exists: false } });

      return {
        patient: {
          upcomingAppointments,
          totalAppointments: await Appointment.countDocuments({ patientId: user._id }),
          pendingBills,
          unreadMessages
        },
        doctor: {
          todayAppointments: doctorApts,
          totalPatients: doctorPatients,
          pendingReports,
          unreadMessages
        },
        admin: {
          totalPatients,
          todayAppointments,
          pendingPayments,
          monthlyRevenue
        }
      };
    },
    getReportsData: async () => {
      // Mocked for now but coming from backend
      return {
        monthlyRevenue: [
          { month: 'Jan', revenue: 38000 },
          { month: 'Feb', revenue: 42000 },
          { month: 'Mar', revenue: 39500 },
          { month: 'Apr', revenue: 45000 },
          { month: 'May', revenue: 48000 },
          { month: 'Jun', revenue: 45600 }
        ],
        appointmentsByType: [
          { type: 'Check-up', count: 45 },
          { type: 'Treatment', count: 32 },
          { type: 'Consultation', count: 28 },
          { type: 'Emergency', count: 15 },
          { type: 'Follow-up', count: 20 }
        ],
        patientDemographics: [
          { ageGroup: '0-18', count: 25 },
          { ageGroup: '19-35', count: 48 },
          { ageGroup: '36-50', count: 52 },
          { ageGroup: '51-65', count: 31 },
          { ageGroup: '65+', count: 20 }
        ],
        treatmentSuccess: [
          { treatment: 'Root Canal', successRate: 95 },
          { treatment: 'Filling', successRate: 98 },
          { treatment: 'Extraction', successRate: 99 },
          { treatment: 'Crown', successRate: 96 },
          { treatment: 'Gum Treatment', successRate: 92 }
        ]
      };
    },
    getConversations: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await Conversation.find({ 'participants.id': user._id }).sort({ lastMessageTime: -1 });
    },
    getChatMessages: async (_, { conversationId }) => {
      return await ChatMessage.find({ conversationId }).sort({ timestamp: 1 });
    },
    getNotifications: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await Notification.find({ userId: user._id }).sort({ timestamp: -1 });
    }
  },
  Mutation: {
    register: async (_, { name, phone, email, password, role, specialization, license }) => {
      const userExists = await User.findOne({ $or: [{ email }, { phone }] });
      if (userExists) {
        throw new Error('User with this email or phone already exists');
      }

      const user = await User.create({
        name,
        phone,
        email,
        password,
        role,
        specialization,
        license,
        verified: true // Setting to true for simplicity now
      });

      if (user) {
        return {
          token: generateToken(user._id),
          user,
        };
      } else {
        throw new Error('Invalid user data');
      }
    },

    login: async (_, { phone, password }) => {
      const user = await User.findOne({ phone });

      if (user && (await user.matchPassword(password))) {
        return {
          token: generateToken(user._id),
          user,
        };
      } else {
        throw new Error('Invalid phone or password');
      }
    },

    forgotPassword: async (_, { phone }) => {
      const user = await User.findOne({ phone });
      if (!user) {
        throw new Error('User not found with this mobile number');
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP and expiry (10 minutes)
      user.resetPasswordOTP = otp;
      user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      // SIMULATE SENDING WHATSAPP OTP
      console.log('--------------------------------------------------');
      console.log(`WHATSAPP OTP SENT TO ${phone}: ${otp}`);
      console.log('--------------------------------------------------');

      return true;
    },

    resetPassword: async (_, { phone, otp, newPassword }) => {
      const user = await User.findOne({ 
        phone,
        resetPasswordOTP: otp,
        resetPasswordOTPExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired OTP');
      }

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
    createAppointment: async (_, args, { io }) => {
      const appointment = new Appointment(args);
      const savedAppointment = await appointment.save();
      
      // Emit notification via socket
      if (io) {
        io.emit('notification', {
          type: 'NEW_APPOINTMENT',
          message: `New appointment booked for ${savedAppointment.patientName} on ${savedAppointment.date}`,
          appointment: savedAppointment
        });
      }
      
      return savedAppointment;
    },
    updateAppointment: async (_, { id, ...args }, { io }) => {
      const updatedAppointment = await Appointment.findByIdAndUpdate(id, args, { new: true });
      
      // Emit notification via socket if status is changed or date/time is changed (rescheduled)
      if (io && updatedAppointment) {
        let message = `Appointment for ${updatedAppointment.patientName} has been updated`;
        let type = 'APPOINTMENT_UPDATED';

        if (args.date || args.time) {
          message = `Appointment for ${updatedAppointment.patientName} has been rescheduled to ${updatedAppointment.date} at ${updatedAppointment.time}`;
          type = 'APPOINTMENT_RESCHEDULED';
        }

        io.emit('notification', {
          type,
          message,
          appointment: updatedAppointment
        });
      }

      return updatedAppointment;
    },
    createMedicalRecord: async (_, args) => {
      const record = new MedicalRecord(args);
      return await record.save();
    },
    createInvoice: async (_, args) => {
      const invoice = new Invoice(args);
      return await invoice.save();
    },
    createPrescription: async (_, args) => {
      const prescription = new Prescription(args);
      return await prescription.save();
    },
    updateMedicineStock: async (_, { id, stock }) => {
      return await Medicine.findByIdAndUpdate(id, { stock }, { new: true });
    },
    createPatient: async (_, args) => {
      const patient = new Patient(args);
      return await patient.save();
    },
    addPaymentLedger: async (_, args) => {
      const ledger = new PaymentLedger(args);
      return await ledger.save();
    },
  },
};

module.exports = resolvers;
