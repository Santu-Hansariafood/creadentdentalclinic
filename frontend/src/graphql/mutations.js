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
    $email: String!
    $phone: String!
    $dateOfBirth: String!
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
  ) {
    createPatient(
      name: $name
      email: $email
      phone: $phone
      dateOfBirth: $dateOfBirth
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
    $email: String!
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
  ) {
    registerMedicine(
      name: $name
      category: $category
      description: $description
    ) {
      id
      name
      category
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
      status
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
    $diagnosis: String
    $treatment: String
    $prescriptions: [String]
  ) {
    createMedicalRecord(
      patientId: $patientId
      patientName: $patientName
      doctorId: $doctorId
      doctorName: $doctorName
      date: $date
      diagnosis: $diagnosis
      treatment: $treatment
      prescriptions: $prescriptions
    ) {
      id
    }
  }
`;

export const CREATE_INVOICE = gql`
  mutation CreateInvoice(
    $invoiceNumber: String!
    $patientId: ID!
    $patientName: String!
    $date: String!
    $subtotal: Float!
    $total: Float!
    $balance: Float!
  ) {
    createInvoice(
      invoiceNumber: $invoiceNumber
      patientId: $patientId
      patientName: $patientName
      date: $date
      subtotal: $subtotal
      total: $total
      balance: $balance
    ) {
      id
      status
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

export const UPDATE_PATIENT = gql`
  mutation UpdatePatient(
    $id: ID!,
    $name: String,
    $email: String,
    $phone: String,
    $dateOfBirth: String,
    $gender: String,
    $address: String,
    $bloodGroup: String,
    $status: String,
    $emergencyContact: EmergencyContactInput,
    $medicalHistory: MedicalHistoryInput,
    $vitalSigns: VitalSignsInput,
    $dentalHistory: DentalHistoryInput,
    $insurance: InsuranceInput
  ) {
    updatePatient(
      id: $id,
      name: $name,
      email: $email,
      phone: $phone,
      dateOfBirth: $dateOfBirth,
      gender: $gender,
      address: $address,
      bloodGroup: $bloodGroup,
      status: $status,
      emergencyContact: $emergencyContact,
      medicalHistory: $medicalHistory,
      vitalSigns: $vitalSigns,
      dentalHistory: $dentalHistory,
      insurance: $insurance
    ) {
      id
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
