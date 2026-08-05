import { z } from "zod";

export const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be 10 digits")
    .default(""),
  password: z.string().trim().min(1, "Password is required").default(""),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Invalid email"),
    phone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Phone number must be 10 digits"),
    password: z
      .string()
      .trim()
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().trim().min(6, "Confirm password is required"),
    role: z.string().trim().optional().default("patient"),
    specialization: z.string().trim().optional(),
    license: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const patientRegistrationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z
      .string()
      .trim()
      .email("Invalid email")
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Phone number must be 10 digits"),
    dateOfBirth: z.string().trim().min(1, "Date of birth is required"),
    gender: z.string().trim().min(1, "Gender is required"),
    address: z.string().trim().min(1, "Address is required"),
    password: z
      .string()
      .trim()
      .min(6, "Password must be at least 6 characters")
      .optional()
      .or(z.literal("")),
    confirmPassword: z
      .string()
      .trim()
      .min(6, "Confirm password must be at least 6 characters")
      .optional()
      .or(z.literal("")),
    bloodGroup: z.string().trim().optional(),
    emergencyContactName: z.string().trim().optional(),
    emergencyContactPhone: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || /^\d{10}$/.test(val), {
        message: "Emergency contact phone must be 10 digits",
      }),
    emergencyContactRelation: z.string().trim().optional(),
    allergies: z.string().trim().optional(),
    chronicConditions: z.string().trim().optional(),
    medications: z.string().trim().optional(),
    previousSurgeries: z.string().trim().optional(),
    familyHistory: z.string().trim().optional(),
    bloodPressure: z.string().trim().optional(),
    height: z.string().trim().optional(),
    weight: z.string().trim().optional(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
