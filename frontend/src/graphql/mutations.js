import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const CREATE_PATIENT = gql`
  mutation CreatePatient(
    $name: String!,
    $email: String!,
    $phone: String!,
    $dateOfBirth: String!,
    $gender: String!,
    $address: String,
    $bloodGroup: String
  ) {
    createPatient(
      name: $name,
      email: $email,
      phone: $phone,
      dateOfBirth: $dateOfBirth,
      gender: $gender,
      address: $address,
      bloodGroup: $bloodGroup
    ) {
      id
      name
    }
  }
`;

export const REGISTER = gql`
  mutation Register(
    $name: String!,
    $email: String!,
    $password: String!,
    $role: String!,
    $phone: String,
    $specialization: String,
    $license: String
  ) {
    register(
      name: $name,
      email: $email,
      password: $password,
      role: $role,
      phone: $phone,
      specialization: $specialization,
      license: $license
    ) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const REGISTER_MEDICINE = gql`
  mutation RegisterMedicine(
    $name: String!,
    $category: String!
  ) {
    registerMedicine(
      name: $name,
      category: $category
    ) {
      id
      name
    }
  }
`;

export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment(
    $patientId: ID!,
    $patientName: String!,
    $doctorId: ID!,
    $doctorName: String!,
    $date: String!,
    $time: String!,
    $type: String!,
    $reason: String
  ) {
    createAppointment(
      patientId: $patientId,
      patientName: $patientName,
      doctorId: $doctorId,
      doctorName: $doctorName,
      date: $date,
      time: $time,
      type: $type,
      reason: $reason
    ) {
      id
      status
    }
  }
`;

export const CREATE_PRESCRIPTION = gql`
  mutation CreatePrescription(
    $patientId: ID!,
    $patientName: String!,
    $doctorId: ID!,
    $doctorName: String!,
    $diagnosis: String,
    $medications: [MedicationInput],
    $notes: String
  ) {
    createPrescription(
      patientId: $patientId,
      patientName: $patientName,
      doctorId: $doctorId,
      doctorName: $doctorName,
      diagnosis: $diagnosis,
      medications: $medications,
      notes: $notes
    ) {
      id
      status
    }
  }
`;

export const CREATE_MEDICAL_RECORD = gql`
  mutation CreateMedicalRecord(
    $patientId: ID!,
    $patientName: String!,
    $doctorId: ID!,
    $doctorName: String!,
    $date: String!,
    $diagnosis: String,
    $treatment: String,
    $prescriptions: [String]
  ) {
    createMedicalRecord(
      patientId: $patientId,
      patientName: $patientName,
      doctorId: $doctorId,
      doctorName: $doctorName,
      date: $date,
      diagnosis: $diagnosis,
      treatment: $treatment,
      prescriptions: $prescriptions
    ) {
      id
    }
  }
`;

export const CREATE_INVOICE = gql`
  mutation CreateInvoice(
    $invoiceNumber: String!,
    $patientId: ID!,
    $patientName: String!,
    $date: String!,
    $subtotal: Float!,
    $total: Float!,
    $balance: Float!
  ) {
    createInvoice(
      invoiceNumber: $invoiceNumber,
      patientId: $patientId,
      patientName: $patientName,
      date: $date,
      subtotal: $subtotal,
      total: $total,
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
