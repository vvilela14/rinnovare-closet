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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          created_at: string
          id: string
          period_days: number | null
          product_id: string
          quantity: number
          start_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_days?: number | null
          product_id: string
          quantity?: number
          start_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_days?: number | null
          product_id?: string
          quantity?: number
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          color: string | null
          created_at: string
          delivery_days: number
          description: string | null
          id: string
          image_url: string | null
          images: string[]
          installments: number | null
          is_active: boolean
          name: string
          parent_product_id: string | null
          payment_terms: string
          price: number
          price_12_days: number | null
          price_4_days: number | null
          price_7_days: number | null
          size: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          delivery_days?: number
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          installments?: number | null
          is_active?: boolean
          name: string
          parent_product_id?: string | null
          payment_terms?: string
          price?: number
          price_12_days?: number | null
          price_4_days?: number | null
          price_7_days?: number | null
          size: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          delivery_days?: number
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          installments?: number | null
          is_active?: boolean
          name?: string
          parent_product_id?: string | null
          payment_terms?: string
          price?: number
          price_12_days?: number | null
          price_4_days?: number | null
          price_7_days?: number | null
          size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_events: {
        Row: {
          category: string | null
          created_at: string
          event_date: string
          id: string
          product_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          event_date: string
          id?: string
          product_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          event_date?: string
          id?: string
          product_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_complement: string | null
          address_number: string | null
          avatar_url: string | null
          created_at: string
          favorite_colors: string[]
          full_name: string | null
          id: string
          postal_code: string | null
          size: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          avatar_url?: string | null
          created_at?: string
          favorite_colors?: string[]
          full_name?: string | null
          id: string
          postal_code?: string | null
          size?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          avatar_url?: string | null
          created_at?: string
          favorite_colors?: string[]
          full_name?: string | null
          id?: string
          postal_code?: string | null
          size?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      rental_credits: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          rental_request_id: string | null
          used_at: string | null
          used_in_rental_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          rental_request_id?: string | null
          used_at?: string | null
          used_in_rental_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          rental_request_id?: string | null
          used_at?: string | null
          used_in_rental_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_credits_source_rental_request_id_fkey"
            columns: ["rental_request_id"]
            isOneToOne: false
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_credits_source_rental_request_id_fkey"
            columns: ["rental_request_id"]
            isOneToOne: false
            referencedRelation: "rental_requests_effective"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_credits_used_in_rental_id_fkey"
            columns: ["used_in_rental_id"]
            isOneToOne: false
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_credits_used_in_rental_id_fkey"
            columns: ["used_in_rental_id"]
            isOneToOne: false
            referencedRelation: "rental_requests_effective"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_requests: {
        Row: {
          balance_paid_at: string | null
          balance_value: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          credit_applied: number
          deposit_paid_at: string | null
          deposit_value: number | null
          end_date: string
          id: string
          payment_terms: string | null
          period_days: number
          product_id: string
          size: string | null
          start_date: string
          status: string
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_paid_at?: string | null
          balance_value?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          credit_applied?: number
          deposit_paid_at?: string | null
          deposit_value?: number | null
          end_date: string
          id?: string
          payment_terms?: string | null
          period_days: number
          product_id: string
          size?: string | null
          start_date: string
          status?: string
          total_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_paid_at?: string | null
          balance_value?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          credit_applied?: number
          deposit_paid_at?: string | null
          deposit_value?: number | null
          end_date?: string
          id?: string
          payment_terms?: string | null
          period_days?: number
          product_id?: string
          size?: string | null
          start_date?: string
          status?: string
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_monthly_stats: {
        Row: {
          faturamento_realizado: number | null
          locacoes_realizadas_valor: number | null
          month: string | null
          qtd_locacoes_realizadas: number | null
          qtd_realizada_total: number | null
          qtd_reservas_realizadas: number | null
          reservas_realizadas_valor: number | null
        }
        Relationships: []
      }
      rental_requests_effective: {
        Row: {
          balance_paid_at: string | null
          balance_value: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          credit_applied: number | null
          deposit_paid_at: string | null
          deposit_value: number | null
          effective_total: number | null
          end_date: string | null
          id: string | null
          payment_terms: string | null
          period_days: number | null
          product_id: string | null
          size: string | null
          start_date: string | null
          status: string | null
          status_label: string | null
          total_value: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance_paid_at?: string | null
          balance_value?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          credit_applied?: number | null
          deposit_paid_at?: string | null
          deposit_value?: number | null
          effective_total?: never
          end_date?: string | null
          id?: string | null
          payment_terms?: string | null
          period_days?: number | null
          product_id?: string | null
          size?: string | null
          start_date?: string | null
          status?: string | null
          status_label?: never
          total_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance_paid_at?: string | null
          balance_value?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          credit_applied?: number | null
          deposit_paid_at?: string | null
          deposit_value?: number | null
          effective_total?: never
          end_date?: string | null
          id?: string | null
          payment_terms?: string | null
          period_days?: number | null
          product_id?: string | null
          size?: string | null
          start_date?: string | null
          status?: string | null
          status_label?: never
          total_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credit_balance: {
        Row: {
          available_balance: number | null
          total_balance: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_rental_request: {
        Args: { _reason?: string; _rental_id: string }
        Returns: Json
      }
      get_admin_kpis: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
