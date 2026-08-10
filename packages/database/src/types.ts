export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_scans: {
        Row: {
          id: string
          project_id: string
          provider_id: string
          business_context_version_id: string | null
          prompt_library_id: string | null
          prompt_text: string
          status: Database["public"]["Enums"]["scan_status"]
          model_name: string | null
          raw_response: string | null
          response_json: Json | null
          is_mentioned: boolean | null
          mention_position: number | null
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          summary_markdown: string | null
          api_latency_ms: number | null
          input_tokens: number | null
          output_tokens: number | null
          estimated_cost: number | null
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          provider_id: string
          business_context_version_id?: string | null
          prompt_library_id?: string | null
          prompt_text: string
          status?: Database["public"]["Enums"]["scan_status"]
          model_name?: string | null
          raw_response?: string | null
          response_json?: Json | null
          is_mentioned?: boolean | null
          mention_position?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          summary_markdown?: string | null
          api_latency_ms?: number | null
          input_tokens?: number | null
          output_tokens?: number | null
          estimated_cost?: number | null
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          provider_id?: string
          business_context_version_id?: string | null
          prompt_library_id?: string | null
          prompt_text?: string
          status?: Database["public"]["Enums"]["scan_status"]
          model_name?: string | null
          raw_response?: string | null
          response_json?: Json | null
          is_mentioned?: boolean | null
          mention_position?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          summary_markdown?: string | null
          api_latency_ms?: number | null
          input_tokens?: number | null
          output_tokens?: number | null
          estimated_cost?: number | null
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ai_scans_context_version"
            columns: ["business_context_version_id"]
            isOneToOne: false
            referencedRelation: "business_context_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_scans_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_scans_prompt_library"
            columns: ["prompt_library_id"]
            isOneToOne: false
            referencedRelation: "prompt_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_scans_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          project_id: string | null
          actor_user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          actor_user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          actor_user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_audit_logs_actor"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_logs_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      business_context_versions: {
        Row: {
          id: string
          project_id: string
          industry: string | null
          description: string | null
          value_proposition: string | null
          target_audience: string[] | null
          extraction_method: Database["public"]["Enums"]["extraction_method"]
          confidence_score: number | null
          generated_at: string
          generation_duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          industry?: string | null
          description?: string | null
          value_proposition?: string | null
          target_audience?: string[] | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          confidence_score?: number | null
          generated_at?: string
          generation_duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          industry?: string | null
          description?: string | null
          value_proposition?: string | null
          target_audience?: string[] | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          confidence_score?: number | null
          generated_at?: string
          generation_duration_ms?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_business_context_versions_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      citations: {
        Row: {
          id: string
          ai_scan_id: string
          url: string
          title: string | null
          position: number
          is_own_domain: boolean
          created_at: string
          competitor_id: string | null
        }
        Insert: {
          id?: string
          ai_scan_id: string
          url: string
          title?: string | null
          position: number
          is_own_domain?: boolean
          created_at?: string
          competitor_id?: string | null
        }
        Update: {
          id?: string
          ai_scan_id?: string
          url?: string
          title?: string | null
          position?: number
          is_own_domain?: boolean
          created_at?: string
          competitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_citations_scan"
            columns: ["ai_scan_id"]
            isOneToOne: false
            referencedRelation: "ai_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citations_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          id: string
          project_id: string
          domain_id: string
          name: string
          source: Database["public"]["Enums"]["competitor_source"]
          status: Database["public"]["Enums"]["competitor_status"]
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          domain_id: string
          name: string
          source?: Database["public"]["Enums"]["competitor_source"]
          status?: Database["public"]["Enums"]["competitor_status"]
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          domain_id?: string
          name?: string
          source?: Database["public"]["Enums"]["competitor_source"]
          status?: Database["public"]["Enums"]["competitor_status"]
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_competitors_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_competitors_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crawl_errors: {
        Row: {
          id: string
          crawl_session_id: string
          page_id: string | null
          url: string
          error_type: string
          error_message: string | null
          http_status_code: number | null
          created_at: string
        }
        Insert: {
          id?: string
          crawl_session_id: string
          page_id?: string | null
          url: string
          error_type: string
          error_message?: string | null
          http_status_code?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          crawl_session_id?: string
          page_id?: string | null
          url?: string
          error_type?: string
          error_message?: string | null
          http_status_code?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_crawl_errors_session"
            columns: ["crawl_session_id"]
            isOneToOne: false
            referencedRelation: "crawl_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crawl_errors_page"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      crawl_sessions: {
        Row: {
          id: string
          project_id: string
          status: Database["public"]["Enums"]["crawl_status"]
          started_at: string
          completed_at: string | null
          pages_discovered: number
          pages_crawled: number
          error_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["crawl_status"]
          started_at?: string
          completed_at?: string | null
          pages_discovered?: number
          pages_crawled?: number
          error_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["crawl_status"]
          started_at?: string
          completed_at?: string | null
          pages_discovered?: number
          pages_crawled?: number
          error_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_crawl_sessions_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          id: string
          project_id: string
          host: string
          scheme: string
          is_primary: boolean
          is_verified: boolean
          verification_method: string | null
          verification_token: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          domain_type: Database["public"]["Enums"]["domain_type"]
        }
        Insert: {
          id?: string
          project_id: string
          host: string
          scheme?: string
          is_primary?: boolean
          is_verified?: boolean
          verification_method?: string | null
          verification_token?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          domain_type?: Database["public"]["Enums"]["domain_type"]
        }
        Update: {
          id?: string
          project_id?: string
          host?: string
          scheme?: string
          is_primary?: boolean
          is_verified?: boolean
          verification_method?: string | null
          verification_token?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          domain_type?: Database["public"]["Enums"]["domain_type"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_domains_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          id: string
          business_context_version_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          name: string
          description: string | null
          source_page_id: string | null
          extraction_method: Database["public"]["Enums"]["extraction_method"]
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          business_context_version_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          name: string
          description?: string | null
          source_page_id?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          business_context_version_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          name?: string
          description?: string | null
          source_page_id?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          confidence_score?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_entities_version"
            columns: ["business_context_version_id"]
            isOneToOne: false
            referencedRelation: "business_context_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_entities_source_page"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_mentions: {
        Row: {
          id: string
          tracked_entity_id: string
          ai_scan_id: string
          context_snippet: string | null
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          created_at: string
        }
        Insert: {
          id?: string
          tracked_entity_id: string
          ai_scan_id: string
          context_snippet?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          created_at?: string
        }
        Update: {
          id?: string
          tracked_entity_id?: string
          ai_scan_id?: string
          context_snippet?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_entity_mentions_scan"
            columns: ["ai_scan_id"]
            isOneToOne: false
            referencedRelation: "ai_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_entity_mentions_entity"
            columns: ["tracked_entity_id"]
            isOneToOne: false
            referencedRelation: "tracked_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          id: string
          project_id: string
          job_type: string
          status: Database["public"]["Enums"]["crawl_status"]
          resource_type: string | null
          resource_id: string | null
          progress: Json | null
          retry_count: number
          max_retries: number
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          job_type: string
          status?: Database["public"]["Enums"]["crawl_status"]
          resource_type?: string | null
          resource_id?: string | null
          progress?: Json | null
          retry_count?: number
          max_retries?: number
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          job_type?: string
          status?: Database["public"]["Enums"]["crawl_status"]
          resource_type?: string | null
          resource_id?: string | null
          progress?: Json | null
          retry_count?: number
          max_retries?: number
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_jobs_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      page_metadata: {
        Row: {
          id: string
          page_id: string
          title: string | null
          meta_description: string | null
          canonical_url: string | null
          language: string | null
          schema_json: Json | null
          open_graph: Json | null
          twitter_cards: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_id: string
          title?: string | null
          meta_description?: string | null
          canonical_url?: string | null
          language?: string | null
          schema_json?: Json | null
          open_graph?: Json | null
          twitter_cards?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          title?: string | null
          meta_description?: string | null
          canonical_url?: string | null
          language?: string | null
          schema_json?: Json | null
          open_graph?: Json | null
          twitter_cards?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_page_metadata_page"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          id: string
          project_id: string
          domain_id: string
          url: string
          path: string
          status_code: number | null
          content_type: string | null
          last_crawled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          domain_id: string
          url: string
          path: string
          status_code?: number | null
          content_type?: string | null
          last_crawled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          domain_id?: string
          url?: string
          path?: string
          status_code?: number | null
          content_type?: string | null
          last_crawled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pages_domain_project"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pages_domain_project"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fk_pages_domain_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fk_pages_domain_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          business_context_version_id: string
          name: string
          description: string | null
          category: string | null
          url: string | null
          source_page_id: string | null
          extraction_method: Database["public"]["Enums"]["extraction_method"]
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          business_context_version_id: string
          name: string
          description?: string | null
          category?: string | null
          url?: string | null
          source_page_id?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          business_context_version_id?: string
          name?: string
          description?: string | null
          category?: string | null
          url?: string | null
          source_page_id?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          confidence_score?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_version"
            columns: ["business_context_version_id"]
            isOneToOne: false
            referencedRelation: "business_context_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_source_page"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          description: string | null
          industry: string | null
          status: Database["public"]["Enums"]["project_status"]
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          description?: string | null
          industry?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          description?: string | null
          industry?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_library: {
        Row: {
          id: string
          project_id: string
          prompt_text: string
          category: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          prompt_text: string
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          prompt_text?: string
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prompt_library_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          id: string
          slug: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      recommendation_evidence: {
        Row: {
          id: string
          recommendation_id: string
          page_id: string | null
          ai_scan_id: string | null
          citation_id: string | null
          competitor_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recommendation_id: string
          page_id?: string | null
          ai_scan_id?: string | null
          citation_id?: string | null
          competitor_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recommendation_id?: string
          page_id?: string | null
          ai_scan_id?: string | null
          citation_id?: string | null
          competitor_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recommendation_evidence_scan"
            columns: ["ai_scan_id"]
            isOneToOne: false
            referencedRelation: "ai_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recommendation_evidence_citation"
            columns: ["citation_id"]
            isOneToOne: false
            referencedRelation: "citations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recommendation_evidence_competitor"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recommendation_evidence_page"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recommendation_evidence_recommendation"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          id: string
          project_id: string
          scan_id: string | null
          category: string
          title: string
          description: string | null
          impact_score: number
          effort_score: number
          priority: Database["public"]["Enums"]["recommendation_priority"]
          status: Database["public"]["Enums"]["recommendation_status"]
          scope_key: string
          generation_method: Database["public"]["Enums"]["extraction_method"]
          superseded_by: string | null
          resolved_by_scan_id: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          scan_id?: string | null
          category: string
          title: string
          description?: string | null
          impact_score: number
          effort_score: number
          priority: Database["public"]["Enums"]["recommendation_priority"]
          status?: Database["public"]["Enums"]["recommendation_status"]
          scope_key: string
          generation_method?: Database["public"]["Enums"]["extraction_method"]
          superseded_by?: string | null
          resolved_by_scan_id?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          scan_id?: string | null
          category?: string
          title?: string
          description?: string | null
          impact_score?: number
          effort_score?: number
          priority?: Database["public"]["Enums"]["recommendation_priority"]
          status?: Database["public"]["Enums"]["recommendation_status"]
          scope_key?: string
          generation_method?: Database["public"]["Enums"]["extraction_method"]
          superseded_by?: string | null
          resolved_by_scan_id?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recommendations_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recommendations_resolved_by_scan"
            columns: ["resolved_by_scan_id"]
            isOneToOne: false
            referencedRelation: "ai_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recommendations_scan"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "ai_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recommendations_superseded_by"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          id: string
          project_id: string
          scan_id: string | null
          report_type: string
          status: Database["public"]["Enums"]["report_status"]
          file_format: Database["public"]["Enums"]["report_file_format"]
          report_version: number
          date_range_start: string | null
          date_range_end: string | null
          file_path: string | null
          file_size_bytes: number | null
          generated_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          scan_id?: string | null
          report_type: string
          status?: Database["public"]["Enums"]["report_status"]
          file_format?: Database["public"]["Enums"]["report_file_format"]
          report_version?: number
          date_range_start?: string | null
          date_range_end?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          generated_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          scan_id?: string | null
          report_type?: string
          status?: Database["public"]["Enums"]["report_status"]
          file_format?: Database["public"]["Enums"]["report_file_format"]
          report_version?: number
          date_range_start?: string | null
          date_range_end?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          generated_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reports_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reports_scan"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "ai_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      robots_files: {
        Row: {
          id: string
          domain_id: string
          raw_content: string | null
          is_accessible: boolean
          fetched_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain_id: string
          raw_content?: string | null
          is_accessible?: boolean
          fetched_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain_id?: string
          raw_content?: string | null
          is_accessible?: boolean
          fetched_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_robots_files_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          id: string
          business_context_version_id: string
          name: string
          description: string | null
          category: string | null
          url: string | null
          source_page_id: string | null
          extraction_method: Database["public"]["Enums"]["extraction_method"]
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          business_context_version_id: string
          name: string
          description?: string | null
          category?: string | null
          url?: string | null
          source_page_id?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          business_context_version_id?: string
          name?: string
          description?: string | null
          category?: string | null
          url?: string | null
          source_page_id?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          confidence_score?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_version"
            columns: ["business_context_version_id"]
            isOneToOne: false
            referencedRelation: "business_context_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_source_page"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      sitemaps: {
        Row: {
          id: string
          domain_id: string
          url: string
          url_count: number | null
          last_fetched_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain_id: string
          url: string
          url_count?: number | null
          last_fetched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain_id?: string
          url?: string
          url_count?: number | null
          last_fetched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sitemaps_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      technologies: {
        Row: {
          id: string
          domain_id: string
          name: string
          category: string | null
          source_page_id: string | null
          detected_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain_id: string
          name: string
          category?: string | null
          source_page_id?: string | null
          detected_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain_id?: string
          name?: string
          category?: string | null
          source_page_id?: string | null
          detected_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_technologies_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_technologies_source_page"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          id: string
          business_context_version_id: string
          name: string
          relevance_score: number | null
          source_page_id: string | null
          extraction_method: Database["public"]["Enums"]["extraction_method"]
          created_at: string
        }
        Insert: {
          id?: string
          business_context_version_id: string
          name: string
          relevance_score?: number | null
          source_page_id?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          created_at?: string
        }
        Update: {
          id?: string
          business_context_version_id?: string
          name?: string
          relevance_score?: number | null
          source_page_id?: string | null
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_topics_version"
            columns: ["business_context_version_id"]
            isOneToOne: false
            referencedRelation: "business_context_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_topics_source_page"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_entities: {
        Row: {
          id: string
          name: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      users: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          is_onboarded: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          is_onboarded?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          is_onboarded?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_next_job: {
        Args: {
          p_job_type?: string | null
          p_project_id?: string | null
        }
        Returns: Database["public"]["Tables"]["jobs"]["Row"][]
      }
      create_project_with_domain: {
        Args: {
          p_name: string | null
          p_host: string | null
        }
        Returns: string
      }
    }
    Enums: {
      competitor_source: "user_added" | "ai_suggested"
      competitor_status: "suggested" | "confirmed" | "dismissed"
      crawl_status: "queued" | "running" | "completed" | "failed" | "cancelled"
      domain_type: "own" | "competitor"
      entity_type: "organization" | "person" | "brand" | "location" | "other"
      extraction_method: "deterministic" | "ai_assisted"
      project_status: "active" | "archived"
      recommendation_priority: "low" | "medium" | "high" | "critical"
      recommendation_status: "open" | "in_progress" | "resolved" | "dismissed"
      report_file_format: "pdf" | "html" | "json"
      report_status: "pending" | "generating" | "completed" | "failed"
      scan_status: "queued" | "running" | "completed" | "failed" | "cancelled"
      sentiment_type: "positive" | "neutral" | "negative"
      user_role: "user" | "admin" | "owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
