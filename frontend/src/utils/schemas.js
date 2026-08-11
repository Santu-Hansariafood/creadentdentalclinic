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
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "Invalid email format",
      }),
    phone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    dateOfBirth: z.string().trim().optional().or(z.literal("")),
    age: z
      .union([z.string().trim(), z.number()])
      .optional()
      .transform((val) => {
        if (val === "" || val === undefined || val === null) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      }),
    gender: z.string().trim().min(1, "Gender is required"),
    address: z.string().trim().optional().or(z.literal("")),
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
    bloodGroup: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) =>
          !val ||
          ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].includes(
            val,
          ),
        {
          message: "Invalid blood group",
        },
      ),
    emergencyContactName: z.string().trim().optional().or(z.literal("")),
    emergencyContactPhone: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || /^\d{10}$/.test(val), {
        message: "Emergency contact phone must be 10 digits",
      }),
    emergencyContactRelation: z.string().trim().optional().or(z.literal("")),
    allergies: z.string().trim().optional().or(z.literal("")),
    chronicConditions: z.string().trim().optional().or(z.literal("")),
    medications: z.string().trim().optional().or(z.literal("")),
    previousSurgeries: z.string().trim().optional().or(z.literal("")),
    familyHistory: z.string().trim().optional().or(z.literal("")),
    bloodPressure: z.string().trim().optional().or(z.literal("")),
    height: z.string().trim().optional().or(z.literal("")),
    weight: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.dateOfBirth || data.age, {
    message: "Either Date of Birth or Age is required",
    path: ["dateOfBirth"],
  })
  .refine(
    (data) => {
      if (data.age !== undefined) {
        return data.age >= 0 && data.age <= 150;
      }
      return true;
    },
    {
      message: "Age must be between 0 and 150",
      path: ["age"],
    },
  )
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
