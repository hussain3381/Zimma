export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string | null
          booking_date: string
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          price: number
          provider_id: string
          service_type: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          booking_date: string
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          price?: number
          provider_id: string
          service_type: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          booking_date?: string
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          price?: number
          provider_id?: string
          service_type?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          area: string
          availability: string
          avatar_url: string | null
          bio: string
          cnic: string | null
          created_at: string
          email: string | null
          experience: number
          hourly_rate: number
          id: string
          is_online: boolean
          name: string
          phone: string | null
          profession: string
          rating: number
          reviews_count: number
          skills: string[]
          status: Database["public"]["Enums"]["provider_status"]
          total_jobs: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          area?: string
          availability?: string
          avatar_url?: string | null
          bio?: string
          cnic?: string | null
          created_at?: string
          email?: string | null
          experience?: number
          hourly_rate?: number
          id: string
          is_online?: boolean
          name: string
          phone?: string | null
          profession?: string
          rating?: number
          reviews_count?: number
          skills?: string[]
          status?: Database["public"]["Enums"]["provider_status"]
          total_jobs?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          area?: string
          availability?: string
          avatar_url?: string | null
          bio?: string
          cnic?: string | null
          created_at?: string
          email?: string | null
          experience?: number
          hourly_rate?: number
          id?: string
          is_online?: boolean
          name?: string
          phone?: string | null
          profession?: string
          rating?: number
          reviews_count?: number
          skills?: string[]
          status?: Database["public"]["Enums"]["provider_status"]
          total_jobs?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          provider_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          provider_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          provider_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      grant_provider_role: { Args: { _user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "provider" | "customer"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "rejected"
      provider_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}