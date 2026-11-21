import { z } from 'zod'

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
      .optional()
      .or(z.literal('')),
    role: z.enum(['customer', 'professional']),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

// ─── Profile Schemas ──────────────────────────────────────────────────────────

export const profileSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
})

export const professionalProfileSchema = z.object({
  bio: z.string().max(1000, 'Bio must be under 1000 characters').optional().or(z.literal('')),
  experience_years: z
    .number()
    .int()
    .min(0, 'Cannot be negative')
    .max(60, 'Enter a realistic value'),
  service_area: z.string().max(200).optional().or(z.literal('')),
  availability_status: z.enum(['available', 'busy', 'offline']),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
})

// ─── Service Request Schemas ──────────────────────────────────────────────────

export const serviceRequestSchema = z.object({
  category_id: z.string().uuid('Please select a service category'),
  description: z
    .string()
    .min(20, 'Please describe the work needed (at least 20 characters)')
    .max(2000, 'Description is too long'),
  preferred_date: z.string().optional().nullable(),
})

// ─── Review Schemas ───────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Please select a rating').max(5),
  comment: z.string().max(1000).optional().or(z.literal('')),
})

// ─── Admin Schemas ────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  icon: z.string().max(50).optional().or(z.literal('')),
  is_active: z.boolean(),
})

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ProfileFormValues = z.infer<typeof profileSchema>
export type ProfessionalProfileFormValues = z.infer<typeof professionalProfileSchema>
export type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>
export type ReviewFormValues = z.infer<typeof reviewSchema>
export type CategoryFormValues = z.infer<typeof categorySchema>
