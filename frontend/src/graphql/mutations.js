import { gql } from '@apollo/client';

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
