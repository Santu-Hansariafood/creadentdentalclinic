import { z } from 'zod';

export const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  role: z.string().min(1, 'Role is required'),
  specialization: z.string().optional(),
  license: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const patientRegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  address: z.string().min(1, 'Address is required'),
  bloodGroup: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional().refine((val) => !val || /^\d{10}$/.test(val), {
    message: 'Emergency contact phone must be 10 digits',
  }),
  emergencyContactRelation: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  medications: z.string().optional(),
  previousSurgeries: z.string().optional(),
  familyHistory: z.string().optional(),
  bloodPressure: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  lastVisit: z.string().optional(),
  previousTreatments: z.string().optional(),
  currentIssues: z.string().optional(),
  insuranceProvider: z.string().optional(),
  policyNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});
