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

export const GET_MEDICINES = gql`
  query GetMedicines {
    getMedicines {
      id
      name
      category
      manufacturer
      dosage
      price
      stock
      expiryDate
      description
    }
  }
`;

export const GET_PAYMENT_LEDGERS = gql`
  query GetPaymentLedgers {
    getPaymentLedgers {
      id
      slNo
      lorryNo
      paymentDate
      paymentAmount
      dueAmount
      status
      remarks
    }
  }
`;

export const GET_PATIENTS = gql`
  query GetPatients {
    getPatients {
      id
      name
      email
      phone
      status
    }
  }
`;
