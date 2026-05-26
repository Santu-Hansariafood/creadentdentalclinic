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
    $category: String!,
    $manufacturer: String!,
    $dosage: String!,
    $price: Float!,
    $stock: Int!,
    $expiryDate: String!,
    $description: String
  ) {
    registerMedicine(
      name: $name,
      category: $category,
      manufacturer: $manufacturer,
      dosage: $dosage,
      price: $price,
      stock: $stock,
      expiryDate: $expiryDate,
      description: $description
    ) {
      id
      name
      stock
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
