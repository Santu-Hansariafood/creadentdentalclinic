import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($phone: String!, $password: String!) {
    login(phone: $phone, password: $password) {
      token
      user {
        id
        name
        phone
        email
        role
      }
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($phone: String!) {
    forgotPassword(phone: $phone)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword(
    $phone: String!
    $otp: String!
    $newPassword: String!
  ) {
    resetPassword(phone: $phone, otp: $otp, newPassword: $newPassword)
  }
`;

export const CREATE_PATIENT = gql`
  mutation CreatePatient(
    $name: String!
    $email: String
    $phone: String!
    $dateOfBirth: String
    $age: Int
    $gender: String!
    $address: String
    $bloodGroup: String
    $userId: ID
    $emergencyContact: EmergencyContactInput
    $medicalHistory: MedicalHistoryInput
    $vitalSigns: VitalSignsInput
    $dentalHistory: DentalHistoryInput
    $insurance: InsuranceInput
    $status: String
    $password: String
  ) {
    createPatient(
      name: $name
      email: $email
      phone: $phone
      dateOfBirth: $dateOfBirth
      age: $age
      gender: $gender
      address: $address
      bloodGroup: $bloodGroup
      userId: $userId
      emergencyContact: $emergencyContact
      medicalHistory: $medicalHistory
      vitalSigns: $vitalSigns
      dentalHistory: $dentalHistory
      insurance: $insurance
      status: $status
      password: $password
    ) {
      id
      name
    }
  }
`;

export const REGISTER = gql`
  mutation Register(
    $name: String!
    $phone: String!
    $email: String
    $password: String!
    $role: String!
    $specialization: String
    $license: String
  ) {
    register(
      name: $name
      phone: $phone
      email: $email
      password: $password
      role: $role
      specialization: $specialization
      license: $license
    ) {
      token
      user {
        id
        name
        phone
        email
        role
      }
    }
  }
`;

export const REGISTER_MEDICINE = gql`
  mutation RegisterMedicine(
    $name: String!
    $category: String!
    $description: String
    $dosageForm: String!
    $dosageStrength: String!
  ) {
    registerMedicine(
      name: $name
      category: $category
      description: $description
      dosageForm: $dosageForm
      dosageStrength: $dosageStrength
    ) {
      id
      name
      category
      dosageForm
      dosageStrength
    }
  }
`;

export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment(
    $patientId: ID!
    $patientName: String!
    $doctorId: ID!
    $doctorName: String!
    $date: String!
    $time: String!
    $type: String!
    $reason: String
  ) {
    createAppointment(
      patientId: $patientId
      patientName: $patientName
      doctorId: $doctorId
      doctorName: $doctorName
      date: $date
      time: $time
      type: $type
      reason: $reason
    ) {
      id
      status
    }
  }
`;

export const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment(
    $id: ID!
    $date: String
    $time: String
    $status: String
    $notes: String
  ) {
    updateAppointment(
      id: $id
      date: $date
      time: $time
      status: $status
      notes: $notes
    ) {
      id
      status
      date
      time
    }
  }
`;

export const CREATE_PRESCRIPTION = gql`
  mutation CreatePrescription(
    $patientId: ID!
    $patientName: String!
    $doctorId: ID!
    $doctorName: String!
    $diagnosis: String
    $medications: [MedicationInput]
    $notes: String
  ) {
    createPrescription(
      patientId: $patientId
      patientName: $patientName
      doctorId: $doctorId
      doctorName: $doctorName
      diagnosis: $diagnosis
      medications: $medications
      notes: $notes
    ) {
      id
      patientId
      patientName
      doctorId
      doctorName
      date
      diagnosis
      medications {
        name
        dosage
        frequency
        duration
        instructions
      }
      notes
      status
    }
  }
`;

export const SEND_PRESCRIPTION_EMAIL = gql`
  mutation SendPrescriptionEmail(
    $prescriptionId: ID!
    $patientName: String
    $patientEmail: String
    $patientId: String
    $doctorName: String
    $date: String
    $diagnosis: String
    $notes: String
    $medications: [MedicationInput]
    $pdfDataUri: String
  ) {
    sendPrescriptionEmail(
      prescriptionId: $prescriptionId
      patientName: $patientName
      patientEmail: $patientEmail
      patientId: $patientId
      doctorName: $doctorName
      date: $date
      diagnosis: $diagnosis
      notes: $notes
      medications: $medications
      pdfDataUri: $pdfDataUri
    ) {
      success
      message
      messageId
      sentTo
    }
  }
`;

export const CREATE_MEDICAL_RECORD = gql`
  mutation CreateMedicalRecord(
    $patientId: ID!
    $patientName: String!
    $doctorId: ID!
    $doctorName: String!
    $date: String!
    $visitType: String
    $diagnosis: String
    $treatment: String
    $prescriptions: [String]
    $notes: String
    $followUpDate: String
    $vitalSigns: RecordVitalSignsInput
    $attachments: [AttachmentInput]
  ) {
    createMedicalRecord(
      patientId: $patientId
      patientName: $patientName
      doctorId: $doctorId
      doctorName: $doctorName
      date: $date
      visitType: $visitType
      diagnosis: $diagnosis
      treatment: $treatment
      prescriptions: $prescriptions
      notes: $notes
      followUpDate: $followUpDate
      vitalSigns: $vitalSigns
      attachments: $attachments
    ) {
      id
    }
  }
`;

export const UPDATE_MEDICAL_RECORD = gql`
  mutation UpdateMedicalRecord(
    $id: ID!
    $visitType: String
    $diagnosis: String
    $treatment: String
    $prescriptions: [String]
    $notes: String
    $followUpDate: String
    $vitalSigns: RecordVitalSignsInput
    $attachments: [AttachmentInput]
  ) {
    updateMedicalRecord(
      id: $id
      visitType: $visitType
      diagnosis: $diagnosis
      treatment: $treatment
      prescriptions: $prescriptions
      notes: $notes
      followUpDate: $followUpDate
      vitalSigns: $vitalSigns
      attachments: $attachments
    ) {
      id
      patientId
      patientName
      date
      visitType
    }
  }
`;

export const DELETE_MEDICAL_RECORD = gql`
  mutation DeleteMedicalRecord($id: ID!) {
    deleteMedicalRecord(id: $id)
  }
`;

export const CREATE_INVOICE = gql`
  mutation CreateInvoice(
    $invoiceNumber: String
    $patientId: ID!
    $patientName: String!
    $date: String!
    $dueDate: String
    $items: [InvoiceItemInput]
    $subtotal: Float!
    $tax: Float
    $discount: Float
    $total: Float!
    $balance: Float!
    $notes: String
  ) {
    createInvoice(
      invoiceNumber: $invoiceNumber
      patientId: $patientId
      patientName: $patientName
      date: $date
      dueDate: $dueDate
      items: $items
      subtotal: $subtotal
      tax: $tax
      discount: $discount
      total: $total
      balance: $balance
      notes: $notes
    ) {
      id
      patientId
      patientName
      date
      dueDate
      items {
        description
        quantity
        unitPrice
        total
      }
      subtotal
      tax
      discount
      total
      amountPaid
      balance
      status
      invoiceNumber
      paymentMethod
      paymentDate
      notes
    }
  }
`;

export const RECORD_INVOICE_PAYMENT = gql`
  mutation RecordInvoicePayment(
    $invoiceId: ID!
    $amount: Float!
    $paymentMethod: String!
    $paymentDate: String
  ) {
    recordInvoicePayment(
      invoiceId: $invoiceId
      amount: $amount
      paymentMethod: $paymentMethod
      paymentDate: $paymentDate
    ) {
      id
      invoiceNumber
      patientId
      patientName
      date
      dueDate
      items {
        description
        quantity
        unitPrice
        total
      }
      subtotal
      tax
      discount
      total
      amountPaid
      balance
      status
      paymentMethod
      paymentDate
      notes
    }
  }
`;

export const UPDATE_MEDICINE_STOCK = gql`
  mutation UpdateMedicineStock($id: ID!, $stock: Int!) {
    updateMedicineStock(id: $id, stock: $stock) {
      id
      stock
    }
  }
`;

export const UPDATE_MEDICINE = gql`
  mutation UpdateMedicine($id: ID!, $name: String, $category: String, $description: String, $dosageForm: String, $dosageStrength: String) {
    updateMedicine(id: $id, name: $name, category: $category, description: $description, dosageForm: $dosageForm, dosageStrength: $dosageStrength) {
      id
      name
      category
      description
      dosageForm
      dosageStrength
    }
  }
`;

export const DELETE_MEDICINE = gql`
  mutation DeleteMedicine($id: ID!) {
    deleteMedicine(id: $id)
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser(
    $id: ID!
    $name: String
    $email: String
    $phone: String
    $role: String
    $specialization: String
    $license: String
    $password: String
  ) {
    updateUser(
      id: $id
      name: $name
      email: $email
      phone: $phone
      role: $role
      specialization: $specialization
      license: $license
      password: $password
    ) {
      id
      name
      email
      phone
      role
      specialization
      license
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

export const UPDATE_PATIENT = gql`
  mutation UpdatePatient(
    $id: ID!,
    $name: String,
    $email: String,
    $phone: String,
    $dateOfBirth: String,
    $age: Int,
    $gender: String,
    $address: String,
    $bloodGroup: String,
    $status: String,
    $emergencyContact: EmergencyContactInput,
    $medicalHistory: MedicalHistoryInput,
    $vitalSigns: VitalSignsInput,
    $dentalHistory: DentalHistoryInput,
    $insurance: InsuranceInput,
    $password: String
  ) {
    updatePatient(
      id: $id,
      name: $name,
      email: $email,
      phone: $phone,
      dateOfBirth: $dateOfBirth,
      age: $age,
      gender: $gender,
      address: $address,
      bloodGroup: $bloodGroup,
      status: $status,
      emergencyContact: $emergencyContact,
      medicalHistory: $medicalHistory,
      vitalSigns: $vitalSigns,
      dentalHistory: $dentalHistory,
      insurance: $insurance,
      password: $password
    ) {
      id
      userId
      name
      email
      phone
    }
  }
`;

export const DELETE_PATIENT = gql`
  mutation DeletePatient($id: ID!) {
    deletePatient(id: $id)
  }
`;

export const GENERATE_PATIENT_LOGIN = gql`
  mutation GeneratePatientLogin($patientId: ID!) {
    generatePatientLogin(patientId: $patientId) {
      patientId
      patientName
      phone
      password
      userId
      newlyCreated
    }
  }
`;

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice(
    $id: ID!
    $invoiceNumber: String
    $patientId: ID
    $patientName: String
    $date: String
    $dueDate: String
    $items: [InvoiceItemInput]
    $subtotal: Float
    $tax: Float
    $discount: Float
    $total: Float
    $balance: Float
    $amountPaid: Float
    $status: String
    $paymentMethod: String
    $paymentDate: String
    $notes: String
  ) {
    updateInvoice(
      id: $id
      invoiceNumber: $invoiceNumber
      patientId: $patientId
      patientName: $patientName
      date: $date
      dueDate: $dueDate
      items: $items
      subtotal: $subtotal
      tax: $tax
      discount: $discount
      total: $total
      balance: $balance
      amountPaid: $amountPaid
      status: $status
      paymentMethod: $paymentMethod
      paymentDate: $paymentDate
      notes: $notes
    ) {
      id
      invoiceNumber
      patientId
      patientName
      date
      dueDate
      items {
        description
        quantity
        unitPrice
        total
      }
      subtotal
      tax
      discount
      total
      amountPaid
      balance
      status
      paymentMethod
      paymentDate
      notes
    }
  }
`;

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id)
  }
`;
