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
  description: String
  dosageForm: String!
  dosageStrength: String!
}

input RegisterMedicineInput {
  name: String!
  category: String!
  description: String
  dosageForm: String!
  dosageStrength: String!
}

input UpdateMedicineInput {
  id: ID!
  name: String
  category: String
  description: String
  dosageForm: String
  dosageStrength: String
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

  input InvoiceItemInput {
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
    patientId: String
    userId: ID
    name: String!
    email: String
    phone: String!
    dateOfBirth: String!
    gender: String!
    address: String
    bloodGroup: String
    emergencyContact: EmergencyContact
    medicalHistory: MedicalHistory
    vitalSigns: VitalSigns
    dentalHistory: DentalHistory
    insurance: Insurance
    status: String
  }

  type EmergencyContact {
    name: String
    relationship: String
    phone: String
  }

  type MedicalHistory {
    allergies: [String]
    chronicConditions: [String]
    medications: [String]
    previousSurgeries: [String]
    familyHistory: [String]
  }

  type VitalSigns {
    bloodPressure: String
    height: String
    weight: String
  }

  type DentalHistory {
    lastVisit: String
    previousTreatments: [String]
    currentIssues: [String]
  }

  type Insurance {
    provider: String
    policyNumber: String
    expiryDate: String
  }

  input EmergencyContactInput {
    name: String
    relationship: String
    phone: String
  }

  input MedicalHistoryInput {
    allergies: [String]
    chronicConditions: [String]
    medications: [String]
    previousSurgeries: [String]
    familyHistory: [String]
  }

  input VitalSignsInput {
    bloodPressure: String
    height: String
    weight: String
  }

  input DentalHistoryInput {
    lastVisit: String
    previousTreatments: [String]
    currentIssues: [String]
  }

  input InsuranceInput {
    provider: String
    policyNumber: String
    expiryDate: String
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
    token: String
    user: User!
  }

  type PatientLoginCredentials {
    patientId: ID!
    patientName: String!
    phone: String!
    password: String!
    userId: ID!
    newlyCreated: Boolean!
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

  type PatientStats {
    upcomingAppointments: Int
    totalAppointments: Int
    pendingBills: Int
    unreadMessages: Int
  }

  type DoctorStats {
    todayAppointments: Int
    totalPatients: Int
    pendingReports: Int
    unreadMessages: Int
  }

  type AdminStats {
    totalPatients: Int
    todayAppointments: Int
    pendingPayments: Int
    monthlyRevenue: Float
  }

  type DashboardStats {
    patient: PatientStats
    doctor: DoctorStats
    admin: AdminStats
  }

  type RevenueData {
    month: String
    revenue: Float
  }

  type AppointmentTypeData {
    type: String
    count: Int
  }

  type DemographicsData {
    ageGroup: String
    count: Int
  }

  type SuccessRateData {
    treatment: String
    successRate: Float
  }

  type ReportsData {
    monthlyRevenue: [RevenueData]
    appointmentsByType: [AppointmentTypeData]
    patientDemographics: [DemographicsData]
    treatmentSuccess: [SuccessRateData]
  }

  type ChatParticipant {
    id: ID!
    name: String!
    role: String!
  }

  type Conversation {
    id: ID!
    participants: [ChatParticipant]
    lastMessage: String
    lastMessageTime: String
    unreadCount: Int
  }

  type ChatMessage {
    id: ID!
    conversationId: ID!
    senderId: ID!
    senderName: String!
    senderRole: String!
    receiverId: ID!
    receiverName: String!
    receiverRole: String!
    message: String!
    timestamp: String!
    read: Boolean
  }

  type Activity {
    id: ID!
    type: String!
    action: String!
    user: String!
    timestamp: String!
  }

  type Notification {
    id: ID!
    userId: ID!
    type: String!
    title: String!
    message: String!
    timestamp: String!
    read: Boolean
    priority: String
  }

  type Query {
    me: User
    getUsers: [User]
    getUsersByRole(role: String!): [User]
    getUser(id: ID!): User
    getMedicines(page: Int, limit: Int, search: String): PaginatedMedicines
    getMedicine(id: ID!): Medicine
    getMedicineCategories: [String]
    getPatients(page: Int, limit: Int, search: String): PaginatedPatients
    getPatient(id: ID!): Patient
    getMyPatient: Patient
    checkPatientExists(phone: String!): Boolean!
    findPatientByNameAndPhone(name: String!, phone: String!): Patient
    getAppointments(page: Int, limit: Int, search: String, status: String): PaginatedAppointments
    getMedicalRecords: [MedicalRecord]
    getInvoices: [Invoice]
    getPrescriptions: [Prescription]
    getPaymentLedgers(page: Int, limit: Int, search: String): PaginatedPaymentLedgers
    getDashboardStats: DashboardStats
    getReportsData: ReportsData
    getConversations: [Conversation]
    getChatMessages(conversationId: ID!): [ChatMessage]
    getNotifications: [Notification]
    getRecentActivities(limit: Int): [Activity]
  }

  type Mutation {
    register(
      name: String!,
      phone: String!,
      email: String!,
      password: String!,
      role: String!,
      specialization: String,
      license: String
    ): AuthPayload

    login(phone: String!, password: String!): AuthPayload

    forgotPassword(phone: String!): Boolean

    resetPassword(phone: String!, otp: String!, newPassword: String!): Boolean

    registerMedicine(
      name: String!,
      category: String!,
      description: String,
      dosageForm: String!,
      dosageStrength: String!
    ): Medicine
    
    updateMedicine(
      id: ID!,
      name: String,
      category: String,
      description: String,
      dosageForm: String,
      dosageStrength: String
    ): Medicine
    
    deleteMedicine(id: ID!): Boolean

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

    updateAppointment(
      id: ID!,
      date: String,
      time: String,
      status: String,
      notes: String
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
      invoiceNumber: String,
      patientId: ID!,
      patientName: String!,
      date: String!,
      dueDate: String,
      items: [InvoiceItemInput],
      subtotal: Float!,
      tax: Float,
      discount: Float,
      total: Float!,
      balance: Float!,
      notes: String
    ): Invoice

    recordInvoicePayment(
      invoiceId: ID!,
      amount: Float!,
      paymentMethod: String!,
      paymentDate: String
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
      email: String,
      phone: String!,
      dateOfBirth: String!,
      gender: String!,
      address: String,
      bloodGroup: String,
      userId: ID,
      emergencyContact: EmergencyContactInput,
      medicalHistory: MedicalHistoryInput,
      vitalSigns: VitalSignsInput,
      dentalHistory: DentalHistoryInput,
      insurance: InsuranceInput,
      status: String,
      password: String
    ): Patient

    generatePatientLogin(patientId: ID!): PatientLoginCredentials

    updatePatient(
      id: ID!,
      name: String,
      email: String,
      phone: String,
      dateOfBirth: String,
      gender: String,
      address: String,
      bloodGroup: String,
      emergencyContact: EmergencyContactInput,
      medicalHistory: MedicalHistoryInput,
      vitalSigns: VitalSignsInput,
      dentalHistory: DentalHistoryInput,
      insurance: InsuranceInput,
      status: String,
      password: String
    ): Patient
    
    deletePatient(id: ID!): Boolean
    
    updateUser(
      id: ID!,
      name: String,
      email: String,
      phone: String,
      role: String,
      specialization: String,
      license: String,
      password: String
    ): User
    
    deleteUser(id: ID!): Boolean

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
