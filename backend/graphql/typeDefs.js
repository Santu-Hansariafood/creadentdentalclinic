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

  type Query {
    getUsers: [User]
    getUser(id: ID!): User
    getMedicines: [Medicine]
    getMedicine(id: ID!): Medicine
    getPatients: [Patient]
    getPatient(id: ID!): Patient
  }

  type Mutation {
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
  }
`;

module.exports = typeDefs;
