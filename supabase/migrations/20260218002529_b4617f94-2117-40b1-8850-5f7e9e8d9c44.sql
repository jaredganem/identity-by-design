
-- Add unique referral code to each lead
ALTER TABLE public.leads
ADD COLUMN referral_code text UNIQUE DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

-- Backfill existing leads with codes
UPDATE public.leads SET referral_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8) WHERE referral_code IS NULL;

-- Track referrals
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_code text NOT NULL,
  referred_lead_id uuid REFERENCES public.leads(id),
  referred_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Anyone can create a referral (anonymous insert on lead capture)
CREATE POLICY "Anyone can log a referral"
ON public.referrals
FOR INSERT
WITH CHECK (true);

-- Admins can read referrals
CREATE POLICY "Admins can read referrals"
ON public.referrals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_referrals_referrer_code ON public.referrals(referrer_code);
CREATE INDEX idx_leads_referral_code ON public.leads(referral_code);
