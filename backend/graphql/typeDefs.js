const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    phone: String
    verified: Boolean
    specialization: String
    license: String
  }

  type Medicine {
    id: ID!
    name: String!
    category: String!
    manufacturer: String!
    dosage: String!
    price: Float!
    stock: Int!
    expiryDate: String!
    description: String
  }

  type Patient {
    id: ID!
    name: String!
    email: String!
    phone: String!
    dateOfBirth: String!
    gender: String!
    address: String
    bloodGroup: String
    status: String
  }

  type PaymentLedger {
    id: ID!
    slNo: Int!
    lorryNo: String!
    paymentDate: String!
    paymentAmount: Float!
    dueAmount: Float!
    status: String
    remarks: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    getUsers: [User]
    getUser(id: ID!): User
    getMedicines: [Medicine]
    getMedicine(id: ID!): Medicine
    getPatients: [Patient]
    getPatient(id: ID!): Patient
    getPaymentLedgers: [PaymentLedger]
  }

  type Mutation {
    register(
      name: String!,
      email: String!,
      password: String!,
      role: String!,
      phone: String,
      specialization: String,
      license: String
    ): AuthPayload

    login(email: String!, password: String!): AuthPayload

    registerMedicine(
      name: String!,
      category: String!,
      manufacturer: String!,
      dosage: String!,
      price: Float!,
      stock: Int!,
      expiryDate: String!,
      description: String
    ): Medicine

    updateMedicineStock(id: ID!, stock: Int!): Medicine

    createPatient(
      name: String!,
      email: String!,
      phone: String!,
      dateOfBirth: String!,
      gender: String!,
      address: String,
      bloodGroup: String
    ): Patient

    addPaymentLedger(
      slNo: Int!,
      lorryNo: String!,
      paymentDate: String!,
      paymentAmount: Float!,
      dueAmount: Float!,
      remarks: String
    ): PaymentLedger
  }
`;

module.exports = typeDefs;
