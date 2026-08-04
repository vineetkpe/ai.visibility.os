export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          target_keywords: string[] | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          target_keywords?: string[] | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          target_keywords?: string[] | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      domains: {
        Row: {
          id: string;
          project_id: string;
          domain_name: string;
          is_primary: boolean;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          domain_name: string;
          is_primary?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          domain_name?: string;
          is_primary?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "domains_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          id: string;
          domain_id: string;
          url: string;
          title: string | null;
          http_status: number | null;
          meta_description: string | null;
          canonical_url: string | null;
          language: string | null;
          favicon_url: string | null;
          logo_url: string | null;
          headings: Json | null;
          open_graph: Json | null;
          twitter_card: Json | null;
          json_ld: Json | null;
          schema_org_types: string[] | null;
          social_links: Json | null;
          organization_details: Json | null;
          images: Json | null;
          robots_meta: string | null;
          word_count: number | null;
          crawl_status: string;
          crawl_error: string | null;
          last_scanned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain_id: string;
          url: string;
          title?: string | null;
          http_status?: number | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          language?: string | null;
          favicon_url?: string | null;
          logo_url?: string | null;
          headings?: Json | null;
          open_graph?: Json | null;
          twitter_card?: Json | null;
          json_ld?: Json | null;
          schema_org_types?: string[] | null;
          social_links?: Json | null;
          organization_details?: Json | null;
          images?: Json | null;
          robots_meta?: string | null;
          word_count?: number | null;
          crawl_status?: string;
          crawl_error?: string | null;
          last_scanned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain_id?: string;
          url?: string;
          title?: string | null;
          http_status?: number | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          language?: string | null;
          favicon_url?: string | null;
          logo_url?: string | null;
          headings?: Json | null;
          open_graph?: Json | null;
          twitter_card?: Json | null;
          json_ld?: Json | null;
          schema_org_types?: string[] | null;
          social_links?: Json | null;
          organization_details?: Json | null;
          images?: Json | null;
          robots_meta?: string | null;
          word_count?: number | null;
          crawl_status?: string;
          crawl_error?: string | null;
          last_scanned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pages_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
        ];
      };
      page_links: {
        Row: {
          id: string;
          source_page_id: string;
          target_url: string;
          link_type: 'internal' | 'external';
          anchor_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_page_id: string;
          target_url: string;
          link_type: 'internal' | 'external';
          anchor_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_page_id?: string;
          target_url?: string;
          link_type?: 'internal' | 'external';
          anchor_text?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_links_source_page_id_fkey";
            columns: ["source_page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          id: string;
          project_id: string;
          job_type: string;
          status: string;
          payload: Json | null;
          result: Json | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          job_type: string;
          status?: string;
          payload?: Json | null;
          result?: Json | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          job_type?: string;
          status?: string;
          payload?: Json | null;
          result?: Json | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      business_context_versions: {
        Row: {
          id: string;
          project_id: string;
          version_number: number;
          is_current: boolean;
          generated_at: string;
          generation_method: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version_number: number;
          is_current?: boolean;
          generated_at?: string;
          generation_method: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          version_number?: number;
          is_current?: boolean;
          generated_at?: string;
          generation_method?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_context_versions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      business_context_fields: {
        Row: {
          id: string;
          context_version_id: string;
          field_name: string;
          field_value: string;
          confidence_score: number;
          source_page_id: string | null;
          extraction_method: 'deterministic' | 'ai_inferred';
          created_at: string;
        };
        Insert: {
          id?: string;
          context_version_id: string;
          field_name: string;
          field_value: string;
          confidence_score: number;
          source_page_id?: string | null;
          extraction_method: 'deterministic' | 'ai_inferred';
          created_at?: string;
        };
        Update: {
          id?: string;
          context_version_id?: string;
          field_name?: string;
          field_value?: string;
          confidence_score?: number;
          source_page_id?: string | null;
          extraction_method?: 'deterministic' | 'ai_inferred';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_context_fields_context_version_id_fkey";
            columns: ["context_version_id"];
            isOneToOne: false;
            referencedRelation: "business_context_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_context_fields_source_page_id_fkey";
            columns: ["source_page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
