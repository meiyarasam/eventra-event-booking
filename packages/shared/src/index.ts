import { z } from 'zod';

// ==========================================
// CONSTANTS & ENUMS
// ==========================================

export enum UserRole {
  ATTENDEE = 'ATTENDEE',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum OrganizerRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum TicketStatus {
  VALID = 'VALID',
  CHECKED_IN = 'CHECKED_IN',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const VerifyEmailSchema = z.object({
  tokenOrOtp: z.string().min(1, 'Verification token or OTP is required'),
  email: z.string().email().optional(),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;

export const ApplyCouponSchema = z.object({
  code: z.string().min(2, 'Coupon code is required').toUpperCase(),
  subtotal: z.number().min(0),
});
export type ApplyCouponInput = z.infer<typeof ApplyCouponSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const OrganizerRequestSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required').max(150),
  reason: z.string().min(10, 'Please explain your reason and events you plan to host').max(1000),
  websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
});
export type OrganizerRequestInput = z.infer<typeof OrganizerRequestSchema>;

// Ticket Type Schema
export const TicketTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Ticket type name is required').max(100),
  description: z.string().max(300).optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  totalQuantity: z.number().int().min(1, 'Quantity must be at least 1'),
  maxPerUser: z.number().int().min(1).max(20).default(5),
  saleStartDate: z.string().or(z.date()).optional(),
  saleEndDate: z.string().or(z.date()).optional(),
});
export type TicketTypeInput = z.infer<typeof TicketTypeSchema>;

// Create/Update Event Schema
export const EventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  bannerUrl: z.string().min(1, 'Banner URL is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  timeZone: z.string().default('UTC'),
  isOnline: z.boolean().default(false),
  venueName: z.string().max(200).optional().nullable(),
  venueAddress: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  capacity: z.number().int().min(1, 'Event capacity must be at least 1'),
  cancellationPolicy: z.string().max(1000).default('Free cancellation up to 48 hours before the event start time.'),
  ticketTypes: z.array(TicketTypeSchema).min(1, 'At least one ticket type is required'),
});
export type EventInput = z.infer<typeof EventSchema>;

// Reservation & Booking Schemas
export const ReservationItemSchema = z.object({
  ticketTypeId: z.string().min(1, 'Ticket type is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Max 10 tickets per item'),
});

export const CreateReservationSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  items: z.array(ReservationItemSchema).min(1, 'Must select at least one ticket'),
});
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

export const ProcessPaymentSchema = z.object({
  reservationId: z.string().min(1, 'Reservation ID is required'),
  paymentMethod: z.enum(['CARD', 'UPI']),
  simulateSuccess: z.boolean().default(true),
  paymentDetails: z
    .object({
      cardLast4: z.string().length(4).optional(),
      cardHolder: z.string().optional(),
      upiId: z.string().optional(),
    })
    .optional(),
});
export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;

// Check-In Schemas
export const CheckInSchema = z.object({
  ticketToken: z.string().min(1, 'Ticket token or reference is required'),
});
export type CheckInInput = z.infer<typeof CheckInSchema>;

// Admin Schemas
export const AdminReviewEventSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
});
export type AdminReviewEventInput = z.infer<typeof AdminReviewEventSchema>;

export const AdminReviewOrganizerSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
});
export type AdminReviewOrganizerInput = z.infer<typeof AdminReviewOrganizerSchema>;

export const AdminUpdateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().optional(),
});
export type AdminUpdateUserStatusInput = z.infer<typeof AdminUpdateUserStatusSchema>;

// ==========================================
// DTO & RESPONSE TYPES
// ==========================================

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  emailVerified?: boolean;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  message?: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  _count?: {
    events: number;
  };
}

export interface TicketTypeDTO {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  price: number;
  totalQuantity: number;
  soldQuantity: number;
  availableQuantity: number;
  maxPerUser: number;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
}

export interface EventDTO {
  id: string;
  organizerId: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  isOnline: boolean;
  venueName?: string | null;
  venueAddress?: string | null;
  city?: string | null;
  capacity: number;
  cancellationPolicy: string;
  status: EventStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  organizer?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    bio?: string | null;
    organizationName?: string | null;
    websiteUrl?: string | null;
  };
  category?: CategoryDTO;
  ticketTypes?: TicketTypeDTO[];
  _count?: {
    bookings?: number;
    tickets?: number;
  };
}

export interface ReservationDTO {
  id: string;
  eventId: string;
  userId: string;
  expiresAt: string;
  status: string;
  items: {
    ticketTypeId: string;
    ticketTypeName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  totalAmount: number;
}

export interface TicketDTO {
  id: string;
  ticketNumber: string;
  ticketToken: string;
  bookingId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  status: TicketStatus;
  attendeeName: string;
  attendeeEmail: string;
  eventName: string;
  eventBannerUrl: string;
  eventStartDate: string;
  venueName?: string | null;
  city?: string | null;
  isOnline: boolean;
  seatNumber?: string | null;
  qrCodeUrl?: string;
  checkedInAt?: string | null;
  createdAt: string;
}

export interface BookingDTO {
  id: string;
  bookingReference: string;
  userId: string;
  eventId: string;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  cancelledAt?: string | null;
  event?: EventDTO;
  tickets?: TicketDTO[];
  payment?: {
    id: string;
    paymentMethod: string;
    status: PaymentStatus;
    transactionReference: string;
    createdAt: string;
  } | null;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
