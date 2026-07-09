ALTER TABLE public.email_verifications
ADD COLUMN purpose TEXT NOT NULL DEFAULT 'register'
CHECK (purpose IN ('register', 'login'));

CREATE INDEX idx_email_verifications_user_purpose
ON public.email_verifications(user_id, purpose);
