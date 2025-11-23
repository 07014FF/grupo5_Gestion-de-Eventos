export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          available_tickets: number
          category: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          general_price: number | null
          id: string
          image_url: string | null
          location: string
          price: number
          rating: number | null
          status: string
          student_price: number | null
          subtitle: string | null
          time: string
          title: string
          total_tickets: number
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          available_tickets?: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          general_price?: number | null
          id?: string
          image_url?: string | null
          location: string
          price: number
          rating?: number | null
          status?: string
          student_price?: number | null
          subtitle?: string | null
          time: string
          title: string
          total_tickets: number
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          available_tickets?: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          general_price?: number | null
          id?: string
          image_url?: string | null
          location?: string
          price?: number
          rating?: number | null
          status?: string
          student_price?: number | null
          subtitle?: string | null
          time?: string
          title?: string
          total_tickets?: number
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          payment_completed_at: string | null
          payment_gateway: string | null
          payment_metadata: Json | null
          payment_method: string
          payment_receipt_url: string | null
          payment_status: string
          payment_transaction_id: string | null
          total_amount: number
          transaction_id: string | null
          updated_at: string | null
          user_document: string | null
          user_email: string
          user_id: string
          user_name: string
          user_phone: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          payment_completed_at?: string | null
          payment_gateway?: string | null
          payment_metadata?: Json | null
          payment_method: string
          payment_receipt_url?: string | null
          payment_status?: string
          payment_transaction_id?: string | null
          total_amount: number
          transaction_id?: string | null
          updated_at?: string | null
          user_document?: string | null
          user_email: string
          user_id: string
          user_name: string
          user_phone?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          payment_completed_at?: string | null
          payment_gateway?: string | null
          payment_metadata?: Json | null
          payment_method?: string
          payment_receipt_url?: string | null
          payment_status?: string
          payment_transaction_id?: string | null
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_document?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          price: number
          purchase_id: string
          qr_code_data: string
          quantity: number
          seat_number: string | null
          status: string
          ticket_code: string
          ticket_type: string
          updated_at: string | null
          used_at: string | null
          user_id: string
          validated_by: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          price: number
          purchase_id: string
          qr_code_data: string
          quantity?: number
          seat_number?: string | null
          status?: string
          ticket_code: string
          ticket_type?: string
          updated_at?: string | null
          used_at?: string | null
          user_id: string
          validated_by?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          price?: number
          purchase_id?: string
          qr_code_data?: string
          quantity?: number
          seat_number?: string | null
          status?: string
          ticket_code?: string
          ticket_type?: string
          updated_at?: string | null
          used_at?: string | null
          user_id?: string
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases_with_payment_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          document: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          document?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          document?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      validations: {
        Row: {
          created_at: string | null
          device_info: string | null
          id: string
          location: string | null
          ticket_id: string
          validated_by: string
          validation_message: string | null
          validation_result: string
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          location?: string | null
          ticket_id: string
          validated_by: string
          validation_message?: string | null
          validation_result: string
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          location?: string | null
          ticket_id?: string
          validated_by?: string
          validation_message?: string | null
          validation_result?: string
        }
        Relationships: [
          {
            foreignKeyName: "validations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validations_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      purchases_with_payment_info: {
        Row: {
          bank_name: string | null
          card_brand: string | null
          card_last_four: string | null
          created_at: string | null
          event_date: string | null
          event_id: string | null
          event_title: string | null
          id: string | null
          payment_completed_at: string | null
          payment_gateway: string | null
          payment_method: string | null
          payment_status: string | null
          payment_transaction_id: string | null
          total_amount: number | null
          transaction_id: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      clear_seed_data: { Args: never; Returns: undefined }
      complete_ticket_validation: {
        Args: {
          p_event_id: string
          p_ticket_code: string
          p_validator_id: string
        }
        Returns: Json
      }
      decrement_tickets_by_quantity: {
        Args: { decrement_by: number; event_id_param: string }
        Returns: undefined
      }
      fix_event_available_tickets: {
        Args: { event_id_param: string }
        Returns: undefined
      }
      generate_qr_data: { Args: { ticket_id: string }; Returns: string }
      get_new_users_over_time: {
        Args: never
        Returns: {
          count: number
          date: string
        }[]
      }
      get_payment_stats: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          avg_amount: number
          failed_transactions: number
          gateway: string
          successful_transactions: number
          total_amount: number
          total_transactions: number
        }[]
      }
      get_sales_by_category: {
        Args: never
        Returns: {
          category: string
          total_sales: number
        }[]
      }
      get_ticket_validation_status: {
        Args: never
        Returns: {
          count: number
          status: string
        }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      promote_to_qr_validator: {
        Args: { user_email: string }
        Returns: {
          message: string
          success: boolean
          user_id: string
        }[]
      }
      validate_ticket_by_code: {
        Args: {
          p_event_id: string
          p_ticket_code: string
          p_validator_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
