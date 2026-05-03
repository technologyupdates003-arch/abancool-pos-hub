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
      admin_notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_payment_settings: {
        Row: {
          business_id: string
          created_at: string
          id: string
          mpesa_consumer_key: string | null
          mpesa_consumer_secret: string | null
          mpesa_enabled: boolean
          mpesa_environment: string
          mpesa_passkey: string | null
          mpesa_shortcode: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          mpesa_consumer_key?: string | null
          mpesa_consumer_secret?: string | null
          mpesa_enabled?: boolean
          mpesa_environment?: string
          mpesa_passkey?: string | null
          mpesa_shortcode?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          mpesa_consumer_key?: string | null
          mpesa_consumer_secret?: string | null
          mpesa_enabled?: boolean
          mpesa_environment?: string
          mpesa_passkey?: string | null
          mpesa_shortcode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          subscription_plan: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at: string | null
          type: Database["public"]["Enums"]["business_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          subscription_plan?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          subscription_plan?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
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
      orders: {
        Row: {
          business_id: string
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          id: string
          mpesa_receipt: string | null
          mpesa_request_id: string | null
          notes: string | null
          order_number: string
          payment_method: string | null
          staff_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          table_number: string | null
          tax: number | null
          total: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          id?: string
          mpesa_receipt?: string | null
          mpesa_request_id?: string | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          staff_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          table_number?: string | null
          tax?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          id?: string
          mpesa_receipt?: string | null
          mpesa_request_id?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          staff_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          table_number?: string | null
          tax?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          billing_period: string | null
          business_id: string
          checkout_request_id: string | null
          created_at: string
          id: string
          invoice_id: string | null
          mpesa_receipt: string | null
          phone_number: string
          plan_slug: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_period?: string | null
          business_id: string
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          mpesa_receipt?: string | null
          phone_number: string
          plan_slug?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_period?: string | null
          business_id?: string
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          mpesa_receipt?: string | null
          phone_number?: string
          plan_slug?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          business_id: string
          category_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          name: string
          price: number
          sku: string | null
          stock_quantity: number | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          business_id: string
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name: string
          price?: number
          sku?: string | null
          stock_quantity?: number | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          business_id?: string
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          price?: number
          sku?: string | null
          stock_quantity?: number | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          business_id: string
          capacity: number | null
          created_at: string
          current_order_id: string | null
          id: string
          status: Database["public"]["Enums"]["table_status"] | null
          table_number: string
        }
        Insert: {
          business_id: string
          capacity?: number | null
          created_at?: string
          current_order_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["table_status"] | null
          table_number: string
        }
        Update: {
          business_id?: string
          capacity?: number | null
          created_at?: string
          current_order_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["table_status"] | null
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_current_order_id_fkey"
            columns: ["current_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      school_announcements: {
        Row: {
          audience: string
          body: string
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          target_class_id: string | null
          title: string
        }
        Insert: {
          audience?: string
          body: string
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          target_class_id?: string | null
          title: string
        }
        Update: {
          audience?: string
          body?: string
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          target_class_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_announcements_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      school_attendance: {
        Row: {
          business_id: string
          class_id: string | null
          created_at: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          business_id: string
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          business_id?: string
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "school_students"
            referencedColumns: ["id"]
          },
        ]
      }
      school_classes: {
        Row: {
          academic_year: string
          business_id: string
          class_teacher_id: string | null
          created_at: string
          grade_level: string | null
          id: string
          name: string
          stream: string | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          business_id: string
          class_teacher_id?: string | null
          created_at?: string
          grade_level?: string | null
          id?: string
          name: string
          stream?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          business_id?: string
          class_teacher_id?: string | null
          created_at?: string
          grade_level?: string | null
          id?: string
          name?: string
          stream?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      school_exam_results: {
        Row: {
          business_id: string
          created_at: string
          entered_by: string | null
          exam_id: string
          grade: string | null
          id: string
          remarks: string | null
          score: number
          student_id: string
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          entered_by?: string | null
          exam_id: string
          grade?: string | null
          id?: string
          remarks?: string | null
          score?: number
          student_id: string
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          entered_by?: string | null
          exam_id?: string
          grade?: string | null
          id?: string
          remarks?: string | null
          score?: number
          student_id?: string
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "school_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "school_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_exam_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      school_exams: {
        Row: {
          academic_year: string
          business_id: string
          created_at: string
          end_date: string | null
          exam_type: string | null
          id: string
          max_score: number
          name: string
          start_date: string | null
          term: string | null
        }
        Insert: {
          academic_year: string
          business_id: string
          created_at?: string
          end_date?: string | null
          exam_type?: string | null
          id?: string
          max_score?: number
          name: string
          start_date?: string | null
          term?: string | null
        }
        Update: {
          academic_year?: string
          business_id?: string
          created_at?: string
          end_date?: string | null
          exam_type?: string | null
          id?: string
          max_score?: number
          name?: string
          start_date?: string | null
          term?: string | null
        }
        Relationships: []
      }
      school_fee_invoices: {
        Row: {
          academic_year: string
          balance: number
          business_id: string
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          paid: number
          status: Database["public"]["Enums"]["fee_status"]
          student_id: string
          term: string
          total: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          balance?: number
          business_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          paid?: number
          status?: Database["public"]["Enums"]["fee_status"]
          student_id: string
          term: string
          total?: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          balance?: number
          business_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          paid?: number
          status?: Database["public"]["Enums"]["fee_status"]
          student_id?: string
          term?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_fee_invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "school_students"
            referencedColumns: ["id"]
          },
        ]
      }
      school_fee_payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          id: string
          invoice_id: string
          method: string
          mpesa_receipt: string | null
          mpesa_request_id: string | null
          phone_number: string | null
          recorded_by: string | null
          status: string
          student_id: string
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          mpesa_receipt?: string | null
          mpesa_request_id?: string | null
          phone_number?: string | null
          recorded_by?: string | null
          status?: string
          student_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          mpesa_receipt?: string | null
          mpesa_request_id?: string | null
          phone_number?: string | null
          recorded_by?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_fee_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "school_fee_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "school_students"
            referencedColumns: ["id"]
          },
        ]
      }
      school_fee_structures: {
        Row: {
          academic_year: string
          amount: number
          business_id: string
          class_id: string | null
          created_at: string
          id: string
          item_name: string
          term: string
        }
        Insert: {
          academic_year: string
          amount?: number
          business_id: string
          class_id?: string | null
          created_at?: string
          id?: string
          item_name: string
          term: string
        }
        Update: {
          academic_year?: string
          amount?: number
          business_id?: string
          class_id?: string | null
          created_at?: string
          id?: string
          item_name?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      school_parent_students: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_parent_students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "school_parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_parent_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "school_students"
            referencedColumns: ["id"]
          },
        ]
      }
      school_parents: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      school_students: {
        Row: {
          address: string | null
          admission_no: string
          business_id: string
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          gender: string | null
          guardian_relation: string | null
          id: string
          is_active: boolean
          medical_notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          photo_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_no: string
          business_id: string
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          guardian_relation?: string | null
          id?: string
          is_active?: boolean
          medical_notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_no?: string
          business_id?: string
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          guardian_relation?: string | null
          id?: string
          is_active?: boolean
          medical_notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      school_subjects: {
        Row: {
          business_id: string
          code: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          business_id: string
          code?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          code?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      school_teachers: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          qualification: string | null
          subjects: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          qualification?: string | null
          subjects?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          qualification?: string | null
          subjects?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reference: string | null
          supplier_id: string | null
          unit_cost: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          reference?: string | null
          supplier_id?: string | null
          unit_cost?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference?: string | null
          supplier_id?: string | null
          unit_cost?: number | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_products: number | null
          max_staff: number | null
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_products?: number | null
          max_staff?: number | null
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_products?: number | null
          max_staff?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          business_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
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
          role?: Database["public"]["Enums"]["app_role"]
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
      get_member_role: {
        Args: { _business_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_business_member: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_parent: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_student: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_teacher: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      parent_owns_student: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      attendance_status: "present" | "absent" | "late" | "excused"
      business_type:
        | "retail"
        | "bar"
        | "restaurant"
        | "general"
        | "pharmacy"
        | "school"
      fee_status: "unpaid" | "partial" | "paid" | "overdue"
      member_role: "owner" | "manager" | "cashier"
      order_status:
        | "pending"
        | "preparing"
        | "ready"
        | "served"
        | "completed"
        | "cancelled"
      school_role: "principal" | "teacher" | "student" | "parent" | "accountant"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "suspended"
        | "cancelled"
      table_status: "available" | "occupied" | "reserved"
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
      attendance_status: ["present", "absent", "late", "excused"],
      business_type: [
        "retail",
        "bar",
        "restaurant",
        "general",
        "pharmacy",
        "school",
      ],
      fee_status: ["unpaid", "partial", "paid", "overdue"],
      member_role: ["owner", "manager", "cashier"],
      order_status: [
        "pending",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ],
      school_role: ["principal", "teacher", "student", "parent", "accountant"],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "suspended",
        "cancelled",
      ],
      table_status: ["available", "occupied", "reserved"],
    },
  },
} as const
