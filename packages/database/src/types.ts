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
          domain_type: 'own' | 'competitor';
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
          domain_type?: 'own' | 'competitor';
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
          domain_type?: 'own' | 'competitor';
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
      prompt_library: {
        Row: {
          id: string;
          project_id: string;
          prompt_text: string;
          intent: string;
          source_fields: string[] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          prompt_text: string;
          intent: string;
          source_fields?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          prompt_text?: string;
          intent?: string;
          source_fields?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_library_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      scans: {
        Row: {
          id: string;
          project_id: string;
          prompt_id: string | null;
          query_prompt: string;
          ai_model: string;
          status: string;
          visibility_score: number | null;
          summary: string | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          prompt_id?: string | null;
          query_prompt: string;
          ai_model: string;
          status?: string;
          visibility_score?: number | null;
          summary?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          prompt_id?: string | null;
          query_prompt?: string;
          ai_model?: string;
          status?: string;
          visibility_score?: number | null;
          summary?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scans_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scans_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompt_library";
            referencedColumns: ["id"];
          },
        ];
      };
      page_scans: {
        Row: {
          id: string;
          scan_id: string;
          page_id: string;
          sentiment_score: number | null;
          rank_position: number | null;
          snippet_extracted: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scan_id: string;
          page_id: string;
          sentiment_score?: number | null;
          rank_position?: number | null;
          snippet_extracted?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scan_id?: string;
          page_id?: string;
          sentiment_score?: number | null;
          rank_position?: number | null;
          snippet_extracted?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_scans_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "page_scans_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      competitors: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          domain_name: string;
          domain_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          domain_name: string;
          domain_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          domain_name?: string;
          domain_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "competitors_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competitors_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
        ];
      };
      competitor_scans: {
        Row: {
          id: string;
          competitor_id: string;
          scan_id: string;
          visibility_score: number | null;
          mention_count: number;
          rank_position: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          competitor_id: string;
          scan_id: string;
          visibility_score?: number | null;
          mention_count?: number;
          rank_position?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          competitor_id?: string;
          scan_id?: string;
          visibility_score?: number | null;
          mention_count?: number;
          rank_position?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "competitor_scans_competitor_id_fkey";
            columns: ["competitor_id"];
            isOneToOne: false;
            referencedRelation: "competitors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competitor_scans_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
        ];
      };
      citations: {
        Row: {
          id: string;
          scan_id: string;
          competitor_id: string | null;
          source_url: string;
          source_domain: string;
          anchor_text: string | null;
          citation_order: number | null;
          is_own_domain: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scan_id: string;
          competitor_id?: string | null;
          source_url: string;
          source_domain: string;
          anchor_text?: string | null;
          citation_order?: number | null;
          is_own_domain?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scan_id?: string;
          competitor_id?: string | null;
          source_url?: string;
          source_domain?: string;
          anchor_text?: string | null;
          citation_order?: number | null;
          is_own_domain?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "citations_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "citations_competitor_id_fkey";
            columns: ["competitor_id"];
            isOneToOne: false;
            referencedRelation: "competitors";
            referencedColumns: ["id"];
          },
        ];
      };
      entities: {
        Row: {
          id: string;
          name: string;
          entity_type: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          entity_type?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          entity_type?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entity_mentions: {
        Row: {
          id: string;
          entity_id: string;
          scan_id: string | null;
          page_id: string | null;
          context_snippet: string | null;
          sentiment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_id: string;
          scan_id?: string | null;
          page_id?: string | null;
          context_snippet?: string | null;
          sentiment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity_id?: string;
          scan_id?: string | null;
          page_id?: string | null;
          context_snippet?: string | null;
          sentiment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entity_mentions_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entity_mentions_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entity_mentions_page_id_fkey";
            columns: ["page_id"];
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
