
-- 1. Affirmation transcripts table (anonymized)
CREATE TABLE public.affirmation_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL,
  category text,
  transcript_text text NOT NULL,
  source text NOT NULL DEFAULT 'guided' -- 'guided', 'freestyle', 'ai_generated'
);

ALTER TABLE public.affirmation_transcripts ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous, no auth required)
CREATE POLICY "Anyone can submit transcripts"
  ON public.affirmation_transcripts FOR INSERT
  WITH CHECK (true);

-- 2. Admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only admins can read transcripts
CREATE POLICY "Admins can read transcripts"
  ON public.affirmation_transcripts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can read roles
CREATE POLICY "Admins can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
