import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN';
          credits: number;
          subscription: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
          created_at: string;
          updated_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          role?: 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN';
          credits?: number;
          subscription?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN';
          credits?: number;
          subscription?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          group_link: string;
          target_count: number;
          current_count: number;
          status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'PAUSED';
          priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
          notes: string | null;
          price: number;
          currency: string;
          payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_link: string;
          target_count: number;
          current_count?: number;
          status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'PAUSED';
          priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
          notes?: string | null;
          price?: number;
          currency?: string;
          payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_link?: string;
          target_count?: number;
          current_count?: number;
          status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'PAUSED';
          priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
          notes?: string | null;
          price?: number;
          currency?: string;
          payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
    };
  };
};