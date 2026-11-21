// ─────────────────────────────────────────────────────────────────────────────
// Auto-generated Database types for Supabase.
// Run `npx supabase gen types typescript --local` after running migrations to
// regenerate this file from your actual schema.
// ─────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'customer' | 'professional' | 'admin'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type AvailabilityStatus = 'available' | 'busy' | 'offline'
export type RequestStatus =
  | 'open'
  | 'accepted'
  | 'in_progress'
  | 'pending_confirmation'
  | 'completed'
  | 'reviewed'
  | 'rejected'
  | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      professional_profiles: {
        Row: ProfessionalProfile
        Insert: Omit<ProfessionalProfile, 'id' | 'created_at' | 'updated_at' | 'average_rating' | 'review_count'>
        Update: Partial<Omit<ProfessionalProfile, 'id' | 'user_id' | 'created_at'>>
      }
      service_categories: {
        Row: ServiceCategory
        Insert: Omit<ServiceCategory, 'id' | 'created_at'>
        Update: Partial<Omit<ServiceCategory, 'id' | 'created_at'>>
      }
      professional_services: {
        Row: ProfessionalService
        Insert: Omit<ProfessionalService, 'id'>
        Update: Partial<Omit<ProfessionalService, 'id' | 'professional_id'>>
      }
      service_requests: {
        Row: ServiceRequest
        Insert: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<ServiceRequest>
      }
      request_status_history: {
        Row: RequestStatusHistory
        Insert: Omit<RequestStatusHistory, 'id' | 'created_at'>
        Update: never
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at'>
        Update: never
      }
      professional_documents: {
        Row: ProfessionalDocument
        Insert: Omit<ProfessionalDocument, 'id' | 'uploaded_at'>
        Update: Partial<Pick<ProfessionalDocument, 'verification_status'>>
      }
      admin_actions: {
        Row: AdminAction
        Insert: Omit<AdminAction, 'id' | 'created_at'>
        Update: never
      }
    }
    Functions: {
      submit_service_request: {
        Args: {
          p_professional_id: string
          p_category_id: string
          p_description: string
          p_preferred_date: string | null
        }
        Returns: { request_id: string }
      }
      update_request_status: {
        Args: {
          p_request_id: string
          p_new_status: RequestStatus
        }
        Returns: { success: boolean; message: string }
      }
      submit_review: {
        Args: {
          p_request_id: string
          p_rating: number
          p_comment: string
        }
        Returns: { success: boolean }
      }
      verify_professional: {
        Args: {
          p_professional_id: string
          p_status: VerificationStatus
          p_reason: string | null
        }
        Returns: { success: boolean }
      }
      get_professionals_nearby: {
        Args: {
          p_lat: number
          p_lng: number
          p_radius_km: number
          p_category_id: string | null
          p_min_rating: number | null
          p_available_only: boolean
        }
        Returns: ProfessionalSearchResult[]
      }
    }
  }
}

// ─── Row Types ───────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  avatar_path: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface ProfessionalProfile {
  id: string
  user_id: string
  bio: string | null
  experience_years: number
  verification_status: VerificationStatus
  availability_status: AvailabilityStatus
  service_area: string | null
  latitude: number | null
  longitude: number | null
  average_rating: number
  review_count: number
  created_at: string
  updated_at: string
}

export interface ServiceCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
  created_at: string
}

export interface ProfessionalService {
  id: string
  professional_id: string
  category_id: string
  description: string | null
  starting_price: number | null
  is_active: boolean
}

export interface ServiceRequest {
  id: string
  customer_id: string
  professional_id: string
  category_id: string
  description: string
  preferred_date: string | null
  status: RequestStatus
  created_at: string
  updated_at: string
}

export interface RequestStatusHistory {
  id: string
  request_id: string
  changed_by: string
  old_status: RequestStatus | null
  new_status: RequestStatus
  created_at: string
}

export interface Review {
  id: string
  request_id: string
  customer_id: string
  professional_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface ProfessionalDocument {
  id: string
  professional_id: string
  storage_path: string
  document_type: string
  verification_status: VerificationStatus
  uploaded_at: string
}

export interface AdminAction {
  id: string
  admin_id: string
  target_user_id: string | null
  action: string
  reason: string | null
  created_at: string
}

// ─── Composite / Join Types ───────────────────────────────────────────────────

export interface ProfessionalSearchResult {
  user_id: string
  full_name: string
  avatar_path: string | null
  bio: string | null
  experience_years: number
  verification_status: VerificationStatus
  availability_status: AvailabilityStatus
  average_rating: number
  review_count: number
  service_area: string | null
  latitude: number | null
  longitude: number | null
  distance_km: number | null
  categories: string[]
  starting_price: number | null
}

export interface ProfessionalWithProfile {
  profiles: Profile
  professional_profiles: ProfessionalProfile
  professional_services: (ProfessionalService & { service_categories: ServiceCategory })[]
  reviews: Review[]
}

export interface ServiceRequestWithDetails extends ServiceRequest {
  customer?: Profile
  professional?: Profile
  professional_profile?: ProfessionalProfile
  category?: ServiceCategory
  status_history?: RequestStatusHistory[]
  review?: Review
}
