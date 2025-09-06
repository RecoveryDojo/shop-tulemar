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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_learning_patterns: {
        Row: {
          confidence_score: number | null
          created_at: string
          failure_count: number | null
          id: string
          input_pattern: string
          last_used_at: string | null
          metadata: Json | null
          output_value: string
          pattern_type: string
          success_count: number | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          failure_count?: number | null
          id?: string
          input_pattern: string
          last_used_at?: string | null
          metadata?: Json | null
          output_value: string
          pattern_type: string
          success_count?: number | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          failure_count?: number | null
          id?: string
          input_pattern?: string
          last_used_at?: string | null
          metadata?: Json | null
          output_value?: string
          pattern_type?: string
          success_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_processing_feedback: {
        Row: {
          ai_suggestion: string | null
          confidence_score: number | null
          created_at: string
          field_name: string
          id: string
          import_job_id: string | null
          metadata: Json | null
          processing_time_ms: number | null
          product_name: string
          user_correction: string | null
          was_accepted: boolean | null
        }
        Insert: {
          ai_suggestion?: string | null
          confidence_score?: number | null
          created_at?: string
          field_name: string
          id?: string
          import_job_id?: string | null
          metadata?: Json | null
          processing_time_ms?: number | null
          product_name: string
          user_correction?: string | null
          was_accepted?: boolean | null
        }
        Update: {
          ai_suggestion?: string | null
          confidence_score?: number | null
          created_at?: string
          field_name?: string
          id?: string
          import_job_id?: string | null
          metadata?: Json | null
          processing_time_ms?: number | null
          product_name?: string
          user_correction?: string | null
          was_accepted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_feedback_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon: string
          id: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      documentation: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          priority: string | null
          project_id: string
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          project_id: string
          status?: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          project_id?: string
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          actual_hours: number | null
          completion_percentage: number | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          name: string
          order_index: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          project_id: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          completion_percentage?: number | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          order_index?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          project_id: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          completion_percentage?: number | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          order_index?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "features_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      import_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          errors: string[] | null
          id: string
          image_url: string | null
          job_id: string
          name: string | null
          normalized: Json | null
          origin: string | null
          price: number | null
          product_id: string | null
          raw: Json
          row_index: number | null
          status: string
          stock_quantity: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          errors?: string[] | null
          id?: string
          image_url?: string | null
          job_id: string
          name?: string | null
          normalized?: Json | null
          origin?: string | null
          price?: number | null
          product_id?: string | null
          raw: Json
          row_index?: number | null
          status?: string
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          errors?: string[] | null
          id?: string
          image_url?: string | null
          job_id?: string
          name?: string | null
          normalized?: Json | null
          origin?: string | null
          price?: number | null
          product_id?: string | null
          raw?: Json
          row_index?: number | null
          status?: string
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          column_mapping: Json | null
          created_at: string
          created_by: string
          id: string
          original_headers: Json | null
          settings: Json | null
          source_filename: string | null
          stats_error_rows: number | null
          stats_total_rows: number | null
          stats_valid_rows: number | null
          status: string
          updated_at: string
        }
        Insert: {
          column_mapping?: Json | null
          created_at?: string
          created_by: string
          id?: string
          original_headers?: Json | null
          settings?: Json | null
          source_filename?: string | null
          stats_error_rows?: number | null
          stats_total_rows?: number | null
          stats_valid_rows?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          column_mapping?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          original_headers?: Json | null
          settings?: Json | null
          source_filename?: string | null
          stats_error_rows?: number | null
          stats_total_rows?: number | null
          stats_valid_rows?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          completion_date: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          is_completed: boolean | null
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          is_completed?: boolean | null
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          is_completed?: boolean | null
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notifications: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          message_content: string | null
          metadata: Json | null
          notification_type: string
          order_id: string
          recipient_identifier: string
          recipient_type: string
          sent_at: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_content?: string | null
          metadata?: Json | null
          notification_type: string
          order_id: string
          recipient_identifier: string
          recipient_type: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_content?: string | null
          metadata?: Json | null
          notification_type?: string
          order_id?: string
          recipient_identifier?: string
          recipient_type?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_workflow_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          id: string
          metadata: Json | null
          new_status: string | null
          notes: string | null
          order_id: string
          phase: string
          previous_status: string | null
          timestamp: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          notes?: string | null
          order_id: string
          phase: string
          previous_status?: string | null
          timestamp?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          notes?: string | null
          order_id?: string
          phase?: string
          previous_status?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_workflow_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string | null
          arrival_date: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivery_fee: number
          departure_date: string | null
          dietary_restrictions: Json | null
          guest_count: number | null
          id: string
          payment_intent_id: string | null
          payment_status: string | null
          property_address: string | null
          special_instructions: string | null
          status: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          arrival_date?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivery_fee: number
          departure_date?: string | null
          dietary_restrictions?: Json | null
          guest_count?: number | null
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          property_address?: string | null
          special_instructions?: string | null
          status?: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          arrival_date?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_fee?: number
          departure_date?: string | null
          dietary_restrictions?: Json | null
          guest_count?: number | null
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          property_address?: string | null
          special_instructions?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          origin: string | null
          price: number
          stock_quantity: number | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          origin?: string | null
          price: number
          stock_quantity?: number | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          origin?: string | null
          price?: number
          stock_quantity?: number | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          client_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      stakeholder_assignments: {
        Row: {
          accepted_at: string | null
          assigned_at: string
          created_at: string
          id: string
          notes: string | null
          order_id: string
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          role: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          is_completed: boolean | null
          order_index: number | null
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          dependency_task_id: string
          dependent_task_id: string
          id: string
        }
        Insert: {
          created_at?: string
          dependency_task_id: string
          dependent_task_id: string
          id?: string
        }
        Update: {
          created_at?: string
          dependency_task_id?: string
          dependent_task_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_dependency_task_id_fkey"
            columns: ["dependency_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_dependent_task_id_fkey"
            columns: ["dependent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          feature_id: string
          id: string
          order_index: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          project_id: string
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          feature_id: string
          id?: string
          order_index?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          project_id: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          feature_id?: string
          id?: string
          order_index?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          joined_at: string
          project_id: string
          role: Database["public"]["Enums"]["team_role"]
          user_id: string
        }
        Insert: {
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          project_id: string
          role: Database["public"]["Enums"]["team_role"]
          user_id: string
        }
        Update: {
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          project_id?: string
          role?: Database["public"]["Enums"]["team_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          date: string
          description: string | null
          hours: number
          id: string
          subtask_id: string | null
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          hours: number
          id?: string
          subtask_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          hours?: number
          id?: string
          subtask_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_subtask_id_fkey"
            columns: ["subtask_id"]
            isOneToOne: false
            referencedRelation: "subtasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_ai_pattern_suggestion: {
        Args: {
          input_pattern_param: string
          min_confidence?: number
          pattern_type_param: string
        }
        Returns: {
          confidence_score: number
          output_value: string
          usage_count: number
        }[]
      }
      get_order_by_token: {
        Args: { order_token: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_sysadmin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      record_ai_pattern_success: {
        Args: {
          confidence_param?: number
          input_pattern_param: string
          output_value_param: string
          pattern_type_param: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "driver" | "client" | "concierge" | "sysadmin"
      priority_level: "low" | "medium" | "high" | "critical"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      task_status:
        | "backlog"
        | "todo"
        | "in_progress"
        | "review"
        | "testing"
        | "done"
        | "blocked"
      team_role:
        | "project_manager"
        | "frontend_dev"
        | "backend_dev"
        | "fullstack_dev"
        | "designer"
        | "qa_tester"
        | "client"
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
      app_role: ["admin", "driver", "client", "concierge", "sysadmin"],
      priority_level: ["low", "medium", "high", "critical"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      task_status: [
        "backlog",
        "todo",
        "in_progress",
        "review",
        "testing",
        "done",
        "blocked",
      ],
      team_role: [
        "project_manager",
        "frontend_dev",
        "backend_dev",
        "fullstack_dev",
        "designer",
        "qa_tester",
        "client",
      ],
    },
  },
} as const
