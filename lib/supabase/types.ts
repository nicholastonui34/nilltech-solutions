// Generated from the live Supabase project (uwzttixqpwqmuuguchyw) via
// `supabase gen types typescript`. Regenerate after every schema change —
// do not hand-edit.

export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
      booking_blocks: {
        Row: {
          created_at: string;
          created_by: string | null;
          ends_at: string;
          id: string;
          reason: string | null;
          starts_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          ends_at: string;
          id?: string;
          reason?: string | null;
          starts_at: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          ends_at?: string;
          id?: string;
          reason?: string | null;
          starts_at?: string;
        };
        Relationships: [];
      };
      booking_hours: {
        Row: {
          created_at: string;
          end_time: string;
          id: string;
          start_time: string;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          id?: string;
          start_time: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          id?: string;
          start_time?: string;
          weekday?: number;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          call_type: string;
          company: string | null;
          created_at: string;
          email: string;
          ends_at: string;
          id: string;
          lead_id: string | null;
          meeting_preference: string;
          name: string;
          notes: string | null;
          phone: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["booking_status"];
          updated_at: string;
        };
        Insert: {
          call_type: string;
          company?: string | null;
          created_at?: string;
          email: string;
          ends_at: string;
          id?: string;
          lead_id?: string | null;
          meeting_preference: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          starts_at: string;
          status?: Database["public"]["Enums"]["booking_status"];
          updated_at?: string;
        };
        Update: {
          call_type?: string;
          company?: string | null;
          created_at?: string;
          email?: string;
          ends_at?: string;
          id?: string;
          lead_id?: string | null;
          meeting_preference?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_agent_presence: {
        Row: {
          last_seen_at: string;
          user_id: string;
        };
        Insert: {
          last_seen_at?: string;
          user_id: string;
        };
        Update: {
          last_seen_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      chat_ai_usage: {
        Row: {
          cache_read_tokens: number;
          cache_write_tokens: number;
          cost_usd_micros: number;
          input_tokens: number;
          month: string;
          output_tokens: number;
          requests: number;
        };
        Insert: {
          cache_read_tokens?: number;
          cache_write_tokens?: number;
          cost_usd_micros?: number;
          input_tokens?: number;
          month: string;
          output_tokens?: number;
          requests?: number;
        };
        Update: {
          cache_read_tokens?: number;
          cache_write_tokens?: number;
          cost_usd_micros?: number;
          input_tokens?: number;
          month?: string;
          output_tokens?: number;
          requests?: number;
        };
        Relationships: [];
      };
      chat_conversations: {
        Row: {
          assigned_to: string | null;
          closed_at: string | null;
          closed_by: string | null;
          created_at: string;
          id: string;
          last_message_at: string;
          lead_id: string | null;
          page_path: string | null;
          status: string;
          visitor_email: string | null;
          visitor_name: string;
          visitor_token_hash: string;
        };
        Insert: {
          assigned_to?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          id?: string;
          last_message_at?: string;
          lead_id?: string | null;
          page_path?: string | null;
          status?: string;
          visitor_email?: string | null;
          visitor_name: string;
          visitor_token_hash: string;
        };
        Update: {
          assigned_to?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          id?: string;
          last_message_at?: string;
          lead_id?: string | null;
          page_path?: string | null;
          status?: string;
          visitor_email?: string | null;
          visitor_name?: string;
          visitor_token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_conversations_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          agent_id: string | null;
          body: string;
          conversation_id: string;
          created_at: string;
          id: number;
          sender: string;
        };
        Insert: {
          agent_id?: string | null;
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: never;
          sender: string;
        };
        Update: {
          agent_id?: string | null;
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: never;
          sender?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
        ];
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
      conversion_events: {
        Row: {
          created_at: string;
          event: string;
          id: number;
          path: string;
          props: Json;
          source: string | null;
        };
        Insert: {
          created_at?: string;
          event: string;
          id?: never;
          path: string;
          props?: Json;
          source?: string | null;
        };
        Update: {
          created_at?: string;
          event?: string;
          id?: never;
          path?: string;
          props?: Json;
          source?: string | null;
        };
        Relationships: [];
      };
      credit_notes: {
        Row: {
          amount_minor: number;
          client_snapshot: Json | null;
          currency: Database["public"]["Enums"]["currency_code"];
          id: string;
          invoice_id: string;
          invoice_number: string;
          issue_date: string;
          issued_at: string;
          issued_by: string | null;
          number: string;
          reason: string;
          seller_snapshot: Json;
        };
        Insert: {
          amount_minor: number;
          client_snapshot?: Json | null;
          currency: Database["public"]["Enums"]["currency_code"];
          id?: string;
          invoice_id: string;
          invoice_number: string;
          issue_date: string;
          issued_at?: string;
          issued_by?: string | null;
          number: string;
          reason: string;
          seller_snapshot: Json;
        };
        Update: {
          amount_minor?: number;
          client_snapshot?: Json | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          id?: string;
          invoice_id?: string;
          invoice_number?: string;
          issue_date?: string;
          issued_at?: string;
          issued_by?: string | null;
          number?: string;
          reason?: string;
          seller_snapshot?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "credit_notes_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      deactivated_users: {
        Row: {
          deactivated_at: string;
          deactivated_by: string | null;
          user_id: string;
        };
        Insert: {
          deactivated_at?: string;
          deactivated_by?: string | null;
          user_id: string;
        };
        Update: {
          deactivated_at?: string;
          deactivated_by?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      delivery_reviews: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          project_id: string;
          rating: number;
          reviewed_by: string | null;
          talent_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          project_id: string;
          rating: number;
          reviewed_by?: string | null;
          talent_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          project_id?: string;
          rating?: number;
          reviewed_by?: string | null;
          talent_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_reviews_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_reviews_talent_id_fkey";
            columns: ["talent_id"];
            isOneToOne: false;
            referencedRelation: "talent_applications";
            referencedColumns: ["id"];
          },
        ];
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
      expenses: {
        Row: {
          amount_minor: number;
          category: Database["public"]["Enums"]["expense_category"];
          created_at: string;
          created_by: string | null;
          currency: Database["public"]["Enums"]["currency_code"];
          description: string;
          id: string;
          method: Database["public"]["Enums"]["payment_method"] | null;
          notes: string | null;
          project_id: string | null;
          reference: string | null;
          spent_on: string;
          updated_at: string;
          vendor: string | null;
        };
        Insert: {
          amount_minor: number;
          category: Database["public"]["Enums"]["expense_category"];
          created_at?: string;
          created_by?: string | null;
          currency: Database["public"]["Enums"]["currency_code"];
          description: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"] | null;
          notes?: string | null;
          project_id?: string | null;
          reference?: string | null;
          spent_on: string;
          updated_at?: string;
          vendor?: string | null;
        };
        Update: {
          amount_minor?: number;
          category?: Database["public"]["Enums"]["expense_category"];
          created_at?: string;
          created_by?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          description?: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"] | null;
          notes?: string | null;
          project_id?: string | null;
          reference?: string | null;
          spent_on?: string;
          updated_at?: string;
          vendor?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
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
      freelancer_payments: {
        Row: {
          amount_minor: number;
          currency: Database["public"]["Enums"]["currency_code"];
          description: string;
          expense_id: string | null;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          number: string;
          paid_on: string;
          payee_name: string;
          payout_snapshot: Json | null;
          project_id: string | null;
          recorded_at: string;
          recorded_by: string | null;
          reference: string | null;
          seller_snapshot: Json;
          talent_id: string;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          amount_minor: number;
          currency: Database["public"]["Enums"]["currency_code"];
          description: string;
          expense_id?: string | null;
          id?: string;
          method: Database["public"]["Enums"]["payment_method"];
          number: string;
          paid_on: string;
          payee_name: string;
          payout_snapshot?: Json | null;
          project_id?: string | null;
          recorded_at?: string;
          recorded_by?: string | null;
          reference?: string | null;
          seller_snapshot: Json;
          talent_id: string;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          amount_minor?: number;
          currency?: Database["public"]["Enums"]["currency_code"];
          description?: string;
          expense_id?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          number?: string;
          paid_on?: string;
          payee_name?: string;
          payout_snapshot?: Json | null;
          project_id?: string | null;
          recorded_at?: string;
          recorded_by?: string | null;
          reference?: string | null;
          seller_snapshot?: Json;
          talent_id?: string;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "freelancer_payments_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "freelancer_payments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "freelancer_payments_talent_id_fkey";
            columns: ["talent_id"];
            isOneToOne: false;
            referencedRelation: "talent_applications";
            referencedColumns: ["id"];
          },
        ];
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
          balance_minor: number | null;
          client_id: string;
          client_snapshot: Json | null;
          created_at: string;
          created_by: string | null;
          credited_minor: number;
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
          refunded_minor: number;
          seller_snapshot: Json | null;
          status: Database["public"]["Enums"]["invoice_status"];
          total_minor: number;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          balance_minor?: number | null;
          client_id: string;
          client_snapshot?: Json | null;
          created_at?: string;
          created_by?: string | null;
          credited_minor?: number;
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
          refunded_minor?: number;
          seller_snapshot?: Json | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          total_minor?: number;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          balance_minor?: number | null;
          client_id?: string;
          client_snapshot?: Json | null;
          created_at?: string;
          created_by?: string | null;
          credited_minor?: number;
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
          refunded_minor?: number;
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
      project_assignments: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          project_id: string;
          role_on_project: string | null;
          talent_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          project_id: string;
          role_on_project?: string | null;
          talent_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          project_id?: string;
          role_on_project?: string | null;
          talent_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_assignments_talent_id_fkey";
            columns: ["talent_id"];
            isOneToOne: false;
            referencedRelation: "talent_applications";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          client_id: string | null;
          created_at: string;
          created_by: string | null;
          delivered_at: string | null;
          description: string | null;
          due_on: string | null;
          id: string;
          name: string;
          status: Database["public"]["Enums"]["project_status"];
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          delivered_at?: string | null;
          description?: string | null;
          due_on?: string | null;
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["project_status"];
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          delivered_at?: string | null;
          description?: string | null;
          due_on?: string | null;
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["project_status"];
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      qa_checklist_items: {
        Row: {
          done: boolean;
          done_at: string | null;
          done_by: string | null;
          id: string;
          label: string;
          notes: string | null;
          position: number;
          project_id: string;
        };
        Insert: {
          done?: boolean;
          done_at?: string | null;
          done_by?: string | null;
          id?: string;
          label: string;
          notes?: string | null;
          position?: number;
          project_id: string;
        };
        Update: {
          done?: boolean;
          done_at?: string | null;
          done_by?: string | null;
          id?: string;
          label?: string;
          notes?: string | null;
          position?: number;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qa_checklist_items_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_items: {
        Row: {
          description: string;
          id: string;
          line_total_minor: number | null;
          position: number;
          quantity: number;
          quote_id: string;
          unit_price_minor: number;
        };
        Insert: {
          description: string;
          id?: string;
          line_total_minor?: number | null;
          position?: number;
          quantity: number;
          quote_id: string;
          unit_price_minor: number;
        };
        Update: {
          description?: string;
          id?: string;
          line_total_minor?: number | null;
          position?: number;
          quantity?: number;
          quote_id?: string;
          unit_price_minor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          client_id: string;
          client_snapshot: Json | null;
          created_at: string;
          created_by: string | null;
          currency: Database["public"]["Enums"]["currency_code"];
          decided_at: string | null;
          decided_by: string | null;
          decision_note: string | null;
          id: string;
          invoice_id: string | null;
          issue_date: string | null;
          notes: string | null;
          number: string | null;
          seller_snapshot: Json | null;
          sent_at: string | null;
          sent_by: string | null;
          status: Database["public"]["Enums"]["quote_status"];
          title: string | null;
          total_minor: number;
          valid_until: string | null;
        };
        Insert: {
          client_id: string;
          client_snapshot?: Json | null;
          created_at?: string;
          created_by?: string | null;
          currency: Database["public"]["Enums"]["currency_code"];
          decided_at?: string | null;
          decided_by?: string | null;
          decision_note?: string | null;
          id?: string;
          invoice_id?: string | null;
          issue_date?: string | null;
          notes?: string | null;
          number?: string | null;
          seller_snapshot?: Json | null;
          sent_at?: string | null;
          sent_by?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
          title?: string | null;
          total_minor?: number;
          valid_until?: string | null;
        };
        Update: {
          client_id?: string;
          client_snapshot?: Json | null;
          created_at?: string;
          created_by?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          decided_at?: string | null;
          decided_by?: string | null;
          decision_note?: string | null;
          id?: string;
          invoice_id?: string | null;
          issue_date?: string | null;
          notes?: string | null;
          number?: string | null;
          seller_snapshot?: Json | null;
          sent_at?: string | null;
          sent_by?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
          title?: string | null;
          total_minor?: number;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: true;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limit_hits: {
        Row: {
          bucket: string;
          created_at: string;
          id: number;
        };
        Insert: {
          bucket: string;
          created_at?: string;
          id?: never;
        };
        Update: {
          bucket?: string;
          created_at?: string;
          id?: never;
        };
        Relationships: [];
      };
      refunds: {
        Row: {
          amount_minor: number;
          currency: Database["public"]["Enums"]["currency_code"];
          id: string;
          invoice_id: string;
          method: Database["public"]["Enums"]["payment_method"];
          number: string;
          reason: string;
          recorded_at: string;
          recorded_by: string | null;
          reference: string | null;
          refunded_on: string;
        };
        Insert: {
          amount_minor: number;
          currency: Database["public"]["Enums"]["currency_code"];
          id?: string;
          invoice_id: string;
          method: Database["public"]["Enums"]["payment_method"];
          number: string;
          reason: string;
          recorded_at?: string;
          recorded_by?: string | null;
          reference?: string | null;
          refunded_on: string;
        };
        Update: {
          amount_minor?: number;
          currency?: Database["public"]["Enums"]["currency_code"];
          id?: string;
          invoice_id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          number?: string;
          reason?: string;
          recorded_at?: string;
          recorded_by?: string | null;
          reference?: string | null;
          refunded_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "refunds_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      shareholders: {
        Row: {
          created_at: string;
          holder_type: string;
          id: string;
          name: string;
          ownership_percent: number | null;
          shares: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          holder_type: string;
          id?: string;
          name: string;
          ownership_percent?: number | null;
          shares: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          holder_type?: string;
          id?: string;
          name?: string;
          ownership_percent?: number | null;
          shares?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      talent_applications: {
        Row: {
          availability: string | null;
          consent_at: string;
          country: string;
          created_at: string;
          email: string;
          engagement_preference: string;
          engagement_type: Database["public"]["Enums"]["engagement_type"] | null;
          full_name: string;
          id: string;
          message: string | null;
          phone: string | null;
          portfolio_url: string | null;
          primary_role: string;
          profile_url: string | null;
          rejection_reason: string | null;
          screening_notes: string | null;
          skills: string[];
          stage: Database["public"]["Enums"]["talent_stage"];
          stage_changed_at: string;
          tax_pin_encrypted: string | null;
          tax_pin_recorded_at: string | null;
          test_task_notes: string | null;
          updated_by: string | null;
          user_id: string | null;
          verification_status: string;
          years_experience: number;
        };
        Insert: {
          availability?: string | null;
          consent_at: string;
          country: string;
          created_at?: string;
          email: string;
          engagement_preference: string;
          engagement_type?: Database["public"]["Enums"]["engagement_type"] | null;
          full_name: string;
          id?: string;
          message?: string | null;
          phone?: string | null;
          portfolio_url?: string | null;
          primary_role: string;
          profile_url?: string | null;
          rejection_reason?: string | null;
          screening_notes?: string | null;
          skills?: string[];
          stage?: Database["public"]["Enums"]["talent_stage"];
          stage_changed_at?: string;
          tax_pin_encrypted?: string | null;
          tax_pin_recorded_at?: string | null;
          test_task_notes?: string | null;
          updated_by?: string | null;
          user_id?: string | null;
          verification_status?: string;
          years_experience: number;
        };
        Update: {
          availability?: string | null;
          consent_at?: string;
          country?: string;
          created_at?: string;
          email?: string;
          engagement_preference?: string;
          engagement_type?: Database["public"]["Enums"]["engagement_type"] | null;
          full_name?: string;
          id?: string;
          message?: string | null;
          phone?: string | null;
          portfolio_url?: string | null;
          primary_role?: string;
          profile_url?: string | null;
          rejection_reason?: string | null;
          screening_notes?: string | null;
          skills?: string[];
          stage?: Database["public"]["Enums"]["talent_stage"];
          stage_changed_at?: string;
          tax_pin_encrypted?: string | null;
          tax_pin_recorded_at?: string | null;
          test_task_notes?: string | null;
          updated_by?: string | null;
          user_id?: string | null;
          verification_status?: string;
          years_experience?: number;
        };
        Relationships: [];
      };
      talent_documents: {
        Row: {
          accepted_at: string | null;
          accepted_name: string | null;
          file_name: string;
          generated_from: Json | null;
          id: string;
          kind: string;
          reference: string | null;
          requires_acceptance: boolean;
          size_bytes: number;
          storage_path: string;
          talent_id: string;
          title: string;
          uploaded_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_name?: string | null;
          file_name: string;
          generated_from?: Json | null;
          id?: string;
          kind: string;
          reference?: string | null;
          requires_acceptance?: boolean;
          size_bytes: number;
          storage_path: string;
          talent_id: string;
          title: string;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          accepted_name?: string | null;
          file_name?: string;
          generated_from?: Json | null;
          id?: string;
          kind?: string;
          reference?: string | null;
          requires_acceptance?: boolean;
          size_bytes?: number;
          storage_path?: string;
          talent_id?: string;
          title?: string;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "talent_documents_talent_id_fkey";
            columns: ["talent_id"];
            isOneToOne: false;
            referencedRelation: "talent_applications";
            referencedColumns: ["id"];
          },
        ];
      };
      talent_payout_details: {
        Row: {
          bank_account_name: string | null;
          bank_account_number: string | null;
          bank_branch: string | null;
          bank_name: string | null;
          mpesa_name: string | null;
          mpesa_number: string | null;
          preferred_method: Database["public"]["Enums"]["payment_method"];
          talent_id: string;
          updated_at: string;
        };
        Insert: {
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_branch?: string | null;
          bank_name?: string | null;
          mpesa_name?: string | null;
          mpesa_number?: string | null;
          preferred_method: Database["public"]["Enums"]["payment_method"];
          talent_id: string;
          updated_at?: string;
        };
        Update: {
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_branch?: string | null;
          bank_name?: string | null;
          mpesa_name?: string | null;
          mpesa_number?: string | null;
          preferred_method?: Database["public"]["Enums"]["payment_method"];
          talent_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "talent_payout_details_talent_id_fkey";
            columns: ["talent_id"];
            isOneToOne: true;
            referencedRelation: "talent_applications";
            referencedColumns: ["id"];
          },
        ];
      };
      talent_test_tasks: {
        Row: {
          application_id: string;
          brief: string;
          created_at: string;
          created_by: string | null;
          due_on: string | null;
          id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          submission_note: string | null;
          submission_url: string | null;
          submitted_at: string | null;
          title: string;
        };
        Insert: {
          application_id: string;
          brief: string;
          created_at?: string;
          created_by?: string | null;
          due_on?: string | null;
          id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          submission_note?: string | null;
          submission_url?: string | null;
          submitted_at?: string | null;
          title: string;
        };
        Update: {
          application_id?: string;
          brief?: string;
          created_at?: string;
          created_by?: string | null;
          due_on?: string | null;
          id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          submission_note?: string | null;
          submission_url?: string | null;
          submitted_at?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "talent_test_tasks_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "talent_applications";
            referencedColumns: ["id"];
          },
        ];
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
      accept_talent_document: {
        Args: { _document_id: string; _typed_name: string };
        Returns: undefined;
      };
      admin_database_size_bytes: { Args: never; Returns: number };
      chat_live_available: { Args: never; Returns: boolean };
      check_rate_limit: {
        Args: {
          p_bucket: string;
          p_max_per_day: number;
          p_max_per_window: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      convert_quote_to_invoice: { Args: { _quote_id: string }; Returns: string };
      decide_quote: {
        Args: {
          _note: string;
          _outcome: Database["public"]["Enums"]["quote_status"];
          _quote_id: string;
        };
        Returns: undefined;
      };
      delete_old_chats: { Args: never; Returns: undefined };
      delete_old_conversion_events: { Args: never; Returns: undefined };
      end_user_sessions: { Args: { _user_id: string }; Returns: undefined };
      get_talent_internal_notes: {
        Args: { _application_id: string };
        Returns: {
          rejection_reason: string;
          screening_notes: string;
          test_task_notes: string;
        }[];
      };
      get_talent_tax_pin: { Args: { _application_id: string }; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      invoice_money_status: {
        Args: {
          _credited: number;
          _paid: number;
          _refunded: number;
          _total: number;
        };
        Returns: Database["public"]["Enums"]["invoice_status"];
      };
      is_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][];
          _user_id: string;
        };
        Returns: boolean;
      };
      issue_credit_note: {
        Args: { _amount_minor: number; _invoice_id: string; _reason: string };
        Returns: string;
      };
      issue_invoice: {
        Args: { _due_date: string; _invoice_id: string };
        Returns: string;
      };
      nairobi_today: { Args: never; Returns: string };
      next_document_number: { Args: { _doc_type: string }; Returns: string };
      next_talent_document_number: { Args: { _kind: string }; Returns: string };
      record_chat_ai_usage: {
        Args: {
          _cache_read: number;
          _cache_write: number;
          _cost_micros: number;
          _input: number;
          _month: string;
          _output: number;
        };
        Returns: undefined;
      };
      record_freelancer_payment: {
        Args: {
          _amount_minor: number;
          _currency: Database["public"]["Enums"]["currency_code"];
          _description: string;
          _method: Database["public"]["Enums"]["payment_method"];
          _paid_on: string;
          _project_id: string;
          _reference: string;
          _talent_id: string;
        };
        Returns: string;
      };
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
      record_refund: {
        Args: {
          _amount_minor: number;
          _invoice_id: string;
          _method: Database["public"]["Enums"]["payment_method"];
          _reason: string;
          _reference: string;
          _refunded_on: string;
        };
        Returns: string;
      };
      send_quote: {
        Args: { _quote_id: string; _valid_until: string };
        Returns: string;
      };
      set_own_payout_details: {
        Args: {
          _bank_account_name: string;
          _bank_account_number: string;
          _bank_branch: string;
          _bank_name: string;
          _mpesa_name: string;
          _mpesa_number: string;
          _preferred_method: Database["public"]["Enums"]["payment_method"];
        };
        Returns: undefined;
      };
      set_talent_tax_pin: {
        Args: { _application_id: string; _pin: string };
        Returns: undefined;
      };
      shareholder_overview: { Args: never; Returns: Json };
      submit_test_task: {
        Args: { _note: string; _task_id: string; _url: string };
        Returns: undefined;
      };
      update_own_talent_profile: {
        Args: {
          _availability: string;
          _phone: string;
          _portfolio_url: string;
          _profile_url: string;
          _skills: string[];
        };
        Returns: undefined;
      };
      void_freelancer_payment: {
        Args: { _payment_id: string; _reason: string };
        Returns: undefined;
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
        | "client"
        | "recruitment"
        | "investor";
      booking_status: "confirmed" | "cancelled" | "completed" | "no_show";
      currency_code: "KES" | "USD";
      engagement_type: "freelance" | "full_time";
      expense_category:
        | "talent"
        | "software"
        | "hosting"
        | "marketing"
        | "office"
        | "travel"
        | "equipment"
        | "fees_taxes"
        | "other";
      invoice_status:
        "draft" | "issued" | "partially_paid" | "paid" | "void" | "credited";
      lead_status: "new" | "contacted" | "qualified" | "disqualified";
      lead_tier: "hot" | "warm" | "cold";
      payment_method: "mpesa" | "bank_transfer" | "other";
      project_status: "active" | "in_review" | "delivered" | "on_hold";
      quote_status: "draft" | "sent" | "accepted" | "declined";
      talent_stage:
        "applied" | "screening" | "test_task" | "test_review" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "director",
        "finance",
        "marketing",
        "sales",
        "quality",
        "freelancer",
        "client",
        "recruitment",
        "investor",
      ],
      booking_status: ["confirmed", "cancelled", "completed", "no_show"],
      currency_code: ["KES", "USD"],
      engagement_type: ["freelance", "full_time"],
      expense_category: [
        "talent",
        "software",
        "hosting",
        "marketing",
        "office",
        "travel",
        "equipment",
        "fees_taxes",
        "other",
      ],
      invoice_status: ["draft", "issued", "partially_paid", "paid", "void", "credited"],
      lead_status: ["new", "contacted", "qualified", "disqualified"],
      lead_tier: ["hot", "warm", "cold"],
      payment_method: ["mpesa", "bank_transfer", "other"],
      project_status: ["active", "in_review", "delivered", "on_hold"],
      quote_status: ["draft", "sent", "accepted", "declined"],
      talent_stage: [
        "applied",
        "screening",
        "test_task",
        "test_review",
        "approved",
        "rejected",
      ],
    },
  },
} as const;
