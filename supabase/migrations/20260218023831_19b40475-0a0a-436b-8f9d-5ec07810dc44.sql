
-- Create tier enum
CREATE TYPE public.user_tier AS ENUM ('free', 'tier1', 'tier2');

-- Create user_tiers table to track tier status and purchase info
CREATE TABLE public.user_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tier user_tier NOT NULL DEFAULT 'free',
  purchase_date TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_tiers ENABLE ROW LEVEL SECURITY;

-- Users can read their own tier
CREATE POLICY "Users can view own tier"
  ON public.user_tiers FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all tiers
CREATE POLICY "Admins can read all tiers"
  ON public.user_tiers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only service role (webhooks) can insert/update tiers — no user self-promotion
-- No INSERT/UPDATE/DELETE policies for regular users

-- Auto-create a free tier row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_tiers (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_tier
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_tier();

-- Timestamp trigger
CREATE TRIGGER update_user_tiers_updated_at
  BEFORE UPDATE ON public.user_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
