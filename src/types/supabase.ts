export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      post_images: {
        Row: {
          id: string
          post_id: string
          storage_path: string
          original_filename: string
          mime_type: string
          file_size: number
          width: number | null
          height: number | null
          alt_text: string | null
          display_order: number
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          storage_path: string
          original_filename: string
          mime_type: string
          file_size: number
          width?: number | null
          height?: number | null
          alt_text?: string | null
          display_order: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          storage_path?: string
          original_filename?: string
          mime_type?: string
          file_size?: number
          width?: number | null
          height?: number | null
          alt_text?: string | null
          display_order?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      challenges: {
        Row: {
          category: string | null
          created_at: string
          current_day: number | null
          description: string | null
          difficulty: string | null
          duration: number
          id: string
          participants: number | null
          progress: number | null
          reward: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_day?: number | null
          description?: string | null
          difficulty?: string | null
          duration: number
          id?: string
          participants?: number | null
          progress?: number | null
          reward?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_day?: number | null
          description?: string | null
          difficulty?: string | null
          duration?: number
          id?: string
          participants?: number | null
          progress?: number | null
          reward?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          deleted_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          post_id: string
          reply_to_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          post_id: string
          reply_to_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          post_id?: string
          reply_to_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          comment_count: number
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          like_count: number
          location: string | null
          media_urls: string[] | null
          post_type: string | null
          privacy: string | null
          share_count: number
          tags: string[] | null
          updated_at: string
          workout_data: Json | null
        }
        Insert: {
          author_id: string
          comment_count?: number
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          like_count?: number
          location?: string | null
          media_urls?: string[] | null
          post_type?: string | null
          privacy?: string | null
          share_count?: number
          tags?: string[] | null
          updated_at?: string
          workout_data?: Json | null
        }
        Update: {
          author_id?: string
          comment_count?: number
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          like_count?: number
          location?: string | null
          media_urls?: string[] | null
          post_type?: string | null
          privacy?: string | null
          share_count?: number
          tags?: string[] | null
          updated_at?: string
          workout_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
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
          deleted_at: string | null
          display_name: string
          fitness_level: string | null
          id: string
          is_verified: boolean | null
          location: string | null
          preferred_workout_types: string[] | null
          privacy_settings: Json | null
          role: string | null
          stats: Json | null
          timezone: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          fitness_level?: string | null
          id: string
          is_verified?: boolean | null
          location?: string | null
          preferred_workout_types?: string[] | null
          privacy_settings?: Json | null
          role?: string | null
          stats?: Json | null
          timezone?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          fitness_level?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          preferred_workout_types?: string[] | null
          privacy_settings?: Json | null
          role?: string | null
          stats?: Json | null
          timezone?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          category: string | null
          difficulty: string | null
          condition_type: string | null
          condition_value: Json | null
          unlocks_features: string[] | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          category?: string | null
          difficulty?: string | null
          condition_type?: string | null
          condition_value?: Json | null
          unlocks_features?: string[] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          category?: string | null
          difficulty?: string | null
          condition_type?: string | null
          condition_value?: Json | null
          unlocks_features?: string[] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      challenge_participations: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          status: string | null
          current_day: number | null
          completion_rate: number | null
          started_at: string | null
          paused_at: string | null
          resumed_at: string | null
          last_check_in: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          status?: string | null
          current_day?: number | null
          completion_rate?: number | null
          started_at?: string | null
          paused_at?: string | null
          resumed_at?: string | null
          last_check_in?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          status?: string | null
          current_day?: number | null
          completion_rate?: number | null
          started_at?: string | null
          paused_at?: string | null
          resumed_at?: string | null
          last_check_in?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_progress: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          day_number: number
          target_date: string | null
          status: string | null
          completed_at: string | null
          notes: string | null
          performance_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          day_number: number
          target_date?: string | null
          status?: string | null
          completed_at?: string | null
          notes?: string | null
          performance_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          day_number?: number
          target_date?: string | null
          status?: string | null
          completed_at?: string | null
          notes?: string | null
          performance_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      toggle_post_like: {
        Args: { p_post_id: string }
        Returns: boolean
      }
      update_post_like_count: {
        Args: { p_post_id: string }
        Returns: null
      }
      get_user_badges: {
        Args: { target_user_id: string }
        Returns: {
          badge_id: string
          badge_name: string
          badge_slug: string
          badge_icon: string | null
          badge_category: string | null
          earned_at: string
          personal_note: string | null
          stats: Json | null
        }[]
      }
      get_accessible_challenges: {
        Args: { target_user_id: string }
        Returns: Json[]
      }
      get_challenge_leaderboard: {
        Args: { target_challenge_id: string; limit_count?: number }
        Returns: {
          user_id: string
          display_name: string | null
          avatar_url: string | null
          fitness_level: string | null
          current_day: number | null
          completion_rate: number | null
        }[]
      }
      award_badge_to_user: {
        Args: {
          target_user_id: string
          badge_slug: string
          challenge_id: string
          user_note?: string | null
          achievement_stats?: Json | null
        }
        Returns: boolean
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

// 便利な型エイリアス
export type Post = Tables<'posts'>
export type Profile = Tables<'profiles'>
export type Challenge = Tables<'challenges'>
export type PostComment = Tables<'post_comments'>
export type PostLike = Tables<'post_likes'>
export type Follow = Tables<'follows'>
