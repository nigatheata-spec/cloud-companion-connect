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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      application_submissions: {
        Row: {
          created_at: string
          description: string | null
          done: boolean
          file_path: string | null
          id: string
          participant_id: string
          photo_path: string | null
          plan_id: string
          result: string | null
          reviewer_note: string | null
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          done?: boolean
          file_path?: string | null
          id?: string
          participant_id: string
          photo_path?: string | null
          plan_id: string
          result?: string | null
          reviewer_note?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          done?: boolean
          file_path?: string | null
          id?: string
          participant_id?: string
          photo_path?: string | null
          plan_id?: string
          result?: string | null
          reviewer_note?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_submissions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "monthly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          id: string
          kind: string
          participant_id: string
          plan_id: string
          present: boolean
          recorded_at: string
          recorded_by: string | null
        }
        Insert: {
          id?: string
          kind: string
          participant_id: string
          plan_id: string
          present?: boolean
          recorded_at?: string
          recorded_by?: string | null
        }
        Update: {
          id?: string
          kind?: string
          participant_id?: string
          plan_id?: string
          present?: boolean
          recorded_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "monthly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          confirmed: boolean
          created_at: string
          id: string
          kind: string
          log_date: string
          note: string | null
          participant_id: string
          photo_path: string | null
          plan_id: string
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          id?: string
          kind: string
          log_date?: string
          note?: string | null
          participant_id: string
          photo_path?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          id?: string
          kind?: string
          log_date?: string
          note?: string | null
          participant_id?: string
          photo_path?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "monthly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_exercises: {
        Row: {
          created_at: string
          done: boolean
          id: string
          note: string | null
          participant_id: string
          plan_id: string
          reviewer_note: string | null
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          note?: string | null
          participant_id: string
          plan_id: string
          reviewer_note?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          note?: string | null
          participant_id?: string
          plan_id?: string
          reviewer_note?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lecture_exercises_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "monthly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_plans: {
        Row: {
          application_description: string
          application_requires_file: boolean
          application_requires_parent: boolean
          application_requires_photo: boolean
          application_requires_text: boolean
          application_title: string
          created_at: string
          habit_requires_photo: boolean
          habit_title: string
          id: string
          is_active: boolean
          lecture_topic: string
          month: string
          reading_topic: string
          session_topic: string
          title: string
        }
        Insert: {
          application_description?: string
          application_requires_file?: boolean
          application_requires_parent?: boolean
          application_requires_photo?: boolean
          application_requires_text?: boolean
          application_title?: string
          created_at?: string
          habit_requires_photo?: boolean
          habit_title?: string
          id?: string
          is_active?: boolean
          lecture_topic?: string
          month: string
          reading_topic?: string
          session_topic?: string
          title: string
        }
        Update: {
          application_description?: string
          application_requires_file?: boolean
          application_requires_parent?: boolean
          application_requires_photo?: boolean
          application_requires_text?: boolean
          application_title?: string
          created_at?: string
          habit_requires_photo?: boolean
          habit_title?: string
          id?: string
          is_active?: boolean
          lecture_topic?: string
          month?: string
          reading_topic?: string
          session_topic?: string
          title?: string
        }
        Relationships: []
      }
      parent_links: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          participant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          participant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          participant_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_parent_of: {
        Args: { _parent: string; _participant: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "participant" | "parent" | "supervisor"
      approval_status: "pending" | "approved" | "rejected" | "none"
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
      app_role: ["participant", "parent", "supervisor"],
      approval_status: ["pending", "approved", "rejected", "none"],
    },
  },
} as const
