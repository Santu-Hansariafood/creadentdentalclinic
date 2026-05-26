import { gql } from '@apollo/client';

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
