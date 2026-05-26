const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');

const resolvers = {
  Query: {
    getUsers: async () => await User.find(),
    getUser: async (_, { id }) => await User.findById(id),
    getMedicines: async () => await Medicine.find(),
    getMedicine: async (_, { id }) => await Medicine.findById(id),
    getPatients: async () => await Patient.find(),
    getPatient: async (_, { id }) => await Patient.findById(id),
  },
  Mutation: {
    registerMedicine: async (_, args) => {
      const medicine = new Medicine(args);
      return await medicine.save();
    },
    updateMedicineStock: async (_, { id, stock }) => {
      return await Medicine.findByIdAndUpdate(id, { stock }, { new: true });
    },
  },
};

module.exports = resolvers;
