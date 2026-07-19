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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          delivery_address: string | null
          delivery_fee_pi: number
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          id: string
          notes: string | null
          product_id: string
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          total_price_pi: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          delivery_address?: string | null
          delivery_fee_pi?: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          status?: Database["public"]["Enums"]["order_status"]
          total_price_pi: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          delivery_address?: string | null
          delivery_fee_pi?: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_price_pi?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          memo: string | null
          metadata: Json | null
          order_id: string
          pi_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          txid: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          memo?: string | null
          metadata?: Json | null
          order_id: string
          pi_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          txid?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          memo?: string | null
          metadata?: Json | null
          order_id?: string
          pi_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          txid?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          farmer_id: string
          harvest_date: string | null
          id: string
          images: string[]
          live_inventory: number
          location: string | null
          price_per_unit: number
          quantity: number
          status: Database["public"]["Enums"]["product_status"]
          title: string
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          farmer_id: string
          harvest_date?: string | null
          id?: string
          images?: string[]
          live_inventory?: number
          location?: string | null
          price_per_unit: number
          quantity: number
          status?: Database["public"]["Enums"]["product_status"]
          title: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          farmer_id?: string
          harvest_date?: string | null
          id?: string
          images?: string[]
          live_inventory?: number
          location?: string | null
          price_per_unit?: number
          quantity?: number
          status?: Database["public"]["Enums"]["product_status"]
          title?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          location: string | null
          phone: string | null
          pi_user_id: string | null
          pi_username: string | null
          rating: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id: string
          location?: string | null
          phone?: string | null
          pi_user_id?: string | null
          pi_username?: string | null
          rating?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          pi_user_id?: string | null
          pi_username?: string | null
          rating?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          city: string | null
          created_at: string
          email: string
          id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          email: string
          id: string
          location: string
          phone: string
          pi_username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "farmer" | "buyer" | "admin"
      delivery_type: "PICKUP" | "DELIVERY"
      order_status:
        | "PENDING_PAYMENT"
        | "PAID"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED"
      payment_status:
        | "CREATED"
        | "APPROVED"
        | "COMPLETED"
        | "CANCELLED"
        | "ERROR"
      product_status: "PENDING" | "APPROVED" | "SOLD" | "REJECTED"
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
      app_role: ["farmer", "buyer", "admin"],
      delivery_type: ["PICKUP", "DELIVERY"],
      order_status: [
        "PENDING_PAYMENT",
        "PAID",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ],
      payment_status: [
        "CREATED",
        "APPROVED",
        "COMPLETED",
        "CANCELLED",
        "ERROR",
      ],
      product_status: ["PENDING", "APPROVED", "SOLD", "REJECTED"],
    },
  },
} as const
