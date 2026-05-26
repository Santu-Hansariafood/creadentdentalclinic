const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');
const PaymentLedger = require('../models/PaymentLedger');
const generateToken = require('../utils/generateToken');

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return user;
    },
    getUsers: async () => await User.find(),
    getUser: async (_, { id }) => await User.findById(id),
    getMedicines: async () => await Medicine.find(),
    getMedicine: async (_, { id }) => await Medicine.findById(id),
    getPatients: async () => await Patient.find(),
    getPatient: async (_, { id }) => await Patient.findById(id),
    getPaymentLedgers: async () => await PaymentLedger.find().sort({ slNo: 1 }),
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
