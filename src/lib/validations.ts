import { z } from 'zod';

// ============================================
// Authentication Schemas
// ============================================

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================
// Project Schemas
// ============================================

export const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  status: z.string().default('Active'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateProjectSchema = projectSchema.partial();

// ============================================
// Parcel Schemas
// ============================================

export const parcelSchema = z.object({
  projectId: z.string().cuid(),
  parcelNumber: z.string().optional(),
  pin: z.string().optional(),
  owner: z.string().optional(),
  ownerAddress: z.string().optional(),
  ownerCity: z.string().optional(),
  ownerState: z.string().optional(),
  ownerZip: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  legalDesc: z.string().optional(),
  county: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACQUIRED', 'CONDEMNED', 'RELOCATED']).default('NOT_STARTED'),
  sequence: z.number().int().positive().optional(),
  milepost: z.number().positive().optional(),
  geometry: z.any().optional(), // GeoJSON
  acreage: z.number().positive().optional(),
});

export const updateParcelSchema = parcelSchema.partial().omit({ projectId: true });

export const bulkUpdateParcelStatusSchema = z.object({
  parcelIds: z.array(z.string().cuid()),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACQUIRED', 'CONDEMNED', 'RELOCATED']),
});

// ============================================
// Note Schemas
// ============================================

export const noteSchema = z.object({
  parcelId: z.string().cuid(),
  content: z.string().min(1, 'Note content is required'),
  category: z.string().optional(),
});

export const updateNoteSchema = noteSchema.partial().omit({ parcelId: true });

// ============================================
// Document Schemas
// ============================================

export const documentSchema = z.object({
  parcelId: z.string().cuid(),
  name: z.string().min(1, 'Document name is required'),
  type: z.string(),
  url: z.string().url(),
  size: z.number().int().positive(),
  mimeType: z.string(),
});

// ============================================
// Export Schemas
// ============================================

export const exportSchema = z.object({
  projectId: z.string().cuid(),
  format: z.enum(['csv', 'pdf']),
  sortBy: z.enum(['sequence', 'milepost', 'status', 'county']).optional(),
  filterStatus: z.array(z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACQUIRED', 'CONDEMNED', 'RELOCATED'])).optional(),
  filterCounty: z.array(z.string()).optional(),
});

// ============================================
// Import Schemas
// ============================================

export const importParcelSchema = z.object({
  projectId: z.string().cuid(),
  file: z.any(), // File upload
  format: z.enum(['kmz', 'kml', 'geojson', 'csv']),
});

// ============================================
// Type Exports
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type ProjectInput = z.infer<typeof projectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export type ParcelInput = z.infer<typeof parcelSchema>;
export type UpdateParcelInput = z.infer<typeof updateParcelSchema>;
export type BulkUpdateParcelStatusInput = z.infer<typeof bulkUpdateParcelStatusSchema>;

export type NoteInput = z.infer<typeof noteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export type DocumentInput = z.infer<typeof documentSchema>;

export type ExportInput = z.infer<typeof exportSchema>;
export type ImportParcelInput = z.infer<typeof importParcelSchema>;

