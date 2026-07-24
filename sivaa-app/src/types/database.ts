export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          siva_tag: string;
          name: string;
          phone: string | null;
          email: string | null;
          country: string;
          kyc_status: "unverified" | "pending" | "verified" | "rejected";
          pin_hash: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          siva_tag: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          country?: string;
          kyc_status?: "unverified" | "pending" | "verified" | "rejected";
          pin_hash?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          siva_tag?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          country?: string;
          kyc_status?: "unverified" | "pending" | "verified" | "rejected";
          pin_hash?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      admins: {
        Row: {
          admin_id: string;
          profile_id: string;
          role: "reviewer" | "super_admin";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          admin_id?: string;
          profile_id: string;
          role?: "reviewer" | "super_admin";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          role?: "reviewer" | "super_admin";
          is_active?: boolean;
        };
      };
      wallets: {
        Row: {
          wallet_id: string;
          user_id: string;
          total_sent: number;
          total_received: number;
          locked_balance: number;
          currency: string;
          status: "active" | "frozen" | "suspended";
          created_at: string;
        };
        Insert: {
          wallet_id?: string;
          user_id: string;
          total_sent?: number;
          total_received?: number;
          locked_balance?: number;
          currency?: string;
          status?: "active" | "frozen" | "suspended";
          created_at?: string;
        };
        Update: {
          total_sent?: number;
          total_received?: number;
          locked_balance?: number;
          status?: "active" | "frozen" | "suspended";
        };
      };
      fee_rules: {
        Row: {
          rule_id: string;
          minimum_amount: number;
          maximum_amount: number | null;
          percentage: number;
          active: boolean;
        };
        Insert: {
          rule_id?: string;
          minimum_amount: number;
          maximum_amount?: number | null;
          percentage: number;
          active?: boolean;
        };
        Update: {
          minimum_amount?: number;
          maximum_amount?: number | null;
          percentage?: number;
          active?: boolean;
        };
      };
      payment_methods: {
        Row: {
          method_id: string;
          code: string;
          display_name: string;
          icon_key: string;
          fee_percentage: number;
          fee_fixed: number;
          min_amount: number;
          max_amount: number | null;
          daily_limit: number | null;
          monthly_limit: number | null;
          config: Record<string, unknown>;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          method_id?: string;
          code: string;
          display_name: string;
          icon_key: string;
          fee_percentage?: number;
          fee_fixed?: number;
          min_amount?: number;
          max_amount?: number | null;
          daily_limit?: number | null;
          monthly_limit?: number | null;
          config?: Record<string, unknown>;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          display_name?: string;
          icon_key?: string;
          fee_percentage?: number;
          fee_fixed?: number;
          min_amount?: number;
          max_amount?: number | null;
          daily_limit?: number | null;
          monthly_limit?: number | null;
          config?: Record<string, unknown>;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      payments: {
        Row: {
          payment_id: string;
          sender_id: string;
          receiver_id: string;
          gross_amount: number;
          fee_amount: number;
          net_amount: number;
          payment_method_id: string;
          reference: string;
          status:
            | "pending"
            | "under_review"
            | "escrow_held"
            | "completed"
            | "reversed"
            | "refunded"
            | "failed"
            | "cancelled";
          escrow_notes: string | null;
          created_at: string;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: {
          payment_id?: string;
          sender_id: string;
          receiver_id: string;
          gross_amount: number;
          fee_amount: number;
          net_amount: number;
          payment_method_id: string;
          reference: string;
          status?:
            | "pending"
            | "under_review"
            | "escrow_held"
            | "completed"
            | "reversed"
            | "refunded"
            | "failed"
            | "cancelled";
          escrow_notes?: string | null;
          created_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
        };
        Update: {
          status?:
            | "pending"
            | "under_review"
            | "escrow_held"
            | "completed"
            | "reversed"
            | "refunded"
            | "failed"
            | "cancelled";
          escrow_notes?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
        };
      };
      escrow_reviews: {
        Row: {
          review_id: string;
          payment_id: string;
          admin_id: string;
          action: "approved" | "rejected" | "held" | "released";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          review_id?: string;
          payment_id: string;
          admin_id: string;
          action: "approved" | "rejected" | "held" | "released";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          notes?: string | null;
        };
      };
      payment_verifications: {
        Row: {
          verification_id: string;
          payment_id: string;
          verification_method: string;
          receipt_url: string | null;
          verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          verification_id?: string;
          payment_id: string;
          verification_method: string;
          receipt_url?: string | null;
          verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
        };
      };
      wallet_transactions: {
        Row: {
          transaction_id: string;
          wallet_id: string;
          amount: number;
          type: Database["public"]["Enums"]["txn_type"];
          payment_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          transaction_id?: string;
          wallet_id: string;
          amount: number;
          type: Database["public"]["Enums"]["txn_type"];
          payment_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          amount?: number;
          description?: string | null;
        };
      };
      kyc_documents: {
        Row: {
          document_id: string;
          user_id: string;
          document_type: string;
          file_url: string;
          status: "pending" | "approved" | "rejected";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          document_id?: string;
          user_id: string;
          document_type: string;
          file_url: string;
          status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
      };
      bank_accounts: never;
      audit_logs: {
        Row: {
          log_id: string;
          actor_id: string;
          actor_type: "user" | "admin" | "system";
          action: string;
          table_name: string;
          record_id: string;
          old_value: Json | null;
          new_value: Json | null;
          timestamp: string;
        };
        Insert: {
          log_id?: string;
          actor_id: string;
          actor_type: "user" | "admin" | "system";
          action: string;
          table_name: string;
          record_id: string;
          old_value?: Json | null;
          new_value?: Json | null;
          timestamp?: string;
        };
        Update: {};
      };
      support_tickets: {
        Row: {
          ticket_id: string;
          user_id: string;
          category: string;
          priority: "low" | "medium" | "high" | "critical";
          status: "open" | "in_progress" | "resolved" | "closed";
          assigned_to: string | null;
          payment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          ticket_id?: string;
          user_id: string;
          category: string;
          priority?: "low" | "medium" | "high" | "critical";
          status?: "open" | "in_progress" | "resolved" | "closed";
          assigned_to?: string | null;
          payment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          priority?: "low" | "medium" | "high" | "critical";
          status?: "open" | "in_progress" | "resolved" | "closed";
          assigned_to?: string | null;
          updated_at?: string;
        };
      };
      ticket_messages: {
        Row: {
          message_id: string;
          ticket_id: string;
          sender_id: string;
          sender_type: "user" | "admin";
          message: string;
          created_at: string;
        };
        Insert: {
          message_id?: string;
          ticket_id: string;
          sender_id: string;
          sender_type: "user" | "admin";
          message: string;
          created_at?: string;
        };
        Update: {};
      };
      notifications: {
        Row: {
          notification_id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          notification_id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
    };
    Views: {};
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      kyc_status_type: "unverified" | "pending" | "verified" | "rejected";
      payment_status_type:
        | "pending"
        | "under_review"
        | "escrow_held"
        | "completed"
        | "reversed"
        | "refunded"
        | "failed"
        | "cancelled";
      admin_role_type: "reviewer" | "super_admin";
      wallet_status_type: "active" | "frozen" | "suspended";
      txn_type:
        | "transfer_in"
        | "transfer_out"
        | "fee"
        | "escrow_hold"
        | "escrow_release"
        | "escrow_refund"
        | "adjust_in"
        | "adjust_out";
    };
  };
};
