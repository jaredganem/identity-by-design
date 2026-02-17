
-- Store raw Deep Dive intake answers for pattern analysis & marketing insights
CREATE TABLE public.identity_intakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  intake_mode TEXT NOT NULL DEFAULT 'advanced',
  outcomes TEXT,
  identity_gaps TEXT,
  blockers TEXT,
  peak_identity TEXT,
  negative_patterns TEXT,
  simple_goals TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.identity_intakes ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (anonymous users, no auth required)
CREATE POLICY "Anyone can submit intake"
ON public.identity_intakes
FOR INSERT
WITH CHECK (true);

-- Only admins can read for analysis
CREATE POLICY "Admins can read intakes"
ON public.identity_intakes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
