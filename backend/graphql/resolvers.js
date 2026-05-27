const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Invoice = require('../models/Invoice');
const Prescription = require('../models/Prescription');
const PaymentLedger = require('../models/PaymentLedger');
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
    getMedicines: async (_, { page = 1, limit = 10 }) => {
      const skip = (page - 1) * limit;
      const medicines = await Medicine.find().skip(skip).limit(limit);
      const totalCount = await Medicine.countDocuments();
      return {
        medicines,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },
    getMedicine: async (_, { id }) => await Medicine.findById(id),
    getPatients: async (_, { page = 1, limit = 10 }) => {
      const skip = (page - 1) * limit;
      const patients = await Patient.find().skip(skip).limit(limit);
      const totalCount = await Patient.countDocuments();
      return {
        patients,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },
    getPatient: async (_, { id }) => await Patient.findById(id),
    getAppointments: async (_, { page = 1, limit = 10 }) => {
      const skip = (page - 1) * limit;
      const appointments = await Appointment.find().sort({ date: 1, time: 1 }).skip(skip).limit(limit);
      const totalCount = await Appointment.countDocuments();
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
    getPaymentLedgers: async (_, { page = 1, limit = 10 }) => {
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
  },
  Mutation: {
    register: async (_, { name, email, password, role, phone, specialization, license }) => {
      const userExists = await User.findOne({ email });
      if (userExists) {
        throw new Error('User already exists');
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        phone,
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

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });

      if (user && (await user.matchPassword(password))) {
        return {
          token: generateToken(user._id),
          user,
        };
      } else {
        throw new Error('Invalid email or password');
      }
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
