// Generated from the live Supabase project (uwzttixqpwqmuuguchyw) via
// `supabase gen types typescript`. Regenerate after every schema change —
// do not hand-edit.

export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: number;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
          metadata?: Json;
        };
        Relationships: [];
      };
      automation_runs: {
        Row: {
          created_at: string;
          error: string | null;
          id: number;
          payload: Json;
          related_entity_id: string | null;
          related_entity_type: string | null;
          status: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: never;
          payload?: Json;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          status: string;
          type: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: never;
          payload?: Json;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          status?: string;
          type?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          budget_band: string | null;
          company: string | null;
          created_at: string;
          email: string;
          id: string;
          message: string | null;
          metadata: Json;
          name: string;
          phone: string | null;
          region: string | null;
          score: number;
          service_interest: string | null;
          source: string;
          status: Database["public"]["Enums"]["lead_status"];
          tier: Database["public"]["Enums"]["lead_tier"];
          timeline_urgency: string | null;
        };
        Insert: {
          budget_band?: string | null;
          company?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          message?: string | null;
          metadata?: Json;
          name: string;
          phone?: string | null;
          region?: string | null;
          score?: number;
          service_interest?: string | null;
          source: string;
          status?: Database["public"]["Enums"]["lead_status"];
          tier?: Database["public"]["Enums"]["lead_tier"];
          timeline_urgency?: string | null;
        };
        Update: {
          budget_band?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string | null;
          metadata?: Json;
          name?: string;
          phone?: string | null;
          region?: string | null;
          score?: number;
          service_interest?: string | null;
          source?: string;
          status?: Database["public"]["Enums"]["lead_status"];
          tier?: Database["public"]["Enums"]["lead_tier"];
          timeline_urgency?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          granted_at: string;
          granted_by: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          granted_at?: string;
          granted_by?: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          granted_at?: string;
          granted_by?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role:
        | "super_admin"
        | "director"
        | "finance"
        | "marketing"
        | "sales"
        | "quality"
        | "freelancer"
        | "client";
      lead_status: "new" | "contacted" | "qualified" | "disqualified";
      lead_tier: "hot" | "warm" | "cold";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
