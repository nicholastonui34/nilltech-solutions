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
      clients: {
        Row: {
          address: string | null;
          company: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          company?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          user_id?: string | null;
        };
        Update: {
          address?: string | null;
          company?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      document_sequences: {
        Row: {
          doc_type: string;
          last_number: number;
          year: number;
        };
        Insert: {
          doc_type: string;
          last_number: number;
          year: number;
        };
        Update: {
          doc_type?: string;
          last_number?: number;
          year?: number;
        };
        Relationships: [];
      };
      finance_settings: {
        Row: {
          address_lines: string[];
          bank_account_currency: Database["public"]["Enums"]["currency_code"] | null;
          bank_account_name: string | null;
          bank_account_number: string | null;
          bank_branch: string | null;
          bank_name: string | null;
          bank_swift: string | null;
          default_payment_terms_days: number;
          email: string | null;
          id: boolean;
          invoice_footer: string | null;
          kra_pin: string | null;
          legal_name: string;
          mpesa_account: string | null;
          mpesa_paybill: string | null;
          phone: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          address_lines?: string[];
          bank_account_currency?: Database["public"]["Enums"]["currency_code"] | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_branch?: string | null;
          bank_name?: string | null;
          bank_swift?: string | null;
          default_payment_terms_days?: number;
          email?: string | null;
          id?: boolean;
          invoice_footer?: string | null;
          kra_pin?: string | null;
          legal_name: string;
          mpesa_account?: string | null;
          mpesa_paybill?: string | null;
          phone?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address_lines?: string[];
          bank_account_currency?: Database["public"]["Enums"]["currency_code"] | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_branch?: string | null;
          bank_name?: string | null;
          bank_swift?: string | null;
          default_payment_terms_days?: number;
          email?: string | null;
          id?: boolean;
          invoice_footer?: string | null;
          kra_pin?: string | null;
          legal_name?: string;
          mpesa_account?: string | null;
          mpesa_paybill?: string | null;
          phone?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          description: string;
          id: string;
          invoice_id: string;
          line_total_minor: number | null;
          position: number;
          quantity: number;
          unit_price_minor: number;
        };
        Insert: {
          description: string;
          id?: string;
          invoice_id: string;
          line_total_minor?: number | null;
          position?: number;
          quantity: number;
          unit_price_minor: number;
        };
        Update: {
          description?: string;
          id?: string;
          invoice_id?: string;
          line_total_minor?: number | null;
          position?: number;
          quantity?: number;
          unit_price_minor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          client_id: string;
          client_snapshot: Json | null;
          created_at: string;
          created_by: string | null;
          currency: Database["public"]["Enums"]["currency_code"];
          due_date: string | null;
          etims_reference: string | null;
          etims_status: string;
          id: string;
          issue_date: string | null;
          issued_at: string | null;
          issued_by: string | null;
          notes: string | null;
          number: string | null;
          paid_minor: number;
          seller_snapshot: Json | null;
          status: Database["public"]["Enums"]["invoice_status"];
          total_minor: number;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          client_id: string;
          client_snapshot?: Json | null;
          created_at?: string;
          created_by?: string | null;
          currency: Database["public"]["Enums"]["currency_code"];
          due_date?: string | null;
          etims_reference?: string | null;
          etims_status?: string;
          id?: string;
          issue_date?: string | null;
          issued_at?: string | null;
          issued_by?: string | null;
          notes?: string | null;
          number?: string | null;
          paid_minor?: number;
          seller_snapshot?: Json | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          total_minor?: number;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          client_id?: string;
          client_snapshot?: Json | null;
          created_at?: string;
          created_by?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          due_date?: string | null;
          etims_reference?: string | null;
          etims_status?: string;
          id?: string;
          issue_date?: string | null;
          issued_at?: string | null;
          issued_by?: string | null;
          notes?: string | null;
          number?: string | null;
          paid_minor?: number;
          seller_snapshot?: Json | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          total_minor?: number;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
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
      payments: {
        Row: {
          amount_minor: number;
          currency: Database["public"]["Enums"]["currency_code"];
          id: string;
          invoice_id: string;
          method: Database["public"]["Enums"]["payment_method"];
          notes: string | null;
          paid_on: string;
          receipt_number: string;
          recorded_at: string;
          recorded_by: string | null;
          reference: string | null;
        };
        Insert: {
          amount_minor: number;
          currency: Database["public"]["Enums"]["currency_code"];
          id?: string;
          invoice_id: string;
          method: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          paid_on: string;
          receipt_number: string;
          recorded_at?: string;
          recorded_by?: string | null;
          reference?: string | null;
        };
        Update: {
          amount_minor?: number;
          currency?: Database["public"]["Enums"]["currency_code"];
          id?: string;
          invoice_id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          paid_on?: string;
          receipt_number?: string;
          recorded_at?: string;
          recorded_by?: string | null;
          reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
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
      admin_database_size_bytes: { Args: never; Returns: number };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      issue_invoice: {
        Args: { _due_date: string; _invoice_id: string };
        Returns: string;
      };
      is_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][];
          _user_id: string;
        };
        Returns: boolean;
      };
      nairobi_today: { Args: never; Returns: string };
      next_document_number: { Args: { _doc_type: string }; Returns: string };
      record_payment: {
        Args: {
          _amount_minor: number;
          _invoice_id: string;
          _method: Database["public"]["Enums"]["payment_method"];
          _notes: string;
          _paid_on: string;
          _reference: string;
        };
        Returns: string;
      };
      void_invoice: {
        Args: { _invoice_id: string; _reason: string };
        Returns: undefined;
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
      currency_code: "KES" | "USD";
      invoice_status: "draft" | "issued" | "partially_paid" | "paid" | "void";
      lead_status: "new" | "contacted" | "qualified" | "disqualified";
      lead_tier: "hot" | "warm" | "cold";
      payment_method: "mpesa" | "bank_transfer" | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
