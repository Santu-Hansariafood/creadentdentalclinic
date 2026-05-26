import { gql } from '@apollo/client';

export const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
      role
    }
  }
`;

export const GET_USERS_BY_ROLE = gql`
  query GetUsersByRole($role: String!) {
    getUsersByRole(role: $role) {
      id
      name
      specialization
    }
  }
`;

export const GET_MEDICINES = gql`
  query GetMedicines($page: Int, $limit: Int) {
    getMedicines(page: $page, limit: $limit) {
      medicines {
        id
        name
        category
      }
      totalCount
      totalPages
      currentPage
    }
  }
`;

export const GET_APPOINTMENTS = gql`
  query GetAppointments($page: Int, $limit: Int) {
    getAppointments(page: $page, limit: $limit) {
      appointments {
        id
        patientName
        doctorName
        date
        time
        type
        status
      }
      totalCount
      totalPages
      currentPage
    }
  }
`;

export const GET_MEDICAL_RECORDS = gql`
  query GetMedicalRecords {
    getMedicalRecords {
      id
      patientName
      doctorName
      date
      visitType
      diagnosis
      treatment
    }
  }
`;

export const GET_INVOICES = gql`
  query GetInvoices {
    getInvoices {
      id
      invoiceNumber
      patientName
      date
      total
      status
      balance
    }
  }
`;

export const GET_PRESCRIPTIONS = gql`
  query GetPrescriptions {
    getPrescriptions {
      id
      patientName
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

export const GET_PAYMENT_LEDGERS = gql`
  query GetPaymentLedgers($page: Int, $limit: Int) {
    getPaymentLedgers(page: $page, limit: $limit) {
      paymentLedgers {
        id
        slNo
        lorryNo
        paymentDate
        paymentAmount
        dueAmount
        status
        remarks
      }
      totalCount
      totalPages
      currentPage
    }
  }
`;

export const GET_PATIENTS = gql`
  query GetPatients($page: Int, $limit: Int) {
    getPatients(page: $page, limit: $limit) {
      patients {
        id
        name
        email
        phone
        status
      }
      totalCount
      totalPages
      currentPage
    }
  }
`;
