import { z } from 'zod';

// Auth validations
export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Order validations
export const createOrderSchema = z.object({
  groupLink: z.string()
    .url('Invalid source group link')
    .refine((url) => url.includes('t.me/') || url.includes('telegram.me/'), {
      message: 'Must be a valid Telegram source group link',
    }),
  targetGroupLink: z.string()
    .url('Invalid target group link')
    .refine((url) => url.includes('t.me/') || url.includes('telegram.me/'), {
      message: 'Must be a valid Telegram target group link',
    }),
  targetCount: z.number()
    .min(10, 'Minimum 10 members required')
    .max(100000, 'Maximum 100,000 members allowed'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  paymentMethod: z.string().optional(),
  paymentProofUrl: z.string().optional(),
}).refine((data) => data.groupLink !== data.targetGroupLink, {
  message: 'Source and target groups must be different',
  path: ['targetGroupLink'],
});

export const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED', 'PAUSED']),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  currentCount: z.number().min(0).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

// User profile validations
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  language: z.enum(['en', 'ar']).default('ar'),
  theme: z.enum(['light', 'dark', 'system']).default('dark'),
});

// API Key validations
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  expiresAt: z.date().optional(),
});

// Notification validations
export const createNotificationSchema = z.object({
  userId: z.string(),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  message: z.string().min(1, 'Message is required').max(500, 'Message must be less than 500 characters'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM']).default('INFO'),
  actionUrl: z.string().url().optional(),
});

// System settings validations
export const updateSettingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Filter schemas
export const orderFilterSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED', 'PAUSED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  userId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export const userFilterSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN']).optional(),
  subscription: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
  isActive: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});
