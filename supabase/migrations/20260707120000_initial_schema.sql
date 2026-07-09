-- TrackCode / Jarvis — Initial Database Schema
-- PostgreSQL (Supabase)

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE problem_platform AS ENUM ('leetcode', 'codeforces', 'hackerrank', 'atcoder', 'other');
CREATE TYPE problem_status AS ENUM ('unsolved', 'attempted', 'solved');
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE notification_type AS ENUM (
  'system', 'friend_request', 'achievement', 'contest', 'reminder', 'message', 'recommendation'
);
CREATE TYPE contest_platform AS ENUM ('codeforces', 'leetcode', 'atcoder', 'other');
CREATE TYPE profile_visibility AS ENUM ('public', 'friends', 'private');
CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');

-- =============================================================================
-- UTILITY: updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 👤 AUTHENTICATION MODULE
-- =============================================================================

-- Extends Supabase auth.users (id matches auth.users.id)
CREATE TABLE public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  avatar          TEXT,
  bio             TEXT,
  role            user_role NOT NULL DEFAULT 'user',
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE public.refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.email_verifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.password_resets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create public.users row on Supabase auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, avatar, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar',
    NEW.email_confirmed_at IS NOT NULL
  );
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  INSERT INTO public.dashboard_summary (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 🔗 CONNECTED ACCOUNTS
-- =============================================================================

CREATE TABLE public.github_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  github_id             BIGINT NOT NULL UNIQUE,
  username              TEXT NOT NULL,
  avatar                TEXT,
  followers             INTEGER NOT NULL DEFAULT 0,
  following             INTEGER NOT NULL DEFAULT 0,
  public_repos          INTEGER NOT NULL DEFAULT 0,
  total_stars           INTEGER NOT NULL DEFAULT 0,
  total_commits         INTEGER NOT NULL DEFAULT 0,
  contribution_streak   INTEGER NOT NULL DEFAULT 0,
  synced_at             TIMESTAMPTZ
);

CREATE TABLE public.leetcode_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL,
  ranking         INTEGER,
  contest_rating  INTEGER,
  problems_solved INTEGER NOT NULL DEFAULT 0,
  easy            INTEGER NOT NULL DEFAULT 0,
  medium          INTEGER NOT NULL DEFAULT 0,
  hard            INTEGER NOT NULL DEFAULT 0,
  synced_at       TIMESTAMPTZ
);

CREATE TABLE public.codeforces_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL,
  ranking         INTEGER,
  max_rating      INTEGER,
  contest_rating  INTEGER,
  problems_solved INTEGER NOT NULL DEFAULT 0,
  synced_at       TIMESTAMPTZ
);

-- =============================================================================
-- 📁 GITHUB ANALYTICS
-- =============================================================================

CREATE TABLE public.repositories (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_profile_id UUID NOT NULL REFERENCES public.github_profiles(id) ON DELETE CASCADE,
  repo_name         TEXT NOT NULL,
  language          TEXT,
  stars             INTEGER NOT NULL DEFAULT 0,
  forks             INTEGER NOT NULL DEFAULT 0,
  open_issues       INTEGER NOT NULL DEFAULT 0,
  commits           INTEGER NOT NULL DEFAULT 0,
  health_score      NUMERIC(5, 2),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (github_profile_id, repo_name)
);

CREATE TRIGGER repositories_updated_at
  BEFORE UPDATE ON public.repositories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE public.languages (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  TEXT NOT NULL UNIQUE,
  color TEXT
);

CREATE TABLE public.repository_languages (
  repository_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  language_id   UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  bytes         BIGINT NOT NULL DEFAULT 0,
  percentage    NUMERIC(5, 2),
  PRIMARY KEY (repository_id, language_id)
);

CREATE TABLE public.commit_history (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_profile_id UUID NOT NULL REFERENCES public.github_profiles(id) ON DELETE CASCADE,
  repository_id     UUID REFERENCES public.repositories(id) ON DELETE SET NULL,
  commit_date       DATE NOT NULL,
  commit_count      INTEGER NOT NULL DEFAULT 0,
  UNIQUE (github_profile_id, repository_id, commit_date)
);

-- =============================================================================
-- 📚 PROBLEMS
-- =============================================================================

CREATE TABLE public.problems (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform    problem_platform NOT NULL,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  difficulty  TEXT,
  acceptance  NUMERIC(5, 2),
  url         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, slug)
);

CREATE TABLE public.tags (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE public.problem_tags (
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, tag_id)
);

CREATE TABLE public.user_problem_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  problem_id  UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  status      problem_status NOT NULL DEFAULT 'unsolved',
  attempts    INTEGER NOT NULL DEFAULT 0,
  solved_time INTEGER,
  bookmarked  BOOLEAN NOT NULL DEFAULT FALSE,
  solved_at   TIMESTAMPTZ,
  UNIQUE (user_id, problem_id)
);

-- =============================================================================
-- 🏆 CONTEST
-- =============================================================================

CREATE TABLE public.contests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform    contest_platform NOT NULL,
  name        TEXT NOT NULL,
  slug        TEXT,
  start_time  TIMESTAMPTZ,
  duration    INTEGER,
  url         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.contest_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id  UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rank        INTEGER,
  old_rating  INTEGER,
  new_rating  INTEGER,
  solved      INTEGER NOT NULL DEFAULT 0,
  penalty     INTEGER NOT NULL DEFAULT 0,
  date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contest_id, user_id)
);

CREATE TABLE public.contest_predictions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contest_id      UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  predicted_rank  INTEGER,
  predicted_rating INTEGER,
  confidence      NUMERIC(5, 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, contest_id)
);

-- =============================================================================
-- 📈 ANALYTICS
-- =============================================================================

CREATE TABLE public.daily_stats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  problems_solved INTEGER NOT NULL DEFAULT 0,
  contests_played INTEGER NOT NULL DEFAULT 0,
  commits         INTEGER NOT NULL DEFAULT 0,
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  study_minutes   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

CREATE TABLE public.weekly_stats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start      DATE NOT NULL,
  problems_solved INTEGER NOT NULL DEFAULT 0,
  contests_played INTEGER NOT NULL DEFAULT 0,
  commits         INTEGER NOT NULL DEFAULT 0,
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  study_minutes   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, week_start)
);

CREATE TABLE public.monthly_stats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month_start     DATE NOT NULL,
  problems_solved INTEGER NOT NULL DEFAULT 0,
  contests_played INTEGER NOT NULL DEFAULT 0,
  commits         INTEGER NOT NULL DEFAULT 0,
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  study_minutes   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, month_start)
);

CREATE TABLE public.topic_mastery (
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic         TEXT NOT NULL,
  solved        INTEGER NOT NULL DEFAULT 0,
  accuracy      NUMERIC(5, 2) NOT NULL DEFAULT 0,
  mastery_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, topic)
);

CREATE TRIGGER topic_mastery_updated_at
  BEFORE UPDATE ON public.topic_mastery
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 🤖 AI MODULE
-- =============================================================================

CREATE TABLE public.ai_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report      JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.recommendations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  problem_id  UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  reason      TEXT,
  priority    INTEGER NOT NULL DEFAULT 0,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.learning_paths (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  progress    NUMERIC(5, 2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.roadmaps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  progress    NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.roadmap_steps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id  UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  step_order  INTEGER NOT NULL,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  problem_id  UUID REFERENCES public.problems(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 👥 SOCIAL MODULE
-- =============================================================================

CREATE TABLE public.friends (
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id),
  CONSTRAINT no_self_friend CHECK (user_id <> friend_id)
);

CREATE TABLE public.friend_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status      friend_request_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sender, receiver),
  CONSTRAINT no_self_request CHECK (sender <> receiver)
);

CREATE TABLE public.conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 🔔 NOTIFICATIONS
-- =============================================================================

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT,
  type        notification_type NOT NULL DEFAULT 'system',
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 🎖️ GAMIFICATION
-- =============================================================================

CREATE TABLE public.badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,
  criteria    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_badges (
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE public.achievements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,
  xp_reward   INTEGER NOT NULL DEFAULT 0,
  criteria    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_achievements (
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE public.levels (
  level_number INTEGER PRIMARY KEY,
  xp_required  INTEGER NOT NULL,
  title        TEXT
);

CREATE TABLE public.xp_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  reason      TEXT,
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 🎯 GOALS
-- =============================================================================

CREATE TABLE public.goals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal        TEXT NOT NULL,
  target      INTEGER NOT NULL,
  progress    INTEGER NOT NULL DEFAULT 0,
  deadline    TIMESTAMPTZ,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 🔖 BOOKMARKS
-- =============================================================================

CREATE TABLE public.bookmarks (
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, problem_id)
);

-- =============================================================================
-- ⚙️ USER SETTINGS
-- =============================================================================

CREATE TABLE public.user_settings (
  user_id              UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  theme                theme_preference NOT NULL DEFAULT 'system',
  email_notifications  BOOLEAN NOT NULL DEFAULT TRUE,
  profile_visibility   profile_visibility NOT NULL DEFAULT 'public',
  language             TEXT NOT NULL DEFAULT 'en',
  timezone             TEXT NOT NULL DEFAULT 'UTC',
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 📊 DASHBOARD CACHE
-- =============================================================================

CREATE TABLE public.dashboard_summary (
  user_id          UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_solved     INTEGER NOT NULL DEFAULT 0,
  contest_rating   INTEGER NOT NULL DEFAULT 0,
  github_score     NUMERIC(5, 2) NOT NULL DEFAULT 0,
  streak           INTEGER NOT NULL DEFAULT 0,
  weekly_progress  JSONB,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER dashboard_summary_updated_at
  BEFORE UPDATE ON public.dashboard_summary
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 🔍 AUDIT LOGS
-- =============================================================================

CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX idx_password_resets_user_id ON public.password_resets(user_id);

CREATE INDEX idx_github_profiles_user_id ON public.github_profiles(user_id);
CREATE INDEX idx_leetcode_profiles_user_id ON public.leetcode_profiles(user_id);
CREATE INDEX idx_codeforces_profiles_user_id ON public.codeforces_profiles(user_id);

CREATE INDEX idx_repositories_github_profile_id ON public.repositories(github_profile_id);
CREATE INDEX idx_commit_history_github_profile_id ON public.commit_history(github_profile_id);
CREATE INDEX idx_commit_history_date ON public.commit_history(commit_date);

CREATE INDEX idx_user_problem_history_user_id ON public.user_problem_history(user_id);
CREATE INDEX idx_user_problem_history_status ON public.user_problem_history(status);
CREATE INDEX idx_problems_platform ON public.problems(platform);

CREATE INDEX idx_contest_history_user_id ON public.contest_history(user_id);
CREATE INDEX idx_contest_history_contest_id ON public.contest_history(contest_id);

CREATE INDEX idx_daily_stats_user_date ON public.daily_stats(user_id, date);
CREATE INDEX idx_weekly_stats_user_week ON public.weekly_stats(user_id, week_start);
CREATE INDEX idx_monthly_stats_user_month ON public.monthly_stats(user_id, month_start);

CREATE INDEX idx_ai_reports_user_id ON public.ai_reports(user_id);
CREATE INDEX idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX idx_roadmap_steps_roadmap_id ON public.roadmap_steps(roadmap_id);

CREATE INDEX idx_friend_requests_receiver ON public.friend_requests(receiver);
CREATE INDEX idx_friend_requests_sender ON public.friend_requests(sender);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON public.messages(sent_at);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = FALSE;

CREATE INDEX idx_xp_history_user_id ON public.xp_history(user_id);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leetcode_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codeforces_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_problem_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Users: read public profiles, update own
CREATE POLICY users_select ON public.users FOR SELECT USING (true);
CREATE POLICY users_update ON public.users FOR UPDATE USING (auth.uid() = id);

-- User-owned data: full access to own rows
CREATE POLICY own_refresh_tokens ON public.refresh_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_email_verifications ON public.email_verifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_password_resets ON public.password_resets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_github_profiles ON public.github_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_leetcode_profiles ON public.leetcode_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_codeforces_profiles ON public.codeforces_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_user_problem_history ON public.user_problem_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_contest_history ON public.contest_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_contest_predictions ON public.contest_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_daily_stats ON public.daily_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_weekly_stats ON public.weekly_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_monthly_stats ON public.monthly_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_topic_mastery ON public.topic_mastery FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_ai_reports ON public.ai_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_recommendations ON public.recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_learning_paths ON public.learning_paths FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_roadmaps ON public.roadmaps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_goals ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_bookmarks ON public.bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_user_settings ON public.user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_dashboard_summary ON public.dashboard_summary FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_notifications ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_user_badges ON public.user_badges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_user_achievements ON public.user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY own_xp_history ON public.xp_history FOR ALL USING (auth.uid() = user_id);

-- Public read for reference data
CREATE POLICY problems_read ON public.problems FOR SELECT USING (true);
CREATE POLICY tags_read ON public.tags FOR SELECT USING (true);
CREATE POLICY problem_tags_read ON public.problem_tags FOR SELECT USING (true);
CREATE POLICY contests_read ON public.contests FOR SELECT USING (true);
CREATE POLICY badges_read ON public.badges FOR SELECT USING (true);
CREATE POLICY achievements_read ON public.achievements FOR SELECT USING (true);
CREATE POLICY levels_read ON public.levels FOR SELECT USING (true);
CREATE POLICY languages_read ON public.languages FOR SELECT USING (true);

-- Friends: users see friendships they're part of
CREATE POLICY friends_select ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY friends_insert ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY friends_delete ON public.friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend requests
CREATE POLICY friend_requests_select ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender OR auth.uid() = receiver);
CREATE POLICY friend_requests_insert ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender);
CREATE POLICY friend_requests_update ON public.friend_requests FOR UPDATE
  USING (auth.uid() = receiver OR auth.uid() = sender);

-- Conversations & messages (participants only)
CREATE POLICY conversation_participants_own ON public.conversation_participants FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY conversations_access ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY conversations_insert ON public.conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY messages_select ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY messages_insert ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY messages_update ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- Roadmap steps: access via roadmap ownership
CREATE POLICY roadmap_steps_access ON public.roadmap_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps r
      WHERE r.id = roadmap_steps.roadmap_id AND r.user_id = auth.uid()
    )
  );

-- GitHub repos & commits via profile ownership
CREATE POLICY repositories_access ON public.repositories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.github_profiles gp
      WHERE gp.id = repositories.github_profile_id AND gp.user_id = auth.uid()
    )
  );

CREATE POLICY repository_languages_access ON public.repository_languages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.repositories r
      JOIN public.github_profiles gp ON gp.id = r.github_profile_id
      WHERE r.id = repository_languages.repository_id AND gp.user_id = auth.uid()
    )
  );

CREATE POLICY commit_history_access ON public.commit_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.github_profiles gp
      WHERE gp.id = commit_history.github_profile_id AND gp.user_id = auth.uid()
    )
  );

-- Audit logs: users see own logs only
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- SEED: Default levels
-- =============================================================================
INSERT INTO public.levels (level_number, xp_required, title) VALUES
  (1, 0, 'Beginner'),
  (2, 100, 'Novice'),
  (3, 300, 'Intermediate'),
  (4, 600, 'Advanced'),
  (5, 1000, 'Expert'),
  (6, 1500, 'Master'),
  (7, 2200, 'Grandmaster'),
  (8, 3000, 'Legend');
