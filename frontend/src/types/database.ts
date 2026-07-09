export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'user' | 'admin' | 'moderator';
export type ProblemPlatform = 'leetcode' | 'codeforces' | 'hackerrank' | 'atcoder' | 'other';
export type ProblemStatus = 'unsolved' | 'attempted' | 'solved';
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';
export type NotificationType =
  | 'system'
  | 'friend_request'
  | 'achievement'
  | 'contest'
  | 'reminder'
  | 'message'
  | 'recommendation';
export type ContestPlatform = 'codeforces' | 'leetcode' | 'atcoder' | 'other';
export type ProfileVisibility = 'public' | 'friends' | 'private';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          avatar: string | null;
          bio: string | null;
          role: UserRole;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          avatar?: string | null;
          bio?: string | null;
          role?: UserRole;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          avatar?: string | null;
          bio?: string | null;
          role?: UserRole;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      refresh_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'refresh_tokens_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      email_verifications: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          token: string;
          expires_at: string;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          token: string;
          expires_at: string;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          token?: string;
          expires_at?: string;
          verified_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'email_verifications_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      password_resets: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'password_resets_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      github_profiles: {
        Row: {
          id: string;
          user_id: string;
          github_id: number;
          username: string;
          avatar: string | null;
          followers: number;
          following: number;
          public_repos: number;
          total_stars: number;
          total_commits: number;
          contribution_streak: number;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          github_id: number;
          username: string;
          avatar?: string | null;
          followers?: number;
          following?: number;
          public_repos?: number;
          total_stars?: number;
          total_commits?: number;
          contribution_streak?: number;
          synced_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          github_id?: number;
          username?: string;
          avatar?: string | null;
          followers?: number;
          following?: number;
          public_repos?: number;
          total_stars?: number;
          total_commits?: number;
          contribution_streak?: number;
          synced_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'github_profiles_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      leetcode_profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          ranking: number | null;
          contest_rating: number | null;
          problems_solved: number;
          easy: number;
          medium: number;
          hard: number;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          ranking?: number | null;
          contest_rating?: number | null;
          problems_solved?: number;
          easy?: number;
          medium?: number;
          hard?: number;
          synced_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          ranking?: number | null;
          contest_rating?: number | null;
          problems_solved?: number;
          easy?: number;
          medium?: number;
          hard?: number;
          synced_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'leetcode_profiles_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      codeforces_profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          ranking: number | null;
          max_rating: number | null;
          contest_rating: number | null;
          problems_solved: number;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          ranking?: number | null;
          max_rating?: number | null;
          contest_rating?: number | null;
          problems_solved?: number;
          synced_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          ranking?: number | null;
          max_rating?: number | null;
          contest_rating?: number | null;
          problems_solved?: number;
          synced_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'codeforces_profiles_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      repositories: {
        Row: {
          id: string;
          github_profile_id: string;
          repo_name: string;
          language: string | null;
          stars: number;
          forks: number;
          open_issues: number;
          commits: number;
          health_score: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          github_profile_id: string;
          repo_name: string;
          language?: string | null;
          stars?: number;
          forks?: number;
          open_issues?: number;
          commits?: number;
          health_score?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          github_profile_id?: string;
          repo_name?: string;
          language?: string | null;
          stars?: number;
          forks?: number;
          open_issues?: number;
          commits?: number;
          health_score?: number | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'repositories_github_profile_id_fkey'; columns: ['github_profile_id']; referencedRelation: 'github_profiles'; referencedColumns: ['id'] },
        ];
      };
      languages: {
        Row: { id: string; name: string; color: string | null };
        Insert: { id?: string; name: string; color?: string | null };
        Update: { id?: string; name?: string; color?: string | null };
        Relationships: [];
      };
      repository_languages: {
        Row: {
          repository_id: string;
          language_id: string;
          bytes: number;
          percentage: number | null;
        };
        Insert: {
          repository_id: string;
          language_id: string;
          bytes?: number;
          percentage?: number | null;
        };
        Update: {
          repository_id?: string;
          language_id?: string;
          bytes?: number;
          percentage?: number | null;
        };
        Relationships: [
          { foreignKeyName: 'repository_languages_repository_id_fkey'; columns: ['repository_id']; referencedRelation: 'repositories'; referencedColumns: ['id'] },
          { foreignKeyName: 'repository_languages_language_id_fkey'; columns: ['language_id']; referencedRelation: 'languages'; referencedColumns: ['id'] },
        ];
      };
      commit_history: {
        Row: {
          id: string;
          github_profile_id: string;
          repository_id: string | null;
          commit_date: string;
          commit_count: number;
        };
        Insert: {
          id?: string;
          github_profile_id: string;
          repository_id?: string | null;
          commit_date: string;
          commit_count?: number;
        };
        Update: {
          id?: string;
          github_profile_id?: string;
          repository_id?: string | null;
          commit_date?: string;
          commit_count?: number;
        };
        Relationships: [
          { foreignKeyName: 'commit_history_github_profile_id_fkey'; columns: ['github_profile_id']; referencedRelation: 'github_profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'commit_history_repository_id_fkey'; columns: ['repository_id']; referencedRelation: 'repositories'; referencedColumns: ['id'] },
        ];
      };
      problems: {
        Row: {
          id: string;
          platform: ProblemPlatform;
          title: string;
          slug: string;
          difficulty: string | null;
          acceptance: number | null;
          url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          platform: ProblemPlatform;
          title: string;
          slug: string;
          difficulty?: string | null;
          acceptance?: number | null;
          url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          platform?: ProblemPlatform;
          title?: string;
          slug?: string;
          difficulty?: string | null;
          acceptance?: number | null;
          url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: { id: string; name: string };
        Insert: { id?: string; name: string };
        Update: { id?: string; name?: string };
        Relationships: [];
      };
      problem_tags: {
        Row: { problem_id: string; tag_id: string };
        Insert: { problem_id: string; tag_id: string };
        Update: { problem_id?: string; tag_id?: string };
        Relationships: [
          { foreignKeyName: 'problem_tags_problem_id_fkey'; columns: ['problem_id']; referencedRelation: 'problems'; referencedColumns: ['id'] },
          { foreignKeyName: 'problem_tags_tag_id_fkey'; columns: ['tag_id']; referencedRelation: 'tags'; referencedColumns: ['id'] },
        ];
      };
      user_problem_history: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          status: ProblemStatus;
          attempts: number;
          solved_time: number | null;
          bookmarked: boolean;
          solved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          status?: ProblemStatus;
          attempts?: number;
          solved_time?: number | null;
          bookmarked?: boolean;
          solved_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          status?: ProblemStatus;
          attempts?: number;
          solved_time?: number | null;
          bookmarked?: boolean;
          solved_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'user_problem_history_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'user_problem_history_problem_id_fkey'; columns: ['problem_id']; referencedRelation: 'problems'; referencedColumns: ['id'] },
        ];
      };
      contests: {
        Row: {
          id: string;
          platform: ContestPlatform;
          name: string;
          slug: string | null;
          start_time: string | null;
          duration: number | null;
          url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          platform: ContestPlatform;
          name: string;
          slug?: string | null;
          start_time?: string | null;
          duration?: number | null;
          url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          platform?: ContestPlatform;
          name?: string;
          slug?: string | null;
          start_time?: string | null;
          duration?: number | null;
          url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      contest_history: {
        Row: {
          id: string;
          contest_id: string;
          user_id: string;
          rank: number | null;
          old_rating: number | null;
          new_rating: number | null;
          solved: number;
          penalty: number;
          date: string;
        };
        Insert: {
          id?: string;
          contest_id: string;
          user_id: string;
          rank?: number | null;
          old_rating?: number | null;
          new_rating?: number | null;
          solved?: number;
          penalty?: number;
          date?: string;
        };
        Update: {
          id?: string;
          contest_id?: string;
          user_id?: string;
          rank?: number | null;
          old_rating?: number | null;
          new_rating?: number | null;
          solved?: number;
          penalty?: number;
          date?: string;
        };
        Relationships: [
          { foreignKeyName: 'contest_history_contest_id_fkey'; columns: ['contest_id']; referencedRelation: 'contests'; referencedColumns: ['id'] },
          { foreignKeyName: 'contest_history_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      contest_predictions: {
        Row: {
          id: string;
          user_id: string;
          contest_id: string;
          predicted_rank: number | null;
          predicted_rating: number | null;
          confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contest_id: string;
          predicted_rank?: number | null;
          predicted_rating?: number | null;
          confidence?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contest_id?: string;
          predicted_rank?: number | null;
          predicted_rating?: number | null;
          confidence?: number | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'contest_predictions_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'contest_predictions_contest_id_fkey'; columns: ['contest_id']; referencedRelation: 'contests'; referencedColumns: ['id'] },
        ];
      };
      daily_stats: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          problems_solved: number;
          contests_played: number;
          commits: number;
          xp_earned: number;
          study_minutes: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          problems_solved?: number;
          contests_played?: number;
          commits?: number;
          xp_earned?: number;
          study_minutes?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          problems_solved?: number;
          contests_played?: number;
          commits?: number;
          xp_earned?: number;
          study_minutes?: number;
        };
        Relationships: [
          { foreignKeyName: 'daily_stats_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      weekly_stats: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          problems_solved: number;
          contests_played: number;
          commits: number;
          xp_earned: number;
          study_minutes: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          problems_solved?: number;
          contests_played?: number;
          commits?: number;
          xp_earned?: number;
          study_minutes?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          problems_solved?: number;
          contests_played?: number;
          commits?: number;
          xp_earned?: number;
          study_minutes?: number;
        };
        Relationships: [
          { foreignKeyName: 'weekly_stats_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      monthly_stats: {
        Row: {
          id: string;
          user_id: string;
          month_start: string;
          problems_solved: number;
          contests_played: number;
          commits: number;
          xp_earned: number;
          study_minutes: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          month_start: string;
          problems_solved?: number;
          contests_played?: number;
          commits?: number;
          xp_earned?: number;
          study_minutes?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          month_start?: string;
          problems_solved?: number;
          contests_played?: number;
          commits?: number;
          xp_earned?: number;
          study_minutes?: number;
        };
        Relationships: [
          { foreignKeyName: 'monthly_stats_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      topic_mastery: {
        Row: {
          user_id: string;
          topic: string;
          solved: number;
          accuracy: number;
          mastery_score: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          topic: string;
          solved?: number;
          accuracy?: number;
          mastery_score?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          topic?: string;
          solved?: number;
          accuracy?: number;
          mastery_score?: number;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'topic_mastery_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      ai_reports: {
        Row: { id: string; user_id: string; report: Json; created_at: string };
        Insert: { id?: string; user_id: string; report: Json; created_at?: string };
        Update: { id?: string; user_id?: string; report?: Json; created_at?: string };
        Relationships: [
          { foreignKeyName: 'ai_reports_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      recommendations: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          reason: string | null;
          priority: number;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          reason?: string | null;
          priority?: number;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          reason?: string | null;
          priority?: number;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'recommendations_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'recommendations_problem_id_fkey'; columns: ['problem_id']; referencedRelation: 'problems'; referencedColumns: ['id'] },
        ];
      };
      learning_paths: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          progress: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          progress?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          progress?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'learning_paths_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      roadmaps: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          progress: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          progress?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          progress?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'roadmaps_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      roadmap_steps: {
        Row: {
          id: string;
          roadmap_id: string;
          title: string;
          description: string | null;
          step_order: number;
          completed: boolean;
          problem_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          roadmap_id: string;
          title: string;
          description?: string | null;
          step_order: number;
          completed?: boolean;
          problem_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          roadmap_id?: string;
          title?: string;
          description?: string | null;
          step_order?: number;
          completed?: boolean;
          problem_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'roadmap_steps_roadmap_id_fkey'; columns: ['roadmap_id']; referencedRelation: 'roadmaps'; referencedColumns: ['id'] },
          { foreignKeyName: 'roadmap_steps_problem_id_fkey'; columns: ['problem_id']; referencedRelation: 'problems'; referencedColumns: ['id'] },
        ];
      };
      friends: {
        Row: { user_id: string; friend_id: string; created_at: string };
        Insert: { user_id: string; friend_id: string; created_at?: string };
        Update: { user_id?: string; friend_id?: string; created_at?: string };
        Relationships: [
          { foreignKeyName: 'friends_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'friends_friend_id_fkey'; columns: ['friend_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      friend_requests: {
        Row: {
          id: string;
          sender: string;
          receiver: string;
          status: FriendRequestStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender: string;
          receiver: string;
          status?: FriendRequestStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender?: string;
          receiver?: string;
          status?: FriendRequestStatus;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'friend_requests_sender_fkey'; columns: ['sender']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'friend_requests_receiver_fkey'; columns: ['receiver']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      conversations: {
        Row: { id: string; created_at: string; updated_at: string };
        Insert: { id?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      conversation_participants: {
        Row: { conversation_id: string; user_id: string; joined_at: string };
        Insert: { conversation_id: string; user_id: string; joined_at?: string };
        Update: { conversation_id?: string; user_id?: string; joined_at?: string };
        Relationships: [
          { foreignKeyName: 'conversation_participants_conversation_id_fkey'; columns: ['conversation_id']; referencedRelation: 'conversations'; referencedColumns: ['id'] },
          { foreignKeyName: 'conversation_participants_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          message: string;
          is_read: boolean;
          sent_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          message: string;
          is_read?: boolean;
          sent_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          message?: string;
          is_read?: boolean;
          sent_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'messages_conversation_id_fkey'; columns: ['conversation_id']; referencedRelation: 'conversations'; referencedColumns: ['id'] },
          { foreignKeyName: 'messages_sender_id_fkey'; columns: ['sender_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          type: NotificationType;
          read: boolean;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body?: string | null;
          type?: NotificationType;
          read?: boolean;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string | null;
          type?: NotificationType;
          read?: boolean;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'notifications_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          criteria: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          criteria?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          criteria?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_badges: {
        Row: { user_id: string; badge_id: string; earned_at: string };
        Insert: { user_id: string; badge_id: string; earned_at?: string };
        Update: { user_id?: string; badge_id?: string; earned_at?: string };
        Relationships: [
          { foreignKeyName: 'user_badges_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'user_badges_badge_id_fkey'; columns: ['badge_id']; referencedRelation: 'badges'; referencedColumns: ['id'] },
        ];
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          xp_reward: number;
          criteria: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          xp_reward?: number;
          criteria?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          xp_reward?: number;
          criteria?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: { user_id: string; achievement_id: string; earned_at: string };
        Insert: { user_id: string; achievement_id: string; earned_at?: string };
        Update: { user_id?: string; achievement_id?: string; earned_at?: string };
        Relationships: [
          { foreignKeyName: 'user_achievements_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'user_achievements_achievement_id_fkey'; columns: ['achievement_id']; referencedRelation: 'achievements'; referencedColumns: ['id'] },
        ];
      };
      levels: {
        Row: { level_number: number; xp_required: number; title: string | null };
        Insert: { level_number: number; xp_required: number; title?: string | null };
        Update: { level_number?: number; xp_required?: number; title?: string | null };
        Relationships: [];
      };
      xp_history: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          reason?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          reason?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'xp_history_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          goal: string;
          target: number;
          progress: number;
          deadline: string | null;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal: string;
          target: number;
          progress?: number;
          deadline?: string | null;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal?: string;
          target?: number;
          progress?: number;
          deadline?: string | null;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'goals_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      bookmarks: {
        Row: { user_id: string; problem_id: string; created_at: string };
        Insert: { user_id: string; problem_id: string; created_at?: string };
        Update: { user_id?: string; problem_id?: string; created_at?: string };
        Relationships: [
          { foreignKeyName: 'bookmarks_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'bookmarks_problem_id_fkey'; columns: ['problem_id']; referencedRelation: 'problems'; referencedColumns: ['id'] },
        ];
      };
      user_settings: {
        Row: {
          user_id: string;
          theme: ThemePreference;
          email_notifications: boolean;
          profile_visibility: ProfileVisibility;
          language: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: ThemePreference;
          email_notifications?: boolean;
          profile_visibility?: ProfileVisibility;
          language?: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme?: ThemePreference;
          email_notifications?: boolean;
          profile_visibility?: ProfileVisibility;
          language?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'user_settings_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      dashboard_summary: {
        Row: {
          user_id: string;
          total_solved: number;
          contest_rating: number;
          github_score: number;
          streak: number;
          weekly_progress: Json | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_solved?: number;
          contest_rating?: number;
          github_score?: number;
          streak?: number;
          weekly_progress?: Json | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_solved?: number;
          contest_rating?: number;
          github_score?: number;
          streak?: number;
          weekly_progress?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'dashboard_summary_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'audit_logs_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      problem_platform: ProblemPlatform;
      problem_status: ProblemStatus;
      friend_request_status: FriendRequestStatus;
      notification_type: NotificationType;
      contest_platform: ContestPlatform;
      profile_visibility: ProfileVisibility;
      theme_preference: ThemePreference;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type User = Tables<'users'>;
export type Problem = Tables<'problems'>;
export type Goal = Tables<'goals'>;
export type Notification = Tables<'notifications'>;
export type DashboardSummary = Tables<'dashboard_summary'>;
export type UserSettings = Tables<'user_settings'>;
