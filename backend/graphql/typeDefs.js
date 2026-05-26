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
  }

  type Appointment {
    id: ID!
    patientId: ID!
    patientName: String!
    doctorId: ID!
    doctorName: String!
    date: String!
    time: String!
    duration: Int
    type: String!
    status: String
    reason: String
    notes: String
  }

  type MedicalRecord {
    id: ID!
    patientId: ID!
    patientName: String!
    doctorId: ID!
    doctorName: String!
    date: String!
    visitType: String
    diagnosis: String
    treatment: String
    prescriptions: [String]
    notes: String
  }

  type InvoiceItem {
    description: String
    quantity: Int
    unitPrice: Float
    total: Float
  }

  type Invoice {
    id: ID!
    invoiceNumber: String!
    patientId: ID!
    patientName: String!
    date: String!
    dueDate: String
    items: [InvoiceItem]
    subtotal: Float!
    tax: Float
    discount: Float
    total: Float!
    amountPaid: Float
    balance: Float!
    status: String
    paymentMethod: String
    paymentDate: String
    notes: String
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

  type Medication {
    name: String
    dosage: String
    frequency: String
    duration: String
    instructions: String
  }

  type Prescription {
    id: ID!
    patientId: ID!
    patientName: String!
    doctorId: ID!
    doctorName: String!
    date: String!
    diagnosis: String
    medications: [Medication]
    notes: String
    status: String
  }

  input MedicationInput {
    name: String
    dosage: String
    frequency: String
    duration: String
    instructions: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type PaginatedMedicines {
    medicines: [Medicine]
    totalCount: Int
    totalPages: Int
    currentPage: Int
  }

  type PaginatedPatients {
    patients: [Patient]
    totalCount: Int
    totalPages: Int
    currentPage: Int
  }

  type PaginatedAppointments {
    appointments: [Appointment]
    totalCount: Int
    totalPages: Int
    currentPage: Int
  }

  type PaginatedPaymentLedgers {
    paymentLedgers: [PaymentLedger]
    totalCount: Int
    totalPages: Int
    currentPage: Int
  }

  type Query {
    me: User
    getUsers: [User]
    getUsersByRole(role: String!): [User]
    getUser(id: ID!): User
    getMedicines(page: Int, limit: Int): PaginatedMedicines
    getMedicine(id: ID!): Medicine
    getPatients(page: Int, limit: Int): PaginatedPatients
    getPatient(id: ID!): Patient
    getAppointments(page: Int, limit: Int): PaginatedAppointments
    getMedicalRecords: [MedicalRecord]
    getInvoices: [Invoice]
    getPrescriptions: [Prescription]
    getPaymentLedgers(page: Int, limit: Int): PaginatedPaymentLedgers
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
      category: String!
    ): Medicine

    createAppointment(
      patientId: ID!,
      patientName: String!,
      doctorId: ID!,
      doctorName: String!,
      date: String!,
      time: String!,
      type: String!,
      reason: String
    ): Appointment

    createMedicalRecord(
      patientId: ID!,
      patientName: String!,
      doctorId: ID!,
      doctorName: String!,
      date: String!,
      diagnosis: String,
      treatment: String,
      prescriptions: [String]
    ): MedicalRecord

    createInvoice(
      invoiceNumber: String!,
      patientId: ID!,
      patientName: String!,
      date: String!,
      subtotal: Float!,
      total: Float!,
      balance: Float!
    ): Invoice

    createPrescription(
      patientId: ID!,
      patientName: String!,
      doctorId: ID!,
      doctorName: String!,
      diagnosis: String,
      medications: [MedicationInput],
      notes: String
    ): Prescription

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
