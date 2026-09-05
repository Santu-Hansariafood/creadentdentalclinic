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

  type Attachment {
    storageKey: String!
    name: String!
    originalName: String
    size: Int
    type: String
    url: String
    uploadedAt: String
  }

  input AttachmentInput {
    storageKey: String!
    name: String!
    originalName: String
    size: Int
    type: String
    url: String
  }

  type RecordVitalSigns {
    bloodPressure: String
    heartRate: Int
    temperature: String
    height: String
    weight: String
  }

  input RecordVitalSignsInput {
    bloodPressure: String
    heartRate: Int
    temperature: String
    height: String
    weight: String
  }

  type MedicalRecord {
    id: ID!
    patientId: ID!
    patient: Patient
    patientName: String!
    doctorId: ID!
    doctorName: String!
    date: String!
    visitType: String
    diagnosis: String
    treatment: String
    prescriptions: [String]
    notes: String
    followUpDate: String
    vitalSigns: RecordVitalSigns
    attachments: [Attachment]
    createdAt: String
    updatedAt: String
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
    createdAt: String
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
    transactionId: String
    merchantTxnNo: String
    pgTxnNo: String
    authRefNo: String
    notes: String
  }

  type Patient {
    id: ID!
    patientId: String
    userId: ID
    name: String!
    email: String
    phone: String!
    dateOfBirth: String
    age: Int
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
    treatmentName: String
    paymentDate: String!
    paymentMode: String
    referenceNo: String
    paymentAmount: Float!
    dueAmount: Float!
    gst: Float
    credit: Float
    claims: Float
    cd: Float
    bankCharges: Float
    balance: Float
    status: String
    remarks: String
    invoiceId: ID
    transactionId: ID
    merchantTxnNo: String
    pgTxnNo: String
    authRefNo: String
    arnNo: String
    txnStatus: String
    txnResponseCode: String
    txnResponseMsg: String
    currencyCode: String
  }

  type Diagnosis {
    name: String!
    critical: Boolean
  }

  input DiagnosisInput {
    name: String!
    critical: Boolean
  }

  type Medication {
    name: String
    dosage: String
    dosageForm: String
    frequency: String
    duration: String
    instructions: String
  }

  type Prescription {
    id: ID!
    patientId: ID!
    patientName: String!
    patient: Patient
    doctorId: ID!
    doctorName: String!
    date: String!
    diagnosis: String
    diagnoses: [Diagnosis]
    medications: [Medication]
    notes: String
    status: String
    pdfUrl: String
    pdfStorageKey: String
  }

  type EmailSendResult {
    success: Boolean!
    message: String
    messageId: String
    sentTo: String
  }

  input MedicationInput {
    name: String
    dosage: String
    dosageForm: String
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

  type WhatsAppSendResult {
    success: Boolean!
    skipped: Boolean
    message: String
    phone: String
    patientName: String
    error: String
    messagePreview: String
    fileUrl: String
  }

  type WhatsAppMessage {
    id: ID!
    direction: String!
    phone: String!
    patientId: ID
    patientName: String
    text: String
    messageType: String
    templateName: String
    templateParameters: [String]
    status: String
    read: Boolean!
    messageId: String
    error: String
    createdAt: String
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
    totalPayment: Float
    dateWiseTotals: [PaymentLedgerDateTotal]
    paymentModeTotals: [PaymentLedgerGroupTotal]
    statusTotals: [PaymentLedgerGroupTotal]
  }

  type PaymentLedgerDateTotal {
    date: String!
    amount: Float!
  }

  type PaymentLedgerGroupTotal {
    name: String!
    amount: Float!
    count: Int!
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

  type ICICISaleResponse {
    transactionId: ID!
    merchantTxnNo: String!
    txnStatus: String
    txnResponseCode: String
    txnResponseMsg: String
    pgTxnNo: String
    authRefNo: String
    redirectURI: String
    tranCtx: String
    showOTPCapturePage: String
    apiSuccess: Boolean
    apiError: String
  }

  type ICICIGenericResponse {
    success: Boolean!
    data: String
    error: String
  }

  type ICICITransactionStatus {
    success: Boolean!
    data: String
    error: String
    transaction: ICICITransactionSummary
    removed: Boolean
    message: String
  }

  type ICICITransactionSummary {
    id: ID!
    merchantTxnNo: String!
    txnStatus: String
    amount: Float
    invoiceId: ID!
  }

  type ICICICallbackResponse {
    success: Boolean!
    hashValid: Boolean
    transaction: ICICITransactionSummary
    invoice: ICICIReconciledInvoice
    error: String
  }

  type ICICIReconciledInvoice {
    id: ID!
    status: String
    balance: Float
    amountPaid: Float
  }

  type ICICIRefundResponse {
    success: Boolean!
    refundTxnNo: String
    refundAmount: Float
    data: String
    error: String
  }

  type Transaction {
    id: ID!
    invoiceId: ID!
    patientId: ID!
    merchantTxnNo: String!
    amount: Float!
    currencyCode: String
    transactionType: String
    txnDate: String
    customerEmailID: String
    customerMobileNo: String
    payType: String
    txnStatus: String
    txnResponseCode: String
    txnResponseMsg: String
    pgTxnNo: String
    authRefNo: String
    arnNo: String
    showOTPCapturePage: String
    otpGenerated: Boolean
    otpVerified: Boolean
    authorized: Boolean
    settlementDate: String
    settlementStatus: String
    refundedAmount: Float
    refundTxnNo: String
    refundStatus: String
    amountPaidApplied: Float
    hashVerified: Boolean
    createdAt: String
    updatedAt: String
  }

  type PaginatedTransactions {
    transactions: [Transaction]
    totalCount: Int
    totalPages: Int
    currentPage: Int
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
    checkPatientExists(phone: String, email: String, patientId: ID): Boolean!
    findPatientByNameAndPhone(name: String!, phone: String!): Patient
    findPatientByNameAndEmail(name: String!, email: String!): Patient
    findPatientsByNameOrContact(name: String, email: String, phone: String): [Patient]!
    getAppointments(page: Int, limit: Int, search: String, status: String, patientId: ID): PaginatedAppointments
    getMedicalRecords(patientId: ID): [MedicalRecord]
    getInvoices(patientId: ID): [Invoice]
    getPrescriptions(patientId: ID): [Prescription]
    getPaymentLedgers(page: Int, limit: Int, search: String): PaginatedPaymentLedgers
    getDashboardStats: DashboardStats
    getReportsData: ReportsData
    getConversations: [Conversation]
    getChatMessages(conversationId: ID!): [ChatMessage]
    getNotifications: [Notification]
    getRecentActivities(limit: Int): [Activity]
    getTransactions(page: Int, limit: Int, invoiceId: ID, patientId: ID, txnStatus: String): PaginatedTransactions
    getTransaction(id: ID!): Transaction
    getWhatsAppMessages(patientId: ID, limit: Int, before: String): [WhatsAppMessage]!
  }

  type Mutation {
    register(
      name: String!,
      phone: String!,
      email: String,
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

    deleteAppointment(id: ID!): Boolean

    createMedicalRecord(
      patientId: ID!,
      patientName: String!,
      doctorId: ID!,
      doctorName: String!,
      date: String!,
      visitType: String,
      diagnosis: String,
      treatment: String,
      prescriptions: [String],
      notes: String,
      followUpDate: String,
      vitalSigns: RecordVitalSignsInput,
      attachments: [AttachmentInput]
    ): MedicalRecord

    updateMedicalRecord(
      id: ID!,
      visitType: String,
      diagnosis: String,
      treatment: String,
      prescriptions: [String],
      notes: String,
      followUpDate: String,
      vitalSigns: RecordVitalSignsInput,
      attachments: [AttachmentInput]
    ): MedicalRecord

    deleteMedicalRecord(id: ID!): Boolean

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

    updateInvoice(
      id: ID!,
      invoiceNumber: String,
      patientId: ID,
      patientName: String,
      date: String,
      dueDate: String,
      items: [InvoiceItemInput],
      subtotal: Float,
      tax: Float,
      discount: Float,
      total: Float,
      balance: Float,
      amountPaid: Float,
      status: String,
      paymentMethod: String,
      paymentDate: String,
      notes: String
    ): Invoice

    deleteInvoice(id: ID!): Boolean

    sendInvoiceWhatsApp(invoiceId: ID!, patientId: ID): WhatsAppSendResult!

    sendLoginCredentialsWhatsApp(
      patientId: ID!,
      patientName: String!,
      phone: String!,
      password: String!
    ): WhatsAppSendResult!

    sendPrescriptionWhatsAppLink(
      prescriptionId: ID!
      pdfDataUri: String!
      fileName: String
    ): WhatsAppSendResult!

    sendWhatsAppMessage(patientId: ID, phone: String, message: String!): WhatsAppSendResult!
    markWhatsAppMessagesRead(patientId: ID!): Boolean!

    createPrescription(
      patientId: ID!,
      patientName: String!,
      doctorId: ID!,
      doctorName: String!,
      diagnosis: String,
      diagnoses: [DiagnosisInput],
      medications: [MedicationInput],
      notes: String
    ): Prescription

    sendPrescriptionEmail(
      prescriptionId: ID!,
      patientName: String,
      patientEmail: String,
      patientId: String,
      doctorName: String,
      date: String,
      diagnosis: String,
      diagnoses: [DiagnosisInput],
      notes: String,
      medications: [MedicationInput],
      pdfDataUri: String
    ): EmailSendResult

    updateMedicineStock(id: ID!, stock: Int!): Medicine

    createPatient(
      name: String!,
      email: String,
      phone: String!,
      dateOfBirth: String,
      age: Int,
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
      age: Int,
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

    iciciInitiateSale(
      invoiceId: ID!
      patientId: ID!
      amount: Float!
      customerEmailID: String
      customerMobileNo: String
      payType: String
    ): ICICISaleResponse!

    iciciGenerateOTP(
      transactionId: ID!
      tranCtx: String
    ): ICICIGenericResponse!

    iciciVerifyOTP(
      transactionId: ID!
      tranCtx: String
      otpValue: String!
    ): ICICIGenericResponse!

    iciciAuthorize(
      transactionId: ID!
      tranCtx: String
    ): ICICIGenericResponse!

    iciciGetTransactionStatus(
      transactionId: ID
      merchantTxnNo: String
    ): ICICITransactionStatus!

    iciciProcessRefund(
      transactionId: ID!
      refundAmount: Float!
      reason: String
    ): ICICIRefundResponse!
  }
`;

module.exports = typeDefs;
